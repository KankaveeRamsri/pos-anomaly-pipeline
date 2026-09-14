#!/usr/bin/env bash
# Creates the Airflow connections the DAGs need. Run once after `docker-compose up -d`
# and after airflow-init has finished (webserver responding).
set -euo pipefail

WEB="docker-compose exec -T airflow-webserver"

echo ">>> waiting for airflow-webserver to be ready..."
until $WEB airflow db check >/dev/null 2>&1; do sleep 3; done

echo ">>> creating/updating connection: postgres_data"
$WEB airflow connections delete postgres_data >/dev/null 2>&1 || true
$WEB airflow connections add postgres_data \
    --conn-type postgres \
    --conn-host postgres-data \
    --conn-schema "${DATA_POSTGRES_DB:-pos_data}" \
    --conn-login "${DATA_POSTGRES_USER:-pos_user}" \
    --conn-password "${DATA_POSTGRES_PASSWORD:-pos_pass}" \
    --conn-port 5432

echo ">>> ensuring fs_default connection points at container root (needed by FileSensor)"
$WEB airflow connections delete fs_default >/dev/null 2>&1 || true
$WEB airflow connections add fs_default --conn-type fs --conn-extra '{"path": "/"}'

echo ">>> unpausing DAGs"
$WEB airflow dags unpause pos_ingestion_pipeline || true

echo ">>> done."
