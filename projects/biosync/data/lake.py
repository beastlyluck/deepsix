"""Observation lake: one Parquet file per (pseudonym, day).

The device streams over TLS to an ingest that HMACs the device id with a
per-tenant key before anything is stored, so the lake never sees a real id.
Columns are the minimum the models need; there is no free-text field.
"""
import hashlib
import hmac
import os

import numpy as np
import pyarrow as pa
import pyarrow.parquet as pq

# pseudonym is the hive partition key, not a column, so it is never duplicated inside a file
SCHEMA = pa.schema([
    ("day", pa.int16()),
    ("minute", pa.int16()),
    ("cgm_mgdl", pa.float32()),
    ("hr_bpm", pa.float32()),
    ("carbs_g", pa.float32()),
    ("activity", pa.float32()),
    ("asleep", pa.bool_()),
])


def pseudonym(device_id, tenant_key):
    return hmac.new(tenant_key, str(device_id).encode(), hashlib.sha256).hexdigest()[:16]


def write_patient(root, patient, tenant_key):
    pid = pseudonym(patient["id"], tenant_key)
    T = len(patient["G"])
    days = T // 1440
    paths = []
    for d in range(days):
        s = slice(d * 1440, (d + 1) * 1440)
        table = pa.table({
            "day": pa.array(np.full(1440, d, dtype=np.int16)),
            "minute": pa.array(np.arange(1440, dtype=np.int16)),
            "cgm_mgdl": pa.array(patient["cgm"][s].astype(np.float32)),
            "hr_bpm": pa.array(patient["hr"][s].astype(np.float32)),
            "carbs_g": pa.array(patient["carbs"][s].astype(np.float32)),
            "activity": pa.array(patient["act"][s].astype(np.float32)),
            "asleep": pa.array(patient["sleep"][s].astype(bool)),
        }, schema=SCHEMA)
        folder = os.path.join(root, f"pseudonym={pid}")
        os.makedirs(folder, exist_ok=True)
        p = os.path.join(folder, f"day={d:02d}.parquet")
        pq.write_table(table, p, compression="zstd")
        paths.append(p)
    return pid, paths


def coverage(root):
    """Observed fraction per signal across the lake. This is the sparsity the models live with."""
    ds = pq.ParquetDataset(root, partitioning="hive")
    t = ds.read(columns=["minute", "cgm_mgdl", "hr_bpm"])
    minute = t.column("minute").to_numpy()
    cgm = t.column("cgm_mgdl").to_numpy(zero_copy_only=False)[minute % 5 == 0]     # CGM cadence is 5 min
    hr = t.column("hr_bpm").to_numpy(zero_copy_only=False)
    return {"rows": t.num_rows, "cgm_observed": round(float(np.mean(~np.isnan(cgm))), 4),
            "hr_observed": round(float(np.mean(~np.isnan(hr))), 4),
            "bytes": sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(root) for f in fs)}
