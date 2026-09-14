# Architectural Report & Performance Analysis

## Task 4.1 — Benchmark: FileSensor(poke) vs FileSensor(reschedule) vs Deferrable Operator

### Methodology

Three otherwise-identical DAGs (`dags/sensor_benchmark_dags.py`) each wait on a
trigger file that does not exist yet, using one of the three sensing
strategies. `scripts/benchmark_sensors.py` triggers each DAG, withholds the
trigger file for `WAIT_SECONDS = 30`, and every 5 seconds samples:

- the sensor task's Airflow state (`running`, `up_for_reschedule`, `deferred`)
- `docker stats` CPU% for the `airflow-scheduler` and `airflow-triggerer`
  containers (LocalExecutor runs tasks as subprocesses of the scheduler
  container, so scheduler CPU is a proxy for worker-slot / process load)

After the wait window, the trigger file is dropped so all three DAGs can
complete, and the final DAG run state is recorded.

### Results

*(raw data: `report/benchmark_results.csv`, produced by an actual run of
`scripts/benchmark_sensors.py` against the docker-compose stack in this repo)*

| Sensor mode | Task state while waiting | Worker slot held? | Who does the waiting |
|---|---|---|---|
| `mode='poke'` | `running` for the entire `poke_interval` loop | **Yes** — occupies a worker slot the whole time | scheduler/executor process |
| `mode='reschedule'` | alternates `up_for_reschedule` ↔ `running` | **Released between pokes**, briefly re-acquired to check | scheduler re-queues the task each interval |
| `deferrable=True` | `deferred` immediately after the first check | **No** — task instance is asleep, no slot | `airflow-triggerer` (asyncio event loop) |

This is the qualitative result that matters at any scale: `poke` monopolizes
a worker slot for the full sensor timeout regardless of how idle the wait
actually is; `reschedule` frees the slot but still round-trips through the
scheduler's task-queueing overhead on every poke; `deferrable` hands the
wait off entirely to the triggerer, which can hold thousands of concurrent
waits in one lightweight asyncio process because a suspended trigger costs
only a coroutine, not a worker slot or a database-backed task-instance
heartbeat cycle.

**Resource implication for scaling ingestion**: with N concurrent
file-landing DAG runs, `poke` needs N worker slots just to sit idle,
`reschedule` needs N scheduler round-trips per poke_interval, and
`deferrable` needs a small, roughly constant amount of triggerer memory —
this is exactly why AIP-52 (deferrable operators) was introduced, and why
Task 2 uses `deferrable=True` on the landing-file sensor instead of the
traditional poke sensor.

### Numeric results from this run

Actual measured run (`report/benchmark_results.csv`, `scripts/benchmark_sensors.py`,
docker-compose stack in this repo, 2026-09-14):

| dag_id | task_states_seen | avg scheduler CPU% | avg triggerer CPU% | final state |
|---|---|---|---|---|
| benchmark_poke | `running` (whole wait) | 10.71% | 1.71% | success |
| benchmark_reschedule | `up_for_reschedule` | 21.19% | 2.02% | success |
| benchmark_deferrable | `deferred` | 13.87% | 5.35% | success |

The `task_states_seen` column is the reliable, deterministic result and
matches the design expectation exactly: `poke` never leaves `running`,
`reschedule` sits in `up_for_reschedule` between polls, and `deferrable`
moves to `deferred` — visibly off the worker entirely — confirming the
triggerer picked up the wait instead of a worker slot.

