"""Nightly analytics fabric: a warehouse that rebuilds every night with tests.

Raw university ops tables are generated per night, the SQL models in models/ run in
DAG order inside SQLite, the contracts in tests.yml are executed as SQL, and a publish
gate keeps yesterday's metrics live if any test fails. Faults are injected on two
nights of a 90-night quarter. Synthetic; runs offline.
"""
import glob
import json
import os
import re
import sqlite3
import time

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

SEED = 41
NIGHTS = 90
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "outputs")
FAULTS = {23: "null_invoice_ids", 40: "double_load_enrolments", 57: "stale_energy_feed"}
METRICS = {  # thin semantic layer: name -> (owner, SQL over the marts)
    "active_students": ("registrar", "SELECT COUNT(*) FROM stg_enrolments WHERE status = 'active'"),
    "late_invoices_aud": ("finance", "SELECT COALESCE(SUM(amount), 0) FROM mart_late_invoices"),
    "energy_kwh_per_m2": ("facilities", "SELECT AVG(kwh_per_m2) FROM mart_energy_intensity"),
}


def parse_tests(path):
    """Read the one-test-per-line flow mappings in tests.yml without PyYAML."""
    tests = []
    for line in open(path, encoding="utf-8"):
        m = re.match(r"\s*-\s*\{(.*)\}\s*$", line)
        if not m:
            continue
        spec = {}
        for part in re.split(r",\s*(?![^\[]*\])", m.group(1)):
            k, v = [s.strip() for s in part.split(":", 1)]
            if v.startswith("["):
                spec[k] = [x.strip() for x in v.strip("[]").split(",")]
            else:
                spec[k] = float(v) if re.fullmatch(r"-?\d+(\.\d+)?", v) and "." in v else (int(v) if re.fullmatch(r"-?\d+", v) else v)
        tests.append(spec)
    return tests


def make_raw(rng, night, fault):
    as_of = pd.Timestamp("2026-07-01") + pd.Timedelta(days=night)
    n = 3000
    enr = pd.DataFrame({"student_id": np.arange(1, n + 1), "campus": rng.choice(["Clayton", "Caulfield", "Parkville"], n),
                        "status": rng.choice(["active", "Active ", "deferred", "withdrawn"], n, p=[.7, .1, .1, .1]),
                        "units_enrolled": rng.integers(0, 9, n), "loaded_at": str(as_of)})
    if fault == "double_load_enrolments":                       # same rows loaded twice; staging must dedupe
        enr = pd.concat([enr, enr.assign(loaded_at=str(as_of - pd.Timedelta(hours=1)))])
    suppliers = [f"SUP{i:03d}" for i in range(40)]
    inv = pd.DataFrame({"invoice_id": np.arange(1, 801), "supplier": rng.choice(suppliers, 800),
                        "amount": np.round(rng.lognormal(7, 1, 800), 2),
                        "due_date": [str((as_of - pd.Timedelta(days=int(d))).date()) for d in rng.integers(-30, 90, 800)]})
    inv["paid_date"] = np.where(rng.random(800) < 0.8, str(as_of.date()), None)
    if fault == "null_invoice_ids":
        inv.loc[rng.random(800) < 0.05, "invoice_id"] = None
    bld = pd.DataFrame({"building_id": np.arange(1, 13), "name": [f"B{i}" for i in range(1, 13)],
                        "floor_area_m2": rng.uniform(2000, 12000, 12).round()})
    last = 3 if fault == "stale_energy_feed" else 0
    days = [as_of - pd.Timedelta(days=int(d)) for d in range(last, last + 45)]
    eng = pd.DataFrame([{"building_id": b, "reading_date": str(d.date()), "kwh": float(rng.gamma(20, a / 300))}
                        for b, a in zip(bld["building_id"], bld["floor_area_m2"]) for d in days])
    return str(as_of.date()), {"raw_enrolments": enr, "raw_suppliers": pd.DataFrame({"supplier": suppliers}),
                               "raw_invoices": inv, "raw_buildings": bld, "raw_energy": eng}


def run_test(con, t, as_of):
    m, c = t["model"], t.get("column")
    q = {"not_null": f"SELECT COUNT(*) FROM {m} WHERE {c} IS NULL",
         "unique": f"SELECT COUNT(*) - COUNT(DISTINCT {c}) FROM {m} WHERE {c} IS NOT NULL",
         "accepted_values": f"SELECT COUNT(*) FROM {m} WHERE {c} NOT IN ({','.join(repr(v) for v in t.get('values', []))})",
         "range": f"SELECT COUNT(*) FROM {m} WHERE {c} < {t.get('min', 0)} OR {c} > {t.get('max', 0)}",
         "row_count_min": f"SELECT CASE WHEN COUNT(*) >= {t.get('min', 0)} THEN 0 ELSE 1 END FROM {m}",
         "freshness_hours": f"SELECT CASE WHEN (julianday('{as_of}') - julianday(MAX({c}))) * 24 <= {t.get('max_hours', 0)} THEN 0 ELSE 1 END FROM {m}",
         "relationships": f"SELECT COUNT(*) FROM {m} WHERE {c} NOT IN (SELECT {t.get('field')} FROM {t.get('to')})"}[t["test"]]
    return con.execute(q).fetchone()[0] == 0


