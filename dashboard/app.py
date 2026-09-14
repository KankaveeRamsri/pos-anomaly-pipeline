"""
Task 3: Live Analytics Dashboard for the POS anomaly-detection pipeline.

Reads directly from the pos_data Postgres database that the Airflow DAG
loads into. Shows revenue over time with a moving average overlay, and
highlights anomalous transactions (negative amount / duplicate / late
arrival) flagged by the ingestion pipeline.

Local run:
    streamlit run app.py
Configure the DB connection via env vars (see .streamlit/secrets or the
DATABASE_URL fallback below) — defaults match docker-compose's postgres-data
service exposed on localhost:5433.
"""
from __future__ import annotations

import os
import time

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
from sqlalchemy import create_engine, text

st.set_page_config(page_title="POS Anomaly Dashboard", layout="wide")

DEFAULT_DB_URL = "postgresql+psycopg2://pos_user:pos_pass@localhost:5433/pos_data"
try:
    _secret_db_url = st.secrets["DATABASE_URL"]
except (KeyError, FileNotFoundError, st.errors.StreamlitSecretNotFoundError):
    _secret_db_url = None
DB_URL = _secret_db_url or os.environ.get("DATABASE_URL", DEFAULT_DB_URL)


@st.cache_resource
def get_engine():
    return create_engine(DB_URL, pool_pre_ping=True)


@st.cache_data(ttl=15)
def load_transactions() -> pd.DataFrame:
    engine = get_engine()
    with engine.connect() as conn:
        df = pd.read_sql(
            text(
                """
                SELECT transaction_id, store_id, pos_terminal, product_id, product_name,
                       quantity, unit_price, total_amount, event_time, ingested_at,
                       is_anomaly, anomaly_reasons, source_file
                FROM public.pos_transactions
                ORDER BY event_time DESC
                LIMIT 5000
                """
            ),
            conn,
        )
    if not df.empty:
        df["event_time"] = pd.to_datetime(df["event_time"], utc=True).dt.tz_convert("Asia/Bangkok")
    return df


def compute_timeseries(df: pd.DataFrame, freq: str, ma_window: int) -> pd.DataFrame:
    clean = df[~df["is_anomaly"]].copy()
    if clean.empty:
        return pd.DataFrame(columns=["bucket", "revenue", "moving_avg"])
    clean = clean.set_index("event_time").sort_index()
    bucketed = clean["total_amount"].resample(freq).sum().rename("revenue").to_frame()
    bucketed["moving_avg"] = bucketed["revenue"].rolling(window=ma_window, min_periods=1).mean()
    return bucketed.reset_index()


def main():
    st.title("POS Real-Time Analytics & Anomaly Dashboard")

    col_a, col_b, col_c = st.columns([1, 1, 2])
    with col_a:
        freq = st.selectbox("Time bucket", ["1min", "5min", "15min"], index=0)
    with col_b:
        ma_window = st.slider("Moving average window (buckets)", 2, 20, 5)
    with col_c:
        auto_refresh = st.toggle("Auto-refresh every 15s", value=False)

    df = load_transactions()

    if df.empty:
        st.info("No transactions loaded yet. Start the workload generator and let the DAG run.")
        return

    total_revenue = df.loc[~df["is_anomaly"], "total_amount"].sum()
    total_txn = len(df)
    anomaly_count = int(df["is_anomaly"].sum())
    anomaly_pct = (anomaly_count / total_txn * 100) if total_txn else 0

    k1, k2, k3, k4 = st.columns(4)
    k1.metric("Total revenue (clean)", f"{total_revenue:,.0f} THB")
    k2.metric("Transactions loaded", f"{total_txn:,}")
    k3.metric("Flagged anomalies", f"{anomaly_count:,}")
    k4.metric("Anomaly rate", f"{anomaly_pct:.1f}%")

    st.subheader("Revenue over time with moving average")
    ts = compute_timeseries(df, freq, ma_window)
    if not ts.empty:
        fig = go.Figure()
        fig.add_trace(go.Bar(x=ts["event_time"], y=ts["revenue"], name="Revenue"))
        fig.add_trace(go.Scatter(x=ts["event_time"], y=ts["moving_avg"], name=f"Moving avg ({ma_window})", line=dict(width=3)))

        anomalies = df[df["is_anomaly"]]
        if not anomalies.empty:
            fig.add_trace(
                go.Scatter(
                    x=anomalies["event_time"],
                    y=[ts["revenue"].max() * 1.05] * len(anomalies) if not ts.empty else [0] * len(anomalies),
                    mode="markers",
                    name="Anomaly detected",
                    marker=dict(symbol="x", size=10, color="red"),
                )
            )
        fig.update_layout(height=420, legend=dict(orientation="h"))
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("Not enough clean data yet to plot a time series.")

    st.subheader("Anomaly breakdown")
    if anomaly_count:
        reason_counts = (
            df[df["is_anomaly"]]["anomaly_reasons"]
            .str.split(",")
            .explode()
            .value_counts()
            .rename_axis("reason")
            .reset_index(name="count")
        )
        st.plotly_chart(px.bar(reason_counts, x="reason", y="count"), use_container_width=True)
    else:
        st.write("No anomalies flagged in the loaded window.")

    st.subheader("Recent transactions (anomalies highlighted)")

    def highlight_anomaly(row):
        return ["background-color: #ffcccc" if row["is_anomaly"] else "" for _ in row]

    show_df = df.head(200).drop(columns=["ingested_at", "source_file"])
    st.dataframe(show_df.style.apply(highlight_anomaly, axis=1), use_container_width=True, height=500)

    if auto_refresh:
        time.sleep(15)
        st.rerun()


if __name__ == "__main__":
    main()
