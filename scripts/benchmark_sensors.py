"""
Task 4: Benchmark Report harness.

Triggers each of the three sensor-benchmark DAGs (poke / reschedule /
deferrable — see dags/sensor_benchmark_dags.py), keeps the trigger file
withheld for a fixed WAIT_SECONDS so every mode is actually forced to wait,
and samples `docker stats` on the scheduler + triggerer containers while it
waits. Results are written to report/benchmark_results.csv.

Must be run from the host, with the stack already up:
    docker-compose up -d
    bash scripts/init_connections.sh
    python scripts/benchmark_sensors.py
"""
from __future__ import annotations

import csv
import subprocess
import time
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
COMPOSE = ["docker-compose", "-p", "pos-anomaly-pipeline"]
WAIT_SECONDS = 30
DAGS = ["benchmark_poke", "benchmark_reschedule", "benchmark_deferrable"]
CONTAINERS = ["airflow-scheduler", "airflow-triggerer"]


def sh(cmd: list[str], **kwargs) -> str:
    result = subprocess.run(cmd, cwd=PROJECT_DIR, capture_output=True, text=True, **kwargs)
    if result.returncode != 0:
        print(f"[warn] command failed: {' '.join(cmd)}\n{result.stderr}")
    return result.stdout.strip()


def docker_stats_sample() -> dict:
    """One-shot docker stats sample for the relevant containers."""
    out = sh(
        [
            "docker", "stats", "--no-stream", "--format",
            "{{.Name}},{{.CPUPerc}},{{.MemUsage}}",
        ]
    )
    sample = {}
    for line in out.splitlines():
        parts = line.split(",")
        if len(parts) != 3:
            continue
        name, cpu, mem = parts
        for c in CONTAINERS:
            if c in name:
                sample[c] = {"cpu": cpu, "mem": mem}
    return sample


def clear_trigger_file(dag_id: str) -> Path:
    bench_dir = PROJECT_DIR / "data" / "benchmark"
    bench_dir.mkdir(parents=True, exist_ok=True)
    f = bench_dir / f"{dag_id}_trigger.flag"
    if f.exists():
        f.unlink()
    return f


def run_id_state(dag_id: str, run_id: str) -> str:
    out = sh(COMPOSE + ["exec", "-T", "airflow-webserver", "airflow", "dags", "list-runs", "-d", dag_id, "-o", "plain"])
    for line in out.splitlines():
        if run_id in line:
            return line.split()[2] if len(line.split()) > 2 else "unknown"
    return "unknown"


def sensor_task_state(dag_id: str, run_id: str, task_id: str = "wait_for_trigger_file") -> str:
    out = sh(
        COMPOSE + [
            "exec", "-T", "airflow-webserver", "airflow", "tasks", "state",
            dag_id, task_id, run_id,
        ]
    )
    return out.splitlines()[-1].strip() if out else "unknown"


def benchmark_one(dag_id: str) -> dict:
    print(f"\n=== benchmarking {dag_id} ===")
    trigger_file = clear_trigger_file(dag_id)
    run_id = f"bench_{int(time.time())}"

    sh(COMPOSE + ["exec", "-T", "airflow-webserver", "airflow", "dags", "trigger", dag_id, "-r", run_id])

    samples = []
    states_seen = set()
    start = time.monotonic()
    while time.monotonic() - start < WAIT_SECONDS:
        time.sleep(5)
        stats = docker_stats_sample()
        state = sensor_task_state(dag_id, run_id)
        states_seen.add(state)
        samples.append({"t": round(time.monotonic() - start, 1), "task_state": state, **stats})
        print(f"  t={samples[-1]['t']:>5}s state={state} stats={stats}")

    # release the sensor by dropping the trigger file, then wait for the run to finish
    trigger_file.write_text("go")
    final_state = "unknown"
    for _ in range(30):
        time.sleep(3)
        final_state = run_id_state(dag_id, run_id)
        if final_state in ("success", "failed"):
            break

    avg_cpu = {}
    for c in CONTAINERS:
        vals = [float(s[c]["cpu"].strip("%")) for s in samples if c in s and s[c].get("cpu")]
        avg_cpu[c] = round(sum(vals) / len(vals), 2) if vals else None

    return {
        "dag_id": dag_id,
        "run_id": run_id,
        "wait_seconds": WAIT_SECONDS,
        "task_states_seen": ",".join(sorted(states_seen)),
        "final_dag_run_state": final_state,
        "avg_cpu_scheduler_pct": avg_cpu.get("airflow-scheduler"),
        "avg_cpu_triggerer_pct": avg_cpu.get("airflow-triggerer"),
    }


def main():
    results = [benchmark_one(dag_id) for dag_id in DAGS]

    out_csv = PROJECT_DIR / "report" / "benchmark_results.csv"
    out_csv.parent.mkdir(parents=True, exist_ok=True)
    with out_csv.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(results[0].keys()))
        writer.writeheader()
        writer.writerows(results)

    print(f"\n=== results written to {out_csv} ===")
    for r in results:
        print(r)


if __name__ == "__main__":
    main()
