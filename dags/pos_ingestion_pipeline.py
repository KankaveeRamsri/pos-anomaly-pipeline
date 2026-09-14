"""
Task 2: Resilient Airflow Ingestion Pipeline for POS transactions.

Design notes (see report/architecture_report.md for the full write-up):

- Deferrable FileSensor (deferrable=True) replaces the traditional
  mode='poke' FileSensor. While waiting for the next landing file, the task
  is suspended to the triggerer process and the worker slot is released —
  contrast with 'poke' (slot held for the entire timeout) and 'reschedule'
  (slot released only between poke_interval ticks).
- TaskFlow API (@dag/@task) + XCom carry the file list -> parsed records ->
  load summary -> alert decision through the DAG.
- Idempotency: every reload of the same transaction_id is an
  INSERT ... ON CONFLICT (transaction_id) DO UPDATE, so re-running the DAG
  (or reprocessing a file) never creates duplicate rows. Processed files are
  also moved out of the landing dir so a rerun has nothing left to reprocess.
- Anomalies (negative amount, stale/late event_time, duplicate transaction_id)
  are flagged and logged, not silently dropped, so the source-of-truth table
  stays queryable and the dashboard can highlight them.
"""
from __future__ import annotations

import glob
import json
import os
import shutil
from datetime import datetime, timedelta, timezone

import pendulum

from airflow.decorators import dag, task
from airflow.hooks.base import BaseHook
from airflow.sensors.filesystem import FileSensor

LANDING_DIR = "/opt/airflow/data/landing"
PROCESSED_DIR = "/opt/airflow/data/processed"
CONN_ID = "postgres_data"
LATE_ARRIVAL_THRESHOLD_MINUTES = 5

default_args = {
    "owner": "pos-pipeline",
    "retries": 2,
    "retry_delay": timedelta(minutes=1),
}


def _get_pg_connection():
    import psycopg2

    info = BaseHook.get_connection(CONN_ID)
    return psycopg2.connect(
        host=info.host,
        port=info.port,
        dbname=info.schema,
        user=info.login,
        password=info.password,
    )


