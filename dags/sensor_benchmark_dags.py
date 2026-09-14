"""
Task 4 support: three otherwise-identical DAGs, differing only in FileSensor
mode, so scripts/benchmark_sensors.py can isolate the resource/worker-slot
cost of each sensing strategy:

  - benchmark_poke        : FileSensor(mode='poke')       -- holds the worker slot for the whole wait
  - benchmark_reschedule  : FileSensor(mode='reschedule') -- releases the slot between poke_interval ticks
  - benchmark_deferrable  : FileSensor(deferrable=True)   -- releases the slot entirely; triggerer waits instead

Each waits for a trigger file the benchmark script drops in, then runs a
trivial downstream task so the DAG has a comparable measurable duration.
"""
from __future__ import annotations

from datetime import timedelta

import pendulum

from airflow.decorators import dag, task
from airflow.sensors.filesystem import FileSensor

TRIGGER_GLOB = "/opt/airflow/data/benchmark/{name}_trigger.flag"


def _make_benchmark_dag(dag_id: str, mode: str | None, deferrable: bool):

    @dag(
        dag_id=dag_id,
        schedule=None,
        start_date=pendulum.datetime(2026, 1, 1, tz="Asia/Bangkok"),
        catchup=False,
        tags=["benchmark", "sensor", "task4"],
    )
    def _dag():
        sensor_kwargs = dict(
            task_id="wait_for_trigger_file",
            fs_conn_id="fs_default",
            filepath=TRIGGER_GLOB.format(name=dag_id),
            poke_interval=5,
            timeout=60 * 5,
        )
        if deferrable:
            sensor = FileSensor(deferrable=True, **sensor_kwargs)
        else:
            sensor = FileSensor(mode=mode, **sensor_kwargs)

        @task
        def downstream_noop():
            print("trigger file detected, sensor released")

        sensor >> downstream_noop()

    return _dag()


benchmark_poke_dag = _make_benchmark_dag("benchmark_poke", mode="poke", deferrable=False)
benchmark_reschedule_dag = _make_benchmark_dag("benchmark_reschedule", mode="reschedule", deferrable=False)
benchmark_deferrable_dag = _make_benchmark_dag("benchmark_deferrable", mode=None, deferrable=True)
