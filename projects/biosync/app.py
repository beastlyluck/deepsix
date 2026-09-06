"""Live clinical dashboard. Streamlit + Plotly, reads outputs/ from main.py.

    streamlit run app.py
"""
import json
import os
import sys

import numpy as np
import plotly.graph_objects as go
import streamlit as st

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from edge.engine import Engine

st.set_page_config(page_title="BioSync", layout="wide")
CYAN, GREY = "#0891b2", "#94a3ad"


@st.cache_data
def load():
    return json.load(open(os.path.join(HERE, "outputs", "dashboard.json")))


@st.cache_resource
def engine():
    return Engine(os.path.join(HERE, "outputs", "edge", "weights.npz"))


C = load()
D = C["day"]
N = len(D["cgm"])
hours = np.arange(N) * 5 / 60

st.markdown(f"<div style='color:{CYAN};letter-spacing:.16em;font-size:11px'>BIOSYNC · CONTINUOUS REPLICA · P{D['pid']:03d}</div>", unsafe_allow_html=True)
st.title("One patient, one continuous model, every gap the wearable leaves")

m = C["matrix"]
k = st.columns(5)
k[0].metric("ODE 60-min glucose RMSE", f"{m['0.0']['node']['60m']['glucose_rmse']} mg/dL")
k[1].metric("Recurrent baseline", f"{m['0.0']['esn']['60m']['glucose_rmse']} mg/dL")
k[2].metric("ODE at +60% dropout", f"{m['0.6']['node']['60m']['glucose_rmse']} mg/dL")
k[3].metric("Edge step latency", f"{C['edge']['latency_us_per_step']} µs")
k[4].metric("Cohort release σ at ε=1", f"{C['dp']['sigma_eps1']} mg/dL")

left, right = st.columns([3, 1])
with left:
    fig = go.Figure()
    fig.add_hrect(y0=70, y1=180, fillcolor="#e6f6f9", opacity=0.5, line_width=0)
    fig.add_trace(go.Scatter(x=hours, y=D["truth_g"], name="truth", line=dict(color=GREY, width=1)))
    for p in D["panes"]:
        off = (p["start"] - D["day0"]) * 5 / 60
        fig.add_trace(go.Scatter(x=off + np.arange(len(p["pred"])) * 5 / 60, y=[v[0] for v in p["pred"]],
                                 name="replica", line=dict(color=CYAN, width=2), showlegend=p is D["panes"][0]))
    fig.add_trace(go.Scatter(x=hours, y=D["cgm"], mode="markers", name="CGM", marker=dict(color="#1f2a30", size=4)))
    fig.update_layout(height=280, margin=dict(l=40, r=10, t=10, b=30), yaxis_title="mg/dL", plot_bgcolor="white", legend=dict(orientation="h"))
    st.plotly_chart(fig, use_container_width=True)

    fig2 = go.Figure()
    fig2.add_trace(go.Scatter(x=hours, y=D["truth_hr"], name="truth", line=dict(color=GREY, width=1)))
    for p in D["panes"]:
        off = (p["start"] - D["day0"]) * 5 / 60
        fig2.add_trace(go.Scatter(x=off + np.arange(len(p["pred"])) * 5 / 60, y=[v[1] for v in p["pred"]], line=dict(color=CYAN, width=2), showlegend=False))
    fig2.add_trace(go.Scatter(x=hours, y=D["hr"], mode="markers", name="wearable", marker=dict(color="#1f2a30", size=3)))
    fig2.update_layout(height=180, margin=dict(l=40, r=10, t=10, b=30), yaxis_title="bpm", plot_bgcolor="white", showlegend=False)
    st.plotly_chart(fig2, use_container_width=True)

    st.subheader("Model performance matrix")
    rows = []
    for drop, md in m.items():
        for name, key in (("Neural ODE", "node"), ("Echo-state RNN", "esn"), ("Persistence", "persist")):
            rows.append({"extra dropout": f"+{int(float(drop) * 100)}%", "model": name,
                         **{f"{h} glucose": md[key][h]["glucose_rmse"] for h in ("30m", "60m", "120m")}, "60m HR": md[key]["60m"]["hr_rmse"]})
    st.dataframe(rows, use_container_width=True, hide_index=True)

