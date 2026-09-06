"""Discrete-event terminal. Heap of (time, seq, event). Seconds.

Processes:
  vessel     arrives, gets a berth window, its cranes discharge boxes one by one
  crane      finishes a box every cycle if an AGV is waiting under it, else stalls
  agv        assigned to a box: drive to crane, load, drive to block, unload, free
  block      stacks boxes until capacity; each box leaves via gate after its dwell
  policy     called on every free-AGV / new-box event to pick pairings and blocks

SimPy would do this in fewer lines; the heap is here so the sim runs on the
terminal's air-gapped box with nothing but the standard library and numpy.
"""
import heapq
from collections import defaultdict

import numpy as np

CYCLE_S = 110.0          # crane move cycle when an AGV is under the hook
SNAP_S = 300.0           # state snapshot cadence


class Container:
    __slots__ = ("id", "vessel", "line", "dwell_s", "block", "born", "crane", "vessel_ref")

    def __init__(self, cid, vessel, line, dwell_s, crane):
        self.id, self.vessel, self.line, self.dwell_s, self.crane = cid, vessel, line, dwell_s, crane
        self.block, self.born, self.vessel_ref = None, None, None


class AGV:
    __slots__ = ("id", "node", "busy", "path", "t0", "t1", "carrying", "empty_m", "loaded_m")

    def __init__(self, aid, node):
        self.id, self.node, self.busy, self.carrying = aid, node, False, None
        self.path, self.t0, self.t1 = None, 0.0, 0.0
        self.empty_m = self.loaded_m = 0.0

    def xy(self, t, layout):
        if self.path is None or t >= self.t1:
            return layout.nodes_xy[self.node]
        f = (t - self.t0) / max(self.t1 - self.t0, 1e-6)
        pts = self.path
        seg = np.cumsum([0] + [np.linalg.norm(pts[i + 1] - pts[i]) for i in range(len(pts) - 1)])
        s = f * seg[-1]
        k = int(np.searchsorted(seg, s, side="right") - 1)
        k = min(max(k, 0), len(pts) - 2)
        g = (s - seg[k]) / max(seg[k + 1] - seg[k], 1e-6)
        return pts[k] + g * (pts[k + 1] - pts[k])


