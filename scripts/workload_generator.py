"""
Task 1: Advanced Workload & Edge Case Generator for the POS pipeline.

Simulates a realistic POS event stream and writes newline-delimited JSON
batch files into the Airflow landing directory. On top of a steady baseline
rate, it can inject the edge cases the assignment calls out:

  - Flash sale: transaction rate spikes ~10x for a configurable window
  - Late-arriving data: event_time is backdated well before the file's
    ingestion time, simulating network/device delay
  - Duplicate transaction_id: re-emits a transaction_id seen earlier
  - Negative total_amount: a corrupted/adjusted amount that should never
    be negative in a real sale

Usage:
    python workload_generator.py --once                       # single demo batch
    python workload_generator.py --duration 120 --base-rate 3 \
        --flash-sale-at 30 --flash-sale-duration 20 --flash-sale-multiplier 10
"""
from __future__ import annotations

import argparse
import json
import random
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path

STORES = [f"STORE-{i:02d}" for i in range(1, 6)]
TERMINALS = [f"T{i}" for i in range(1, 4)]
PRODUCTS = [
    ("SKU-0001", "Iced Coffee", 45.0),
    ("SKU-0002", "Sandwich", 59.0),
    ("SKU-0003", "Bottled Water", 15.0),
    ("SKU-0004", "Fried Rice", 65.0),
    ("SKU-0005", "Green Tea", 35.0),
    ("SKU-0006", "Croissant", 49.0),
]

BKK_TZ = timezone(timedelta(hours=7))


@dataclass
class GeneratorConfig:
    landing_dir: Path
    base_rate: float  # transactions per second, steady state
    batch_interval: float  # seconds between file flushes
    duration: float  # total run time in seconds
    flash_sale_at: float | None
    flash_sale_duration: float
    flash_sale_multiplier: float
    late_arrival_rate: float
    duplicate_rate: float
    negative_amount_rate: float
    seed: int | None


def make_transaction(now: datetime, txn_id: str | None = None) -> dict:
    store = random.choice(STORES)
    terminal = random.choice(TERMINALS)
    sku, name, unit_price = random.choice(PRODUCTS)
    quantity = random.randint(1, 5)
    total_amount = round(unit_price * quantity, 2)
    return {
        "transaction_id": txn_id or f"TXN-{uuid.uuid4().hex[:12].upper()}",
        "store_id": store,
        "pos_terminal": terminal,
        "product_id": sku,
        "product_name": name,
        "quantity": quantity,
        "unit_price": unit_price,
        "total_amount": total_amount,
        "event_time": now.isoformat(),
    }


def inject_edge_cases(record: dict, now: datetime, cfg: GeneratorConfig, recent_ids: list[str]) -> dict:
    """Mutates a copy of `record` in place with edge-case anomalies, based on configured rates."""
    r = dict(record)

    if recent_ids and random.random() < cfg.duplicate_rate:
        r["transaction_id"] = random.choice(recent_ids)
        r["_injected_anomaly"] = "duplicate_transaction_id"

    if random.random() < cfg.negative_amount_rate:
        r["total_amount"] = -abs(r["total_amount"])
        r["_injected_anomaly"] = r.get("_injected_anomaly", "") or "negative_total_amount"

    if random.random() < cfg.late_arrival_rate:
        delay_minutes = random.randint(5, 45)
        late_time = now - timedelta(minutes=delay_minutes)
        r["event_time"] = late_time.isoformat()
        r["_injected_anomaly"] = r.get("_injected_anomaly", "") or "late_arrival"

    return r


def current_rate(elapsed: float, cfg: GeneratorConfig) -> float:
    if cfg.flash_sale_at is None:
        return cfg.base_rate
    if cfg.flash_sale_at <= elapsed <= cfg.flash_sale_at + cfg.flash_sale_duration:
        return cfg.base_rate * cfg.flash_sale_multiplier
    return cfg.base_rate


