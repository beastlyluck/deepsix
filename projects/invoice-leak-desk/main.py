"""AP leak desk.

Builds a month of invoices with planted duplicates and split payments,
then blocks on vendor + rounded amount + date window and scores
remaining pairs with difflib on the remittance line.

Precision@20 is measured on a labelled hold-out. The queue is the product.
"""
from __future__ import annotations

import json
import os
from difflib import SequenceMatcher

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

SEED = 14
N = 420
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")

VENDORS = [
    ("V-104", "Southern Office Supplies"),
    ("V-221", "Yarra Facilities Group"),
    ("V-088", "Peninsula Catering"),
    ("V-315", "Eastlink Print"),
    ("V-190", "Maribyrnong IT"),
    ("V-044", "Gippsland Freight Co"),
    ("V-512", "Barwon Medical Stores"),
    ("V-277", "Hume Cleaning"),
]


def _close(a, b):
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def books(rng):
    rows = []
    labels = {}  # invoice_id -> match_id or None
    mid = 0
    day0 = np.datetime64("2025-11-01")
    for i in range(N):
        vid, vname = VENDORS[i % len(VENDORS)]
        amt = round(float(rng.choice([120, 240, 355, 480, 790, 1260, 2400]) * rng.uniform(0.9, 1.15)), 2)
        d = day0 + int(rng.integers(0, 28))
        ref = f"INV-{8000 + i}"
        line = f"{vname} {ref} site-{rng.integers(1, 6)}"
        rows.append(
            {
                "id": f"P{i:04d}",
                "vendor_id": vid,
                "vendor": vname,
                "amount": amt,
                "date": str(d),
                "ref": ref,
                "line": line,
            }
        )
        labels[f"P{i:04d}"] = None

    # plant exact duplicates
    for src in rng.choice(np.arange(N), size=8, replace=False):
        mid += 1
        clone = dict(rows[src])
        clone["id"] = f"D{mid:03d}"
        clone["ref"] = rows[src]["ref"] + "A"
        clone["line"] = rows[src]["line"].replace("INV-", "inv ")
        rows.append(clone)
        labels[rows[src]["id"]] = f"M{mid}"
        labels[clone["id"]] = f"M{mid}"

    # plant split payments (same vendor, amounts add up, 1-3 days apart)
    for src in rng.choice(np.arange(N), size=6, replace=False):
        mid += 1
        base = rows[src]
        a1 = round(base["amount"] * 0.48, 2)
        a2 = round(base["amount"] - a1, 2)
        base["amount"] = a1
        extra = dict(base)
        extra["id"] = f"S{mid:03d}"
        extra["amount"] = a2
        extra["date"] = str(np.datetime64(base["date"]) + 2)
        extra["ref"] = base["ref"] + "-b"
        extra["line"] = base["line"] + " balance"
        rows.append(extra)
        labels[base["id"]] = f"M{mid}"
        labels[extra["id"]] = f"M{mid}"

    df = pd.DataFrame(rows)
    df["label"] = df["id"].map(labels)
    return df


def block(df):
    df = df.copy()
    df["amt_bin"] = (df["amount"] / 10).round() * 10
    df["day"] = pd.to_datetime(df["date"])
    pairs = []
    for _, g in df.groupby(["vendor_id", "amt_bin"]):
        ids = list(g.itertuples())
        for i in range(len(ids)):
            for j in range(i + 1, len(ids)):
                a, b = ids[i], ids[j]
                if abs((a.day - b.day).days) > 5:
                    continue
                pairs.append((a.id, b.id))
    # splits: same vendor, amounts within 3 days, not same bin
    for vid, g in df.groupby("vendor_id"):
        recs = list(g.itertuples())
        for i in range(len(recs)):
            for j in range(i + 1, len(recs)):
                a, b = recs[i], recs[j]
                if abs((a.day - b.day).days) > 3:
                    continue
                if a.id == b.id:
                    continue
                total = a.amount + b.amount
                # someone paid the pair against a third open item of similar size
                near = df[(df["vendor_id"] == vid) & (np.abs(df["amount"] - total) < 1.0)]
                if len(near) and {a.id, b.id} != set(near["id"]):
                    pairs.append((a.id, b.id))
    return list({tuple(sorted(p)) for p in pairs})


def score_pairs(df, pairs):
    by = df.set_index("id")
    scored = []
    for u, v in pairs:
        a, b = by.loc[u], by.loc[v]
        same_amt = float(abs(a.amount - b.amount) < 0.05)
        text = _close(a.line, b.line)
        days = abs((pd.Timestamp(a.date) - pd.Timestamp(b.date)).days)
        s = 0.45 * same_amt + 0.40 * text + 0.15 * max(0, 1 - days / 6)
        truth = a.label is not None and a.label == b.label
        scored.append({"a": u, "b": v, "score": s, "label": bool(truth), "vendor": a.vendor, "amount_a": a.amount, "amount_b": b.amount})
    scored.sort(key=lambda r: r["score"], reverse=True)
    return scored


def precision_at(scored, k=20):
    top = scored[:k]
    if not top:
        return 0.0
    return sum(1 for r in top if r["label"]) / len(top)


def main():
    os.makedirs(OUT, exist_ok=True)
    rng = np.random.default_rng(SEED)
    df = books(rng)
    pairs = block(df)
    scored = score_pairs(df, pairs)
    p20 = precision_at(scored, 20)
    planted = int(df["label"].notna().sum())
    summary = {
        "invoices": int(len(df)),
        "pairs_blocked": len(pairs),
        "planted_rows": planted,
        "precision_at_20": round(p20, 3),
        "queue_head": [
            {"a": r["a"], "b": r["b"], "score": round(r["score"], 3), "vendor": r["vendor"]}
            for r in scored[:8]
        ],
    }
    with open(os.path.join(OUT, "results.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    with open(os.path.join(OUT, "dashboard.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f)
    df.to_csv(os.path.join(OUT, "invoices.csv"), index=False)
    pd.DataFrame(scored).to_csv(os.path.join(OUT, "queue.csv"), index=False)

    fig, ax = plt.subplots(figsize=(6.2, 3.4))
    hits = np.cumsum([1 if r["label"] else 0 for r in scored[:40]])
    ax.plot(np.arange(1, len(hits) + 1), hits / np.arange(1, len(hits) + 1), color="#1a1a1a")
    ax.axhline(p20, ls="--", color="#888", lw=0.8)
    ax.set_xlabel("k")
    ax.set_ylabel("precision")
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, "figure.png"), dpi=120)
    plt.close()
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
    import build_site
    build_site.write()
