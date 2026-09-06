"""A regional microgrid laid out on a plane.

48 buses: 4 wind farms, 6 solar parks, 3 battery sites, 30 load centres,
5 substations (one is the grid tie / slack). Lines connect nearest neighbours
plus a few long ties so the graph is meshed, not a tree. Reactance grows with
length; thermal limits are set from a base-case flow with margin, then a
handful of lines are deliberately tight so cascades have somewhere to start.
"""
import numpy as np
from scipy.sparse import coo_matrix
from scipy.spatial import cKDTree

KIND_COUNTS = [("wind", 4), ("solar", 6), ("battery", 3), ("substation", 5), ("load", 30)]


class Grid:
    def __init__(self, seed=3):
        rng = np.random.default_rng(seed)
        self.kind, xy = [], []
        for k, n in KIND_COUNTS:
            for _ in range(n):
                self.kind.append(k)
                # wind on the western ridge, solar on the eastern plain, loads clustered centre
                if k == "wind":
                    xy.append([rng.uniform(0, 18), rng.uniform(20, 80)])
                elif k == "solar":
                    xy.append([rng.uniform(75, 100), rng.uniform(10, 90)])
                elif k == "load":
                    c = rng.choice([[40, 50], [55, 35], [50, 70]])
                    xy.append(np.array(c) + rng.normal(0, 9, 2))
                else:
                    xy.append([rng.uniform(25, 75), rng.uniform(15, 85)])
        self.xy = np.clip(np.array(xy, dtype=float), 0, 100)
        self.N = len(self.kind)
        self.slack = self.kind.index("substation")
        self.edges = self._mesh(rng)
        self.M = len(self.edges)
        length = np.linalg.norm(self.xy[self.edges[:, 0]] - self.xy[self.edges[:, 1]], axis=1)
        self.x = 0.02 + 0.004 * length                     # per-unit reactance
        self.cap = {"wind": 18.0, "solar": 12.0, "battery": 10.0}
        self.peak_load = rng.uniform(1.5, 6.0, self.N) * (np.array(self.kind) == "load")
        self.limit = None                                  # set by set_limits()

    def _mesh(self, rng):
        tree = cKDTree(self.xy)
        edges = set()
        for i in range(self.N):
            for j in tree.query(self.xy[i], k=4)[1][1:]:
                edges.add((min(i, j), max(i, j)))
        # long ties between substations, and generation to nearest substation
        subs = [i for i, k in enumerate(self.kind) if k == "substation"]
        for a in range(len(subs)):
            for b in range(a + 1, len(subs)):
                if rng.random() < 0.6:
                    edges.add((min(subs[a], subs[b]), max(subs[a], subs[b])))
        for i, k in enumerate(self.kind):
            if k in ("wind", "solar", "battery"):
                j = min(subs, key=lambda s: np.linalg.norm(self.xy[i] - self.xy[s]))
                edges.add((min(i, j), max(i, j)))
        return np.array(sorted(edges))

    def incidence(self, mask=None):
        e = self.edges if mask is None else self.edges[mask]
        m = len(e)
        rows = np.repeat(np.arange(m), 2)
        cols = e.ravel()
        vals = np.tile([1.0, -1.0], m)
        return coo_matrix((vals, (rows, cols)), shape=(m, self.N)).tocsr()

    def adjacency(self, mask=None):
        e = self.edges if mask is None else self.edges[mask]
        a = coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(self.N, self.N))
        return (a + a.T).tocsr()

    def set_limits(self, base_flow, margin=1.35, floor=6.0, tight=6, rng=None):
        """Ratings come from the conductor, not from the base case: a line that
        happens to carry nothing at 18:00 still has a real conductor on it."""
        rng = rng or np.random.default_rng(11)
        lim = np.maximum(np.abs(base_flow) * margin, floor)
        busy = np.argsort(-np.abs(base_flow))[: 3 * tight]
        idx = rng.choice(busy, tight, replace=False)
        lim[idx] = np.abs(base_flow[idx]) * 1.08                    # the weak links, all on busy corridors
        self.limit = lim
        return idx
