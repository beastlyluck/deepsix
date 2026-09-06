"""DC power flow and a cascading-outage model on top of it.

P = B theta, f = diag(1/x) A theta, solved per connected island so a tripped
tie never leaves us with a singular matrix. When a line exceeds its limit it
trips; islands re-solve with proportional shedding. Nodes count as "lost"
when their island cannot cover 70 percent of demand.
"""
import numpy as np
from scipy.sparse import diags
from scipy.sparse.csgraph import connected_components
from scipy.sparse.linalg import spsolve

EMERGENCY = 1.12       # relays let a line ride to 112 percent of its continuous rating


def _solve_island(grid, injection, emask, slack):
    A = grid.incidence(emask)
    Y = diags(1.0 / grid.x[emask])
    B = (A.T @ Y @ A).tocsc()
    keep = np.ones(grid.N, bool)
    keep[slack] = False
    nodes = np.unique(grid.edges[emask])
    keep &= np.isin(np.arange(grid.N), nodes)
    theta = np.zeros(grid.N)
    if keep.any():
        theta[keep] = spsolve(B[keep][:, keep], injection[keep])
    return Y @ (A @ theta)


def solve(grid, injection, mask, balance=True):
    """Full-length line flow vector (zeros on open lines). Islands are balanced
    pro rata so the linear system is consistent; that is a flow estimate, not
    a shedding decision."""
    inj = injection.copy()
    flow = np.zeros(grid.M)
    n_isl, label = connected_components(grid.adjacency(mask), directed=False)
    for isl in range(n_isl):
        nodes = np.where(label == isl)[0]
        if len(nodes) == 1:
            continue
        has_slack = grid.slack in nodes
        if balance and not has_slack:
            gen, dem = inj[nodes].clip(min=0).sum(), -inj[nodes].clip(max=0).sum()
            if gen > 1e-9 and dem > 1e-9:
                if dem > gen:
                    inj[nodes] = np.where(inj[nodes] < 0, inj[nodes] * gen / dem, inj[nodes])
                else:
                    inj[nodes] = np.where(inj[nodes] > 0, inj[nodes] * dem / gen, inj[nodes])
            else:
                inj[nodes] = 0.0
        slack = grid.slack if has_slack else nodes[np.argmax(np.abs(inj[nodes]))]
        emask = mask & np.isin(grid.edges[:, 0], nodes)
        if emask.any():
            flow[emask] = _solve_island(grid, inj, emask, slack)
    return flow, label


def ptdf(grid):
    """Power transfer distribution factors on the intact grid, (M, N)."""
    out = np.zeros((grid.M, grid.N))
    mask = np.ones(grid.M, bool)
    for n in range(grid.N):
        if n == grid.slack:
            continue
        inj = np.zeros(grid.N)
        inj[n], inj[grid.slack] = 1.0, -1.0
        out[:, n] = solve(grid, inj, mask)[0]
    return out


def cascade(grid, injection, trip=(), max_rounds=12):
    """Run the outage. Returns per-node lost flag, final line mask, rounds, tripped list, final flow."""
    inj = injection.copy()
    mask = np.ones(grid.M, bool)
    mask[list(trip)] = False
    lost = np.zeros(grid.N, bool)
    tripped = list(trip)
    flow = np.zeros(grid.M)
    for r in range(max_rounds):
        n_isl, label = connected_components(grid.adjacency(mask), directed=False)
        for isl in range(n_isl):
            nodes = np.where(label == isl)[0]
            if grid.slack in nodes:
                continue
            gen, dem = inj[nodes].clip(min=0).sum(), -inj[nodes].clip(max=0).sum()
            if dem > gen + 1e-9:
                ratio = gen / dem if dem > 0 else 0.0
                lost[nodes] |= (inj[nodes] < 0) & (ratio < 0.7)
        flow, _ = solve(grid, inj, mask)
        over = mask & (np.abs(flow) > EMERGENCY * grid.limit)
        if not over.any():
            return lost, mask, r, tripped, flow
        idx = np.where(over)[0]
        mask[idx] = False
        tripped.extend(idx.tolist())
    return lost, mask, max_rounds, tripped, flow