@dag(
    dag_id="pos_ingestion_pipeline",
    description="Resilient, idempotent ingestion of POS transactions with anomaly detection and alerting",
    schedule="*/2 * * * *",
    start_date=pendulum.datetime(2026, 1, 1, tz="Asia/Bangkok"),
    catchup=False,
    max_active_runs=1,
    default_args=default_args,
    tags=["pos", "assignment", "deferrable", "taskflow"],
)
def pos_ingestion_pipeline():

    wait_for_new_file = FileSensor(
        task_id="wait_for_new_file",
        fs_conn_id="fs_default",
        filepath=f"{LANDING_DIR}/*.jsonl",
        poke_interval=10,
        timeout=60 * 10,
        mode="poke",
        deferrable=True,  # <-- Deferrable Operator: frees the worker slot while waiting on the trigger
    )

    @task
    def list_landing_files() -> list[str]:
        """Snapshot every batch file currently sitting in the landing dir."""
        files = sorted(glob.glob(f"{LANDING_DIR}/*.jsonl"))
        print(f"[list_landing_files] found {len(files)} file(s): {files}")
        return files

    @task
    def extract_and_validate(files: list[str]) -> dict:
        """Parse every JSON line and tag data-quality anomalies (does not drop rows).

        Late-arrival is judged against each file's landing time (mtime), not the
        wall clock at task-execution time — otherwise a file that sits around (or
        gets reprocessed later) would have every record flip to "late" purely from
        elapsed processing delay, which would make the anomaly flag non-deterministic
        across idempotent reruns of the same file.
        """
        records: list[dict] = []
        seen_in_batch: set[str] = set()

        for fpath in files:
            file_landed_at = datetime.fromtimestamp(os.path.getmtime(fpath), tz=timezone.utc)
            with open(fpath, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    rec = json.loads(line)
                    reasons = []

                    if rec["transaction_id"] in seen_in_batch:
                        reasons.append("duplicate_in_batch")
                    seen_in_batch.add(rec["transaction_id"])

                    if rec.get("total_amount", 0) < 0:
                        reasons.append("negative_total_amount")

                    event_time = datetime.fromisoformat(rec["event_time"])
                    if event_time.tzinfo is None:
                        event_time = event_time.replace(tzinfo=timezone(timedelta(hours=7)))
                    delay = file_landed_at - event_time.astimezone(timezone.utc)
                    if delay > timedelta(minutes=LATE_ARRIVAL_THRESHOLD_MINUTES):
                        reasons.append("late_arrival")

                    rec["_source_file"] = os.path.basename(fpath)
                    rec["_anomaly_reasons"] = reasons
                    records.append(rec)

        n_anomalies = sum(1 for r in records if r["_anomaly_reasons"])
        print(f"[extract_and_validate] parsed {len(records)} records, {n_anomalies} flagged as anomalies")
        return {"records": records, "files": files}

    @task
    def load_to_postgres(payload: dict) -> dict:
        """Idempotent upsert into pos_transactions + append-only anomaly log."""
        records = payload["records"]
        conn = _get_pg_connection()
        cur = conn.cursor()

        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS pos_transactions (
                transaction_id   VARCHAR(64) PRIMARY KEY,
                store_id         VARCHAR(20),
                pos_terminal     VARCHAR(10),
                product_id       VARCHAR(20),
                product_name     VARCHAR(100),
                quantity         NUMERIC,
                unit_price       NUMERIC,
                total_amount     NUMERIC,
                event_time       TIMESTAMPTZ,
                ingested_at      TIMESTAMPTZ DEFAULT now(),
                is_anomaly       BOOLEAN DEFAULT FALSE,
                anomaly_reasons  TEXT,
                source_file      TEXT,
                updated_at       TIMESTAMPTZ DEFAULT now()
            );
            CREATE TABLE IF NOT EXISTS pos_anomalies (
                id               SERIAL PRIMARY KEY,
                transaction_id   VARCHAR(64),
                anomaly_type     VARCHAR(50),
                detail           TEXT,
                detected_at      TIMESTAMPTZ DEFAULT now(),
                UNIQUE (transaction_id, anomaly_type)
            );
            """
        )

        inserted, updated, anomaly_count = 0, 0, 0
        for rec in records:
            is_anomaly = bool(rec["_anomaly_reasons"])
            reasons_str = ",".join(rec["_anomaly_reasons"]) if is_anomaly else None

            cur.execute(
                """
                INSERT INTO pos_transactions
                    (transaction_id, store_id, pos_terminal, product_id, product_name,
                     quantity, unit_price, total_amount, event_time,
                     is_anomaly, anomaly_reasons, source_file, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, now())
                ON CONFLICT (transaction_id) DO UPDATE SET
                    store_id = EXCLUDED.store_id,
                    pos_terminal = EXCLUDED.pos_terminal,
                    product_id = EXCLUDED.product_id,
                    product_name = EXCLUDED.product_name,
                    quantity = EXCLUDED.quantity,
                    unit_price = EXCLUDED.unit_price,
                    total_amount = EXCLUDED.total_amount,
                    event_time = EXCLUDED.event_time,
                    is_anomaly = EXCLUDED.is_anomaly,
                    anomaly_reasons = EXCLUDED.anomaly_reasons,
                    source_file = EXCLUDED.source_file,
                    updated_at = now()
                RETURNING (xmax = 0) AS was_insert;
                """,
                (
                    rec["transaction_id"], rec.get("store_id"), rec.get("pos_terminal"),
                    rec.get("product_id"), rec.get("product_name"), rec.get("quantity"),
                    rec.get("unit_price"), rec.get("total_amount"), rec.get("event_time"),
                    is_anomaly, reasons_str, rec.get("_source_file"),
                ),
            )
            was_insert = cur.fetchone()[0]
            inserted += 1 if was_insert else 0
            updated += 0 if was_insert else 1

            if is_anomaly:
                anomaly_count += 1
                for reason in rec["_anomaly_reasons"]:
                    cur.execute(
                        """
                        INSERT INTO pos_anomalies (transaction_id, anomaly_type, detail)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (transaction_id, anomaly_type) DO NOTHING;
                        """,
                        (rec["transaction_id"], reason, json.dumps(rec)),
                    )

        conn.commit()
        cur.close()
        conn.close()

        summary = {
            "total_records": len(records),
            "inserted": inserted,
            "updated_as_reload": updated,
            "anomaly_count": anomaly_count,
            "files": payload["files"],
        }
        print(f"[load_to_postgres] {summary}")
        return summary

    @task
    def archive_files(summary: dict) -> None:
        """Move processed files out of landing/ so a DAG rerun has nothing left to reprocess."""
        os.makedirs(PROCESSED_DIR, exist_ok=True)
        for fpath in summary["files"]:
            if os.path.exists(fpath):
                shutil.move(fpath, os.path.join(PROCESSED_DIR, os.path.basename(fpath)))
        print(f"[archive_files] moved {len(summary['files'])} file(s) to {PROCESSED_DIR}")

    @task
    def check_and_alert(summary: dict) -> None:
        """Fire a webhook alert when anomalies are found. Falls back to a log-only dry run
        if no TELEGRAM_BOT_TOKEN / SLACK_WEBHOOK_URL is configured."""
        if summary["anomaly_count"] == 0:
            print("[check_and_alert] no anomalies in this batch, skipping alert")
            return

        message = (
            f"POS anomaly alert: {summary['anomaly_count']} anomalous transaction(s) "
            f"out of {summary['total_records']} in this batch "
            f"({summary['inserted']} new, {summary['updated_as_reload']} reloaded)."
        )

        bot_token = os.environ.get("TELEGRAM_BOT_TOKEN")
        chat_id = os.environ.get("TELEGRAM_CHAT_ID")
        slack_webhook = os.environ.get("SLACK_WEBHOOK_URL")

        if bot_token and chat_id:
            import requests

            resp = requests.post(
                f"https://api.telegram.org/bot{bot_token}/sendMessage",
                json={"chat_id": chat_id, "text": message},
                timeout=10,
            )
            print(f"[check_and_alert] Telegram response: {resp.status_code} {resp.text}")
        elif slack_webhook:
            import requests

            resp = requests.post(slack_webhook, json={"text": message}, timeout=10)
            print(f"[check_and_alert] Slack response: {resp.status_code}")
        else:
            print(f"[check_and_alert] DRY RUN (no webhook configured): {message}")

    files = list_landing_files()
    parsed = extract_and_validate(files)
    load_summary = load_to_postgres(parsed)

    wait_for_new_file >> files
    archive_files(load_summary)
    check_and_alert(load_summary)


pos_ingestion_pipeline()