The CPU% deltas above are **not** a reliable signal at this scale and
should not be over-interpreted: this was a single DAG run waiting on a
single container pair on a laptop, so scheduler CPU is dominated by
Airflow's own housekeeping (DAG file parsing, heartbeats) rather than the
sensor's wait strategy — note `reschedule` shows *higher* scheduler CPU
than `poke` here, which is the opposite of the textbook expectation,
because each reschedule cycle forces a scheduler requeue+parse pass while
a poke sensor's busy-loop happens inside an already-running worker
process. The state-occupancy result (which state the task sits in, and
therefore whether a worker slot is held) is the number that actually
predicts behavior at scale — with dozens or hundreds of concurrent DAG
runs waiting, `poke` needs one worker slot per wait regardless of CPU
usage, `reschedule` needs one scheduler requeue per run per poke_interval,
and `deferrable` needs none of either; only the triggerer's asyncio loop
scales with wait count. A fairer CPU comparison would need many
concurrent waiting DAG runs per mode, which is future work noted here
rather than claimed from this run.

## Task 4.2 — Scalability Proposal: scaling to 10,000 transactions/second

The current design (file landing -> Airflow DAG -> single Postgres,
row-store OLTP schema) tops out long before 10,000 TPS: a file-sensor-driven
batch DAG has scheduler/parsing overhead per run, and a row-store Postgres
with per-row `INSERT ... ON CONFLICT` does not have the write throughput or
the columnar scan performance an anomaly-detection dashboard needs at that
volume. To get to 10,000 TPS, the following components change:

| Layer | Current (this assignment) | At 10,000 TPS |
|---|---|---|
| Ingestion transport | Files dropped on a shared filesystem, detected by FileSensor | **Apache Kafka** (or Kinesis/Pub-Sub) topic per POS event stream; producers are the POS terminals/edge gateways, not batch file writers |
| Orchestration | Airflow DAG runs every 2 min, batch-processes whatever landed | Airflow keeps a role, but for *operational/scheduled* work (compaction, daily rollups, ML retraining) — **not** in the hot path. The hot path becomes a **stream processor** (Kafka Streams / Flink / Spark Structured Streaming) doing continuous consume -> validate -> upsert |
| Deferrable/async waiting | FileSensor(deferrable=True) | Consumer-group based streaming has no "waiting for a file" step at all — this whole concern disappears once transport is a log, replaced by consumer lag monitoring |
| Idempotency | `INSERT ... ON CONFLICT (transaction_id) DO UPDATE` in Postgres | Kafka's **exactly-once semantics** (idempotent producers + transactional consumer-to-sink writes) upstream, plus the sink table keeps an idempotency key (transaction_id) so replays are still safe — belt and suspenders, not either/or |
| Storage for analytics | Postgres (row-store OLTP) | **Columnar/OLAP store** — ClickHouse, Apache Druid, or BigQuery — for the append-heavy, aggregate-heavy anomaly/dashboard workload. Keep a small row-store (or just Kafka + compacted topic) only for point lookups / dedup state, not for analytical queries |
| Anomaly detection | Per-DAG-run Python task, batch-scoped | **Streaming anomaly detection**: a Flink/Kafka Streams job computing rolling stats (moving average, z-score) per store/product *continuously*, emitting anomaly events to their own Kafka topic, rather than recomputing per micro-batch |
| Alerting | Airflow task posts to Telegram/Slack per DAG run | A dedicated **alerting consumer** on the anomaly topic — decouples alert delivery latency from ingestion batch cadence, and can fan out to multiple channels/on-call systems |
| Dashboard | Streamlit polling Postgres every few seconds | Dashboard queries the OLAP store directly, or subscribes to a materialized view (e.g. ClickHouse materialized view, or Druid real-time ingestion) so it reflects sub-second-fresh aggregates instead of polling |
| Partitioning/scale-out | Single Postgres instance | Kafka topics partitioned by `store_id` (natural sharding key with even load); OLAP store sharded/replicated across nodes; stream processor scales by adding consumer instances per partition |

**Why this order of changes matters**: the single biggest bottleneck at
10,000 TPS is *file-based transport + row-store point-writes*, not the
orchestrator. Airflow's deferrable operators solve the "don't waste a
worker slot waiting" problem at hundreds-of-DAG-runs scale; at
10,000-events-per-second scale the unit of work is no longer "a DAG run per
file", it's "a continuously running stream job", so the architecture change
is qualitative (batch -> streaming), not just a bigger Postgres instance.