class Terminal:
    def __init__(self, layout, policy, vessels, n_agvs=16, seed=0, horizon_s=48 * 3600):
        self.L, self.policy, self.rng = layout, policy, np.random.default_rng(seed)
        self.horizon = horizon_s
        self.t, self.seq, self.heap = 0.0, 0, []
        self.agvs = [AGV(i, layout.gate_node) for i in range(n_agvs)]
        self.block_occ = np.zeros(len(layout.block_xy), int)
        self.crane_queue = defaultdict(list)          # crane -> containers waiting for an AGV
        self.crane_busy_until = np.zeros(layout.Q)
        self.crane_stall_s = np.zeros(layout.Q)
        self.vessels = vessels
        self.berths, self.waiting = [None, None], []
        self.moves, self.gate_out, self.log, self.snaps = 0, 0, [], []
        self.pending_out = []                          # (leave_time, block)
        self.turnaround = {}
        for v in vessels:
            self.schedule(v["eta_s"], ("vessel", v))
        self.schedule(0.0, ("snap",))

    def schedule(self, t, ev):
        self.seq += 1
        heapq.heappush(self.heap, (t, self.seq, ev))

    def event(self, kind, **kw):
        self.log.append({"t": round(self.t), "kind": kind, **kw})

    # ---- processes
    def run(self):
        while self.heap:
            self.t, _, ev = heapq.heappop(self.heap)
            if self.t > self.horizon:
                break
            getattr(self, "on_" + ev[0])(*ev[1:])
        return self

    def on_vessel(self, v):
        """Two berths, three cranes each. A vessel that finds both taken waits at anchor."""
        v.setdefault("arrived", self.t)
        free = [i for i, b in enumerate(self.berths) if b is None]
        if not free:
            self.waiting.append(v)
            self.event("anchor", vessel=v["name"])
            return
        berth = free[0]
        self.berths[berth] = v
        v["berth"], v["berthed"] = berth, self.t
        v["cranes"] = [3 * berth + i for i in range(v["n_cranes"])]
        self.event("berth", vessel=v["name"], berth=berth, cranes=v["cranes"], boxes=v["boxes"],
                   waited_h=round((self.t - v["arrived"]) / 3600, 2))
        per = np.array_split(np.arange(v["boxes"]), len(v["cranes"]))
        v["remaining"] = {c: len(ids) for c, ids in zip(v["cranes"], per)}
        for c in v["cranes"]:
            self.schedule(self.t + 60, ("crane_cycle", c, v))

    def on_crane_cycle(self, c, v):
        """Crane lands the next box on the hook. It cannot start another cycle
        until an AGV has taken this one, so a missing AGV stalls the crane."""
        if v["remaining"][c] <= 0:
            v["left_cranes"] = v.get("left_cranes", 0) + 1
            if v["left_cranes"] == len(v["cranes"]):
                self.turnaround[v["name"]] = (self.t - v["arrived"]) / 3600
                self.event("depart", vessel=v["name"], hours=round(self.turnaround[v["name"]], 2))
                self.berths[v["berth"]] = None
                if self.waiting:
                    self.schedule(self.t + 1800, ("vessel", self.waiting.pop(0)))     # 30 min to shift berths
            return
        dwell = float(self.rng.lognormal(v["dwell_mu"], 0.45)) * 86400
        box = Container(f"{v['name']}-{v['remaining'][c]}", v["name"], v["line"], dwell, c)
        box.born = self.t                      # ready on the hook at born + CYCLE_S
        box.vessel_ref = v
        self.crane_queue[c].append(box)
        self.policy.dispatch(self)

    def assign(self, agv, box, block):
        """Policy calls this. AGV drives to crane, then block."""
        box.block = block
        agv.busy, agv.carrying = True, box
        self.crane_queue[box.crane].remove(box)
        a, b = agv.node, self.L.crane_node[box.crane]
        dt = self.L.travel_s(a, b)
        agv.path, agv.t0, agv.t1 = [np.array(p) for p in self.L.path(a, b)], self.t, self.t + dt
        agv.empty_m += self.L._dist[a][b]
        self.schedule(self.t + dt, ("at_crane", agv))

    def on_at_crane(self, agv):
        box = agv.carrying
        agv.node = self.L.crane_node[box.crane]
        wait = box.born + CYCLE_S - self.t
        if wait > 0:
            self.schedule(self.t + wait, ("at_crane", agv))            # arrived before the hook
            return
        stall = max(0.0, self.t - (box.born + CYCLE_S))
        self.crane_stall_s[box.crane] += stall
        if stall > 30:
            self.event("stall", crane=box.crane, agv=agv.id, seconds=round(stall))
        v = box.vessel_ref
        v["remaining"][box.crane] -= 1
        self.schedule(self.t, ("crane_cycle", box.crane, v))     # hook free: next box lands in CYCLE_S
        a, b = agv.node, self.L.block_node[box.block]
        dt = self.L.travel_s(a, b) + 25
        agv.path, agv.t0, agv.t1 = [np.array(p) for p in self.L.path(a, b)], self.t, self.t + dt
        agv.loaded_m += self.L._dist[a][b]
        self.event("lift", box=box.id, crane=box.crane, agv=agv.id, block=box.block)
        self.schedule(self.t + dt, ("at_block", agv))

    def on_at_block(self, agv):
        box = agv.carrying
        agv.node = self.L.block_node[box.block]
        self.block_occ[box.block] += 1
        self.moves += 1
        heapq.heappush(self.pending_out, (self.t + box.dwell_s, box.block))
        self.schedule(self.t + box.dwell_s, ("gate_out", box.block))
        agv.busy, agv.carrying, agv.path = False, None, None
        self.policy.dispatch(self)

    def on_gate_out(self, block):
        self.block_occ[block] -= 1
        self.gate_out += 1

    def on_snap(self):
        self.snaps.append({
            "t": self.t,
            "agv": [(a.xy(self.t, self.L).round(1).tolist(), int(a.busy), a.carrying.block if a.carrying else None) for a in self.agvs],
            "occ": self.block_occ.tolist(),
            "queue": [len(self.crane_queue[c]) for c in range(self.L.Q)],
            "berths": [b["name"] if b else None for b in self.berths], "anchored": len(self.waiting),
            "moves": self.moves, "out": self.gate_out,
            "inbound": self._inbound(),
        })
        self.schedule(self.t + SNAP_S, ("snap",))

    def _inbound(self):
        n = np.zeros(len(self.L.block_xy), int)
        for a in self.agvs:
            if a.carrying is not None and a.carrying.block is not None:
                n[a.carrying.block] += 1
        return n.tolist()

    # ---- results
    def kpis(self):
        hours = self.t / 3600
        empty = sum(a.empty_m for a in self.agvs)
        loaded = sum(a.loaded_m for a in self.agvs)
        return {"moves": self.moves, "moves_per_hour": round(self.moves / hours, 1),
                "crane_stall_min_per_crane": round(float(self.crane_stall_s.sum()) / 60 / self.L.Q, 1),
                "agv_empty_share": round(empty / max(empty + loaded, 1), 3),
                "yard_peak_saturation": round(float(max(s["occ"][i] for s in self.snaps for i in range(len(self.L.block_xy))) / self.L.block_cap), 3),
                "vessel_turnaround_h": {k: round(v, 2) for k, v in self.turnaround.items()},
                "mean_turnaround_h": round(float(np.mean(list(self.turnaround.values()))), 2) if self.turnaround else None}
