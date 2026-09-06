"""Shift board. Run after main.py so outputs/flow.csv exists.

streamlit run app.py
"""
from pathlib import Path

import pandas as pd
import streamlit as st

OUT = Path(__file__).parent / "outputs"
CAMPUSES = ("Alfred", "Royal Melbourne", "Monash Clayton", "Austin")

st.set_page_config(page_title="ED flow — VIC campuses", layout="wide")
st.title("ED flow")
st.caption("Last 24 hours on the synthetic board. Not a live feed.")

if not (OUT / "flow.csv").exists():
    st.error("Run `python main.py` first.")
    st.stop()

df = pd.read_csv(OUT / "flow.csv")
day = st.sidebar.select_slider("Day", options=sorted(df["day"].unique()), value=int(df["day"].max()))
cut = df[df["day"] == day]

cols = st.columns(4)
for col, campus in zip(cols, CAMPUSES):
    g = cut[cut["campus"] == campus]
    wait = g["wait_min"].median()
    ramp = int(g["ramping"].max())
    occ = 100 * g["occupancy"].mean() / g["bays"].iloc[0]
    col.metric(campus, f"{wait:.0f} min", f"ramp {ramp} · occ {occ:.0f}%")

st.subheader("Occupancy vs bays")
wide = cut.pivot_table(index="hour", columns="campus", values="occupancy")
st.line_chart(wide)

st.subheader("4-hour risk list")
risk = (
    cut[cut["at_risk_4h"] == 1]
    .groupby("campus")
    .agg(slots=("at_risk_4h", "sum"), peak_wait=("wait_min", "max"), peak_ramp=("ramping", "max"))
    .sort_values("slots", ascending=False)
)
if risk.empty:
    st.write("No campus spent a slot over 180 minutes wait.")
else:
    st.dataframe(risk, use_container_width=True)

st.subheader("Ramping")
st.bar_chart(cut.groupby("campus")["ramping"].max())