def write_batch(records: list[dict], landing_dir: Path) -> Path:
    landing_dir.mkdir(parents=True, exist_ok=True)
    fname = f"pos_batch_{datetime.now(BKK_TZ).strftime('%Y%m%dT%H%M%S_%f')}.jsonl"
    fpath = landing_dir / fname
    tmp_path = fpath.with_suffix(".tmp")
    with tmp_path.open("w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    tmp_path.rename(fpath)  # atomic-ish rename so the sensor never sees a partial file
    return fpath


def run(cfg: GeneratorConfig) -> None:
    if cfg.seed is not None:
        random.seed(cfg.seed)

    start = time.monotonic()
    recent_ids: list[str] = []
    total_written = 0
    total_anomalies = 0

    print(f"[workload_generator] writing batches to {cfg.landing_dir.resolve()}")
    print(
        f"[workload_generator] base_rate={cfg.base_rate}/s duration={cfg.duration}s "
        f"flash_sale_at={cfg.flash_sale_at} x{cfg.flash_sale_multiplier} for {cfg.flash_sale_duration}s"
    )

    while True:
        elapsed = time.monotonic() - start
        if elapsed >= cfg.duration:
            break

        rate = current_rate(elapsed, cfg)
        n_records = max(1, int(round(rate * cfg.batch_interval)))
        now = datetime.now(BKK_TZ)

        batch = []
        for _ in range(n_records):
            base = make_transaction(now)
            rec = inject_edge_cases(base, now, cfg, recent_ids)
            batch.append(rec)
            recent_ids.append(rec["transaction_id"])
            if len(recent_ids) > 200:
                recent_ids.pop(0)
            if "_injected_anomaly" in rec:
                total_anomalies += 1

        write_batch(batch, cfg.landing_dir)
        total_written += len(batch)
        in_flash_sale = rate > cfg.base_rate
        print(
            f"[t={elapsed:6.1f}s] wrote {len(batch):3d} records "
            f"(rate={rate:.1f}/s{' FLASH SALE' if in_flash_sale else ''}) "
            f"total={total_written} anomalies_injected={total_anomalies}"
        )
        time.sleep(cfg.batch_interval)

    print(f"[workload_generator] done. total_records={total_written} anomalies_injected={total_anomalies}")


def build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="POS workload & edge-case generator")
    p.add_argument("--landing-dir", type=str, default="../data/landing")
    p.add_argument("--base-rate", type=float, default=2.0, help="baseline transactions/sec")
    p.add_argument("--batch-interval", type=float, default=5.0, help="seconds between file flushes")
    p.add_argument("--duration", type=float, default=120.0, help="total run time in seconds")
    p.add_argument("--flash-sale-at", type=float, default=None, help="seconds into the run when a flash sale starts")
    p.add_argument("--flash-sale-duration", type=float, default=20.0)
    p.add_argument("--flash-sale-multiplier", type=float, default=10.0)
    p.add_argument("--late-arrival-rate", type=float, default=0.05, help="fraction of records that arrive late")
    p.add_argument("--duplicate-rate", type=float, default=0.03, help="fraction of records reusing a prior transaction_id")
    p.add_argument("--negative-amount-rate", type=float, default=0.03, help="fraction of records with a negative total_amount")
    p.add_argument("--seed", type=int, default=None)
    p.add_argument("--once", action="store_true", help="write a single ~30-record demo batch and exit")
    return p


def main() -> None:
    args = build_arg_parser().parse_args()
    landing_dir = Path(args.landing_dir)

    if args.once:
        cfg = GeneratorConfig(
            landing_dir=landing_dir,
            base_rate=args.base_rate,
            batch_interval=args.batch_interval,
            duration=args.batch_interval,  # exactly one batch
            flash_sale_at=None,
            flash_sale_duration=0,
            flash_sale_multiplier=1,
            late_arrival_rate=args.late_arrival_rate,
            duplicate_rate=args.duplicate_rate,
            negative_amount_rate=args.negative_amount_rate,
            seed=args.seed,
        )
        now = datetime.now(BKK_TZ)
        recent_ids: list[str] = []
        batch = []
        for _ in range(30):
            rec = inject_edge_cases(make_transaction(now), now, cfg, recent_ids)
            recent_ids.append(rec["transaction_id"])
            batch.append(rec)
        path = write_batch(batch, landing_dir)
        print(f"[workload_generator] wrote demo batch of {len(batch)} records -> {path}")
        return

    cfg = GeneratorConfig(
        landing_dir=landing_dir,
        base_rate=args.base_rate,
        batch_interval=args.batch_interval,
        duration=args.duration,
        flash_sale_at=args.flash_sale_at,
        flash_sale_duration=args.flash_sale_duration,
        flash_sale_multiplier=args.flash_sale_multiplier,
        late_arrival_rate=args.late_arrival_rate,
        duplicate_rate=args.duplicate_rate,
        negative_amount_rate=args.negative_amount_rate,
        seed=args.seed,
    )
    run(cfg)


if __name__ == "__main__":
    main()
