# POS Real-Time Pipeline & Anomaly Detection

Enterprise POS event pipeline: Task 1 workload generator -> Task 2 resilient
Airflow ingestion (deferrable sensor, TaskFlow API, idempotent upserts,
alerting) -> Task 3 Streamlit dashboard -> Task 4 benchmark + architecture
report.

## 1. Start the stack

```bash
docker-compose up -d
bash scripts/init_connections.sh   # creates the postgres_data + fs_default Airflow connections
```

Airflow UI: http://localhost:8080 (admin/admin)

## 2. Generate workload (Task 1)

```bash
cd scripts
python3 -m venv .venv && source .venv/bin/activate
pip install -r ../dashboard/requirements.txt  # or just: pip install faker (none needed, stdlib only)

# one quick demo batch
python workload_generator.py --once --landing-dir ../data/landing

# a full run with a flash sale at t=30s and edge cases mixed in
python workload_generator.py --landing-dir ../data/landing --duration 180 \
    --base-rate 2 --flash-sale-at 30 --flash-sale-duration 20 --flash-sale-multiplier 10 \
    --late-arrival-rate 0.05 --duplicate-rate 0.03 --negative-amount-rate 0.03
```

The DAG `pos_ingestion_pipeline` is scheduled every 2 minutes and unpaused
by `init_connections.sh`; it will pick up whatever lands in `data/landing/`.
Trigger it manually to see it react immediately:

```bash
docker-compose exec airflow-webserver airflow dags trigger pos_ingestion_pipeline
```

Re-run the DAG (or re-drop the same file) as many times as you like —
`ON CONFLICT (transaction_id) DO UPDATE` means the row count never grows
from a rerun.

## 3. Alerting

Set `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` (or `SLACK_WEBHOOK_URL`) in
`.env` before `docker-compose up` to get real alerts. Without them,
`check_and_alert` logs the same message in dry-run mode — check the task
logs in the Airflow UI.

## 4. Dashboard (Task 3)

```bash
cd dashboard
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
streamlit run app.py
```

Defaults to `postgresql://pos_user:pos_pass@localhost:5433/pos_data`
(the `postgres-data` container's exposed port). Override with
`DATABASE_URL` env var or `.streamlit/secrets.toml` for deployment.

**Public HTTPS deployment**: push this repo to GitHub, then deploy
`dashboard/app.py` on Streamlit Community Cloud (share.streamlit.io) —
free HTTPS domain, no extra infra. Add `DATABASE_URL` as a secret pointing
at a reachable Postgres instance (Community Cloud cannot reach your
laptop's Docker network, so the DB needs to be reachable — e.g. a small
managed Postgres, or a tunnel). This step needs your own GitHub/Streamlit
account, so it isn't something to automate for you — ask if you'd like a
hand walking through it.

## 5. Benchmark + report (Task 4)

```bash
docker-compose exec airflow-webserver airflow dags unpause benchmark_poke
docker-compose exec airflow-webserver airflow dags unpause benchmark_reschedule
docker-compose exec airflow-webserver airflow dags unpause benchmark_deferrable
python3 scripts/benchmark_sensors.py
```

Results land in `report/benchmark_results.csv`. See
`report/architecture_report.md` for the write-up (methodology, results
interpretation, and the 10,000 TPS scalability proposal).

## Project layout

```
dags/pos_ingestion_pipeline.py    Task 2 — main ingestion DAG
dags/sensor_benchmark_dags.py     Task 4 — poke/reschedule/deferrable comparison DAGs
scripts/workload_generator.py     Task 1
scripts/benchmark_sensors.py      Task 4 — benchmark harness
scripts/init_connections.sh       one-time Airflow connection setup
dashboard/app.py                  Task 3
report/architecture_report.md     Task 4 — report
```
