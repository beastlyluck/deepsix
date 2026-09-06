"""Event store for the DES log. DuckDB when available, sqlite otherwise; the
SQL is the same. Multi-scale ingestion lands here: second-level lifts,
5-minute snapshots, and per-call vessel records share one file."""
import json
import sqlite3

try:
    import duckdb
except ImportError:
    duckdb = None

DDL = [
    "CREATE TABLE IF NOT EXISTS events (run TEXT, t INTEGER, kind TEXT, payload TEXT)",
    "CREATE TABLE IF NOT EXISTS snapshots (run TEXT, t INTEGER, moves INTEGER, gate_out INTEGER, payload TEXT)",
    "CREATE TABLE IF NOT EXISTS kpis (run TEXT, name TEXT, value REAL)",
]


class Store:
    def __init__(self, path):
        self.engine = "duckdb" if duckdb else "sqlite"
        self.con = duckdb.connect(path + ".duckdb") if duckdb else sqlite3.connect(path + ".sqlite")
        for d in DDL:
            self.con.execute(d)

    def write_run(self, run, term):
        self.con.execute("DELETE FROM events WHERE run = ?", (run,))
        self.con.execute("DELETE FROM snapshots WHERE run = ?", (run,))
        self.con.execute("DELETE FROM kpis WHERE run = ?", (run,))
        self.con.executemany("INSERT INTO events VALUES (?,?,?,?)",
                             [(run, e["t"], e["kind"], json.dumps({k: v for k, v in e.items() if k not in ("t", "kind")})) for e in term.log])
        self.con.executemany("INSERT INTO snapshots VALUES (?,?,?,?,?)",
                             [(run, int(s["t"]), s["moves"], s["out"], json.dumps(s)) for s in term.snaps])
        k = term.kpis()
        self.con.executemany("INSERT INTO kpis VALUES (?,?,?)",
                             [(run, n, float(v)) for n, v in k.items() if isinstance(v, (int, float)) and v is not None])
        if not duckdb:
            self.con.commit()

    def snapshots(self, run):
        cur = self.con.execute("SELECT payload FROM snapshots WHERE run = ? ORDER BY t", (run,))
        return [json.loads(r[0]) for r in cur.fetchall()]

    def events_between(self, run, t0, t1):
        cur = self.con.execute("SELECT t, kind, payload FROM events WHERE run = ? AND t >= ? AND t < ? ORDER BY t", (run, t0, t1))
        return [{"t": r[0], "kind": r[1], **json.loads(r[2])} for r in cur.fetchall()]

    def summary(self):
        e = self.con.execute("SELECT COUNT(*) FROM events").fetchone()[0]
        s = self.con.execute("SELECT COUNT(*) FROM snapshots").fetchone()[0]
        return {"engine": self.engine, "events": e, "snapshots": s}

    def close(self):
        self.con.close()
