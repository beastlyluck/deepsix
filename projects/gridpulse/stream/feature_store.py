"""Feature store the SGC scorer reads. Columnar on DuckDB when present; the
same SQL runs on sqlite so the pipeline never hard-fails on a substation box.
"""
import os
import sqlite3

try:
    import duckdb
except ImportError:
    duckdb = None

DDL = """
CREATE TABLE IF NOT EXISTS bus_features (
  bus_id INTEGER, window_start INTEGER, window_end INTEGER,
  inj_mean REAL, inj_abs REAL, live_degree REAL, inc_loading_sum REAL,
  inc_loading_max REAL, near_trip REAL, n_lines_hot REAL, all_good INTEGER
);
CREATE TABLE IF NOT EXISTS node_risk (
  bus_id INTEGER, window_end INTEGER, risk REAL, model_sha TEXT
);
"""


class FeatureStore:
    def __init__(self, path):
        self.engine = "duckdb" if duckdb else "sqlite"
        if duckdb:
            self.con = duckdb.connect(path + ".duckdb")
        else:
            self.con = sqlite3.connect(path + ".sqlite")
        for stmt in DDL.strip().split(";"):
            if stmt.strip():
                self.con.execute(stmt)

    def write_features(self, rows):
        q = "INSERT INTO bus_features VALUES (?,?,?,?,?,?,?,?,?,?,?)"
        if duckdb:
            self.con.executemany(q, rows)
        else:
            self.con.executemany(q, rows)
            self.con.commit()

    def write_risk(self, rows):
        self.con.executemany("INSERT INTO node_risk VALUES (?,?,?,?)", rows)
        if not duckdb:
            self.con.commit()

    def latest_features(self, window_end):
        cur = self.con.execute(
            "SELECT bus_id, inj_mean, inj_abs, live_degree, inc_loading_sum, inc_loading_max, near_trip, n_lines_hot "
            "FROM bus_features WHERE window_end = ? ORDER BY bus_id", (window_end,))
        return cur.fetchall()

    def summary(self):
        n = self.con.execute("SELECT COUNT(*) FROM bus_features").fetchone()[0]
        r = self.con.execute("SELECT COUNT(*) FROM node_risk").fetchone()[0]
        return {"engine": self.engine, "feature_rows": n, "risk_rows": r}

    def close(self):
        self.con.close()