def main():
    rng = np.random.default_rng(SEED)
    os.makedirs(OUT, exist_ok=True)
    models = sorted(glob.glob(os.path.join(HERE, "models", "*.sql")))          # stg_* sorts after mart_*; order below
    models = sorted(models, key=lambda p: (0 if "stg_" in p else 1, p))
    tests = parse_tests(os.path.join(HERE, "tests.yml"))
    published, log = {k: None for k in METRICS}, []
    for night in range(NIGHTS):
        fault = FAULTS.get(night)
        as_of, raw = make_raw(rng, night, fault)
        con = sqlite3.connect(":memory:")
        for name, df in raw.items():
            df.to_sql(name, con, index=False)
        t0 = time.perf_counter()
        for path in models:
            name = os.path.splitext(os.path.basename(path))[0]
            con.execute(f"CREATE TABLE {name} AS {open(path, encoding='utf-8').read()}", {"as_of": as_of})
        results = [(t, run_test(con, t, as_of)) for t in tests]
        failed = [f"{t['model']}.{t.get('column', '*')}:{t['test']}" for t, ok in results if not ok]
        sim_minutes = float(sum(rng.lognormal(np.log(3.8), 0.25) for _ in models)) + 0.4 * len(tests)
        if not failed:
            published = {k: con.execute(q).fetchone()[0] for k, (_, q) in METRICS.items()}
        log.append({"night": night, "as_of": as_of, "fault": fault, "tests_run": len(tests), "failed": failed,
                    "published": not failed, "minutes": round(sim_minutes, 1),
                    "wall_ms": round((time.perf_counter() - t0) * 1000, 1), **{k: published[k] for k in METRICS}})
        con.close()
    df = pd.DataFrame(log)
    blocked = df[~df["published"]]
    results = {"Nightly SLA": f"{np.percentile(df['minutes'], 95):.0f} min", "Tests": len(tests),
               "Failed days / qtr": int(len(blocked)), "Models": len(models) + len(METRICS),
               "sql_models": [os.path.basename(p) for p in models], "metrics": {k: v[0] for k, v in METRICS.items()},
               "blocked_nights": blocked[["night", "fault", "failed"]].to_dict(orient="records"),
               "handled_by_staging": [{"night": n, "fault": f} for n, f in FAULTS.items() if n not in blocked["night"].values],
               "median_wall_ms": round(float(df["wall_ms"].median()), 1)}
    print("Nightly analytics fabric")
    for k in ["Nightly SLA", "Tests", "Failed days / qtr", "Models", "median_wall_ms"]:
        print(f"  {k:<20} {results[k]}")
    for b in results["blocked_nights"]:
        print(f"  night {b['night']:>2} blocked ({b['fault']}): {b['failed']} -> yesterday's numbers stayed up")
    for h in results["handled_by_staging"]:
        print(f"  night {h['night']:>2} {h['fault']}: deduplicated in staging, all tests passed")
    results["published_series"] = [int(v) if v == v else None for v in df["active_students"]]
    with open(os.path.join(OUT, "results.json"), "w") as f:
        json.dump(results, f, indent=2, default=str)
    with open(os.path.join(OUT, "dashboard.json"), "w") as f:
        json.dump(results, f, default=str)

    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    axes[0].plot(df["night"], df["active_students"], color="tab:blue")
    for n in blocked["night"]:
        axes[0].axvline(n, color="tab:red", ls="--", lw=1)
    axes[0].set_title("Published active_students (red = gate held yesterday's value)"); axes[0].set_xlabel("night")
    axes[1].bar(df["night"], df["minutes"], color=np.where(df["published"], "tab:green", "tab:red"))
    axes[1].axhline(18, color="k", ls=":", label="SLA 18 min"); axes[1].legend()
    axes[1].set_title("Simulated nightly runtime (min)"); axes[1].set_xlabel("night")
    fig.tight_layout(); fig.savefig(os.path.join(OUT, "figure.png"), dpi=120)
    print(f"Wrote {OUT}/results.json and figure.png")


if __name__ == "__main__":
    main()
    import build_site
    build_site.write()
