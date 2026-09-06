"""Spatio-temporal model for AGV arrivals per yard block.

Diffusion convolution (DCRNN-style) on the yard graph gives the spatial
part: P = D^-1 W, features are [X, PX, P^2X] stacked with L temporal lags.
The readout is gradient boosting - LightGBM when installed, scikit-learn's
histogram GBM otherwise. No learned message-passing weights; that keeps the
whole model refittable on the terminal box between shifts.

Target: AGV traffic density around each block over the next 15 / 30 / 60
minutes (busy AGVs within 150 m, averaged over the horizon). Traffic flows
along lanes from cranes to blocks, so a block's future density depends on
what its neighbours are receiving now: that is what the graph should add.
Baselines: same features with K=0 (no graph), and persistence (current density).
"""
import numpy as np
from sklearn.metrics import mean_absolute_error

try:
    from lightgbm import LGBMRegressor as GBM
    _GBM_KW = dict(n_estimators=300, learning_rate=0.05, num_leaves=31, verbose=-1)
except ImportError:
    from sklearn.ensemble import HistGradientBoostingRegressor as GBM
    _GBM_KW = dict(max_iter=300, learning_rate=0.05, max_leaf_nodes=31)

HORIZONS = {"15m": 3, "30m": 6, "60m": 12}        # in 5-min snapshots
LAGS = 6


def diffusion(W):
    d = W.sum(1, keepdims=True)
    d[d == 0] = 1
    return W / d


RADIUS = 150.0
_XY = {"cap": 600.0}


def set_geometry(block_xy, crane_xy, block_cap=600):
    _XY["pts"] = np.vstack([block_xy, crane_xy])
    _XY["cap"] = float(block_cap)


def density(snap, n_nodes):
    """Busy AGVs within RADIUS of each node centre."""
    pts = _XY["pts"]
    busy = np.array([xy for xy, b, _ in snap["agv"] if b], float).reshape(-1, 2)
    if not len(busy):
        return np.zeros(n_nodes)
    d = np.linalg.norm(pts[:, None] - busy[None], axis=-1)
    return (d < RADIUS).sum(1).astype(float)


def node_series(snaps, n_blocks, Q):
    """(T, N, F) per-node features and (T, n_blocks) traffic density. Nodes = blocks then cranes."""
    T, N = len(snaps), n_blocks + Q
    X = np.zeros((T, N, 5))
    dens = np.zeros((T, n_blocks))
    for t, s in enumerate(snaps):
        d = density(s, N)
        X[t, :n_blocks, 0] = np.array(s["occ"]) / _XY["cap"]
        X[t, :n_blocks, 1] = np.array(s["inbound"])
        X[t, n_blocks:, 2] = np.array(s["queue"])
        X[t, :, 3] = d
        X[t, :, 4] = np.sin(2 * np.pi * (s["t"] / 3600) / 24)
        dens[t] = d[:n_blocks]
    return X, dens


def build(X, arrivals, P, K, n_blocks):
    T, N, F = X.shape
    hops = [X]
    cur = X
    for _ in range(K):
        cur = np.einsum("ij,tjf->tif", P, cur)
        hops.append(cur)
    H = np.concatenate(hops, axis=-1)                              # (T, N, F*(K+1))
    rows, ys = [], {h: [] for h in HORIZONS}
    hmax = max(HORIZONS.values())
    for t in range(LAGS, T - hmax):
        lagged = H[t - LAGS + 1:t + 1, :n_blocks].transpose(1, 0, 2).reshape(n_blocks, -1)
        rows.append(lagged)
        for h, k in HORIZONS.items():
            ys[h].append(arrivals[t + 1:t + 1 + k].mean(0))
    Xf = np.concatenate(rows, 0)
    Y = {h: np.concatenate(v) for h, v in ys.items()}
    return Xf, Y, len(rows)


def fit_eval(snaps, W, n_blocks, Q, k_values=(0, 2), train_frac=0.7):
    X, arrivals = node_series(snaps, n_blocks, Q)
    P = diffusion(W)
    out = {}
    for K in k_values:
        Xf, Y, T_eff = build(X, arrivals, P, K, n_blocks)
        split = int(T_eff * train_frac) * n_blocks
        res = {}
        for h in HORIZONS:
            m = GBM(**_GBM_KW).fit(Xf[:split], Y[h][:split])
            pred = np.maximum(m.predict(Xf[split:]), 0)
            res[h] = round(float(mean_absolute_error(Y[h][split:], pred)), 3)
        out[f"K={K}"] = res
    # persistence: current density carried forward
    _, Y, T_eff = build(X, arrivals, P, 0, n_blocks)
    split = int(T_eff * train_frac) * n_blocks
    last = np.concatenate([arrivals[t] for t in range(LAGS, len(X) - max(HORIZONS.values()))])
    out["persistence"] = {h: round(float(mean_absolute_error(Y[h][split:], last[split:])), 3) for h in HORIZONS}
    return out


class Congestion:
    """Live scorer for the Matrix policy: expected arrivals per block over the next 15 min."""

    def __init__(self, W, n_blocks, Q, K=2):
        self.P, self.n, self.Q, self.K = diffusion(W), n_blocks, Q, K
        self.model, self.hist = None, []

    def fit(self, snaps):
        X, arrivals = node_series(snaps, self.n, self.Q)
        Xf, Y, _ = build(X, arrivals, self.P, self.K, self.n)
        self.model = GBM(**_GBM_KW).fit(Xf, Y["15m"])
        return self

    def __call__(self, T):
        if self.model is None or len(T.snaps) < LAGS:
            return np.array(T.snaps[-1]["inbound"], float) if T.snaps else np.zeros(self.n)
        X, _ = node_series(T.snaps[-LAGS:], self.n, self.Q)
        hops, cur = [X], X
        for _ in range(self.K):
            cur = np.einsum("ij,tjf->tif", self.P, cur)
            hops.append(cur)
        H = np.concatenate(hops, -1)
        feats = H[:, :self.n].transpose(1, 0, 2).reshape(self.n, -1)
        return np.maximum(self.model.predict(feats), 0)
