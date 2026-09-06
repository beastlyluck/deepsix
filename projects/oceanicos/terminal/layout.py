"""Automated terminal on a plane. Metres.

Quay along y=0 with Q ship-to-shore cranes. Yard is a grid of blocks behind
it, separated by AGV lanes. Gate at the back. The road network is a graph:
lane intersections are nodes, lanes are edges weighted by length. Every crane,
block and the gate hangs off its nearest intersection.
"""
import networkx as nx
import numpy as np

LANE = 30.0            # m between lanes
BLOCK_W, BLOCK_H = 120.0, 60.0
QUAY_Y = 0.0
AGV_SPEED = 5.0        # m/s, ~18 km/h loaded


def _min_dist_polyline(poly, p):
    best = np.inf
    for a, b in zip(poly[:-1], poly[1:]):
        ab, ap = b - a, p - a
        t = np.clip(ap @ ab / max(ab @ ab, 1e-9), 0, 1)
        best = min(best, np.linalg.norm(a + t * ab - p))
    return best


class Layout:
    def __init__(self, cranes=6, rows=4, cols=8, block_cap=600):
        self.Q, self.rows, self.cols = cranes, rows, cols
        self.block_cap = block_cap
        self.crane_xy = np.array([[80 + i * 170.0, QUAY_Y + 20] for i in range(cranes)])
        self.block_xy = np.array([[60 + c * (BLOCK_W + LANE) + BLOCK_W / 2, 140 + r * (BLOCK_H + LANE) + BLOCK_H / 2]
                                  for r in range(rows) for c in range(cols)])
        self.gate_xy = np.array([self.block_xy[:, 0].mean(), 140 + rows * (BLOCK_H + LANE) + 60])
        self.G = self._roads()
        self._paths = dict(nx.all_pairs_dijkstra_path(self.G, weight="w"))
        self._dist = dict(nx.all_pairs_dijkstra_path_length(self.G, weight="w"))

    def _roads(self):
        G = nx.Graph()
        xs = [60 + c * (BLOCK_W + LANE) - LANE / 2 for c in range(self.cols + 1)]
        ys = [140 - LANE / 2 + r * (BLOCK_H + LANE) for r in range(self.rows + 1)] + [QUAY_Y + 50]
        ys = sorted(set(ys))
        for i, x in enumerate(xs):
            for j, y in enumerate(ys):
                G.add_node((i, j), xy=(x, y))
        for i in range(len(xs)):
            for j in range(len(ys)):
                if i + 1 < len(xs):
                    G.add_edge((i, j), (i + 1, j), w=abs(xs[i + 1] - xs[i]))
                if j + 1 < len(ys):
                    G.add_edge((i, j), (i, j + 1), w=abs(ys[j + 1] - ys[j]))
        self.nodes_xy = {n: np.array(G.nodes[n]["xy"]) for n in G}
        self.crane_node = [self.nearest(xy) for xy in self.crane_xy]
        self.block_node = [self.nearest(xy) for xy in self.block_xy]
        self.gate_node = self.nearest(self.gate_xy)
        return G

    def nearest(self, xy):
        return min(self.nodes_xy, key=lambda n: np.linalg.norm(self.nodes_xy[n] - xy))

    def travel_s(self, a, b):
        return self._dist[a][b] / AGV_SPEED + 12.0          # plus turn-in/out

    def path(self, a, b):
        return [self.nodes_xy[n] for n in self._paths[a][b]]

    def block_adjacency(self):
        """Blocks + cranes as one graph for the spatio-temporal model. Lane
        neighbours only: weight exp(-d/120), pruned so a block sees the blocks
        across its lanes and the cranes see the first row."""
        pts = np.vstack([self.block_xy, self.crane_xy])
        d = np.linalg.norm(pts[:, None] - pts[None], axis=-1)
        W = np.exp(-d / 120.0)
        np.fill_diagonal(W, 0)
        W[W < 0.2] = 0
        return W

    def route_adjacency(self, near=100.0):
        """Directed flow graph from the actual routes. W[i, j] = share of crane->block_j
        routes that pass within `near` m of block i, so P·inbound_j is the traffic about
        to drive past i. Crane columns: share of that crane's routes passing i."""
        nb, pts = len(self.block_xy), np.vstack([self.block_xy, self.crane_xy])
        W = np.zeros((len(pts), len(pts)))
        for c in range(self.Q):
            for j in range(nb):
                poly = np.array(self.path(self.crane_node[c], self.block_node[j]))
                for i in range(nb):
                    if i == j:
                        continue
                    if _min_dist_polyline(poly, self.block_xy[i]) < near:
                        W[i, j] += 1.0 / self.Q
                        W[i, nb + c] += 1.0 / nb
        return W

    def to_dict(self):
        return {"cranes": self.crane_xy.round(1).tolist(), "blocks": self.block_xy.round(1).tolist(),
                "block_w": BLOCK_W, "block_h": BLOCK_H, "gate": self.gate_xy.round(1).tolist(),
                "cap": self.block_cap, "rows": self.rows, "cols": self.cols,
                "roads": [[self.nodes_xy[a].round(1).tolist(), self.nodes_xy[b].round(1).tolist()] for a, b in self.G.edges]}