with right:
    st.subheader("Clinical assistant")
    st.caption("Intent parser over the replica. The LLM slot is a template; the physiology is the exported ODE.")
    if "chat" not in st.session_state:
        st.session_state.chat = []
    eng = engine()
    meal = np.array(D["meal"]); act = np.array(D["act"]); sleep = np.array(D["sleep"])
    kf = np.exp(-5 / 40)
    carbs = np.maximum(0, meal * 100 / kf - np.concatenate([[0], meal[:-1]]) * 100)

    def proxy(c):
        q, out = 0.0, []
        for v in c:
            q = (q + v) * kf
            out.append(q / 100)
        return np.array(out)

    def project(c, a):
        u = np.column_stack([proxy(c), a, sleep, np.zeros((N, 3))])
        z0 = np.array([D["truth_g"][0] / 100, D["truth_hr"][0] / 100, 0, 0])
        return eng.rollout(z0, u, D["pid"])[:, 0] * 100

    q = st.chat_input("skip lunch, walk 30 min at 15:00 ...")
    if q:
        c2, a2, did = carbs.copy(), act.copy(), []
        ql = q.lower()
        windows = {"breakfast": (66, 120), "lunch": (132, 174), "dinner": (204, 258)}
        for mname, (a, b) in windows.items():
            if mname in ql:
                if any(w in ql for w in ("skip", "remove", "no ")):
                    c2[a:b] = 0; did.append(f"removed {mname}")
                elif any(w in ql for w in ("double", "twice", "big")):
                    c2[a:b] *= 2; did.append(f"doubled {mname}")
                elif any(w in ql for w in ("half", "small", "light")):
                    c2[a:b] *= 0.5; did.append(f"halved {mname}")
        import re
        w = re.search(r"(walk|run|exercise)\D*(\d+)\s*min.*?(\d{1,2})(?::(\d{2}))?", ql)
        if w:
            s = (int(w.group(3)) * 60 + int(w.group(4) or 0)) // 5
            a2[s:s + int(w.group(2)) // 5] = 0.9 if w.group(1) == "run" else 0.5
            did.append(f"{w.group(1)} {w.group(2)} min at {w.group(3)}:{w.group(4) or '00'}")
        base, alt = project(carbs, act), project(c2, a2)
        tir = lambda x: int(100 * np.mean((x >= 70) & (x <= 180)))
        ans = (f"**{', '.join(did) or 'no change parsed'}** — peak {alt.max():.0f} mg/dL (baseline {base.max():.0f}), "
               f"time in range {tir(alt)}% (baseline {tir(base)}%), lowest {alt.min():.0f}.") if did else \
              "I can skip / double / halve breakfast, lunch or dinner and add activity like 'walk 30 min at 15:00'."
        st.session_state.chat.append((q, ans, alt if did else None, base))
    for uq, ans, alt, base in st.session_state.chat[-6:]:
        st.chat_message("user").write(uq)
        with st.chat_message("assistant"):
            st.write(ans)
            if alt is not None:
                f3 = go.Figure()
                f3.add_trace(go.Scatter(x=hours, y=base, line=dict(color=GREY, width=1), name="baseline"))
                f3.add_trace(go.Scatter(x=hours, y=alt, line=dict(color=CYAN, width=2), name="scenario"))
                f3.update_layout(height=160, margin=dict(l=30, r=5, t=5, b=20), showlegend=False, plot_bgcolor="white")
                st.plotly_chart(f3, use_container_width=True)

st.divider()
c1, c2, c3 = st.columns(3)
with c1:
    st.subheader("Gap filling")
    st.dataframe([{"method": k_, "RMSE mg/dL": v, "live": k_ != "linear"} for k_, v in C["imputation_rmse"].items()], hide_index=True)
with c2:
    st.subheader("Differential privacy")
    st.dataframe(C["dp"]["rows"], hide_index=True)
with c3:
    st.subheader("Edge and lake")
    st.json({**C["edge"], **C["lake"]})
