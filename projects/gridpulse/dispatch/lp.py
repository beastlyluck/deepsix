"""Load balancing as one LP over 24 hours, solved with HiGHS via scipy.

Variables per hour: renewable dispatch (curtailable), battery charge and
discharge, state of charge, load shed per load bus, grid-tie import/export.
Line flows are linear in injections through the PTDF matrix, so thermal
limits are plain inequality rows. Limits can be tightened per line per hour
by the PINN's dynamic rating.
"""
import numpy as np
from scipy.optimize import linprog
from scipy.sparse import lil_matrix

COST = {"import": 80.0, "export": -20.0, "curtail": 50.0, "shed": 1000.0, "cycle": 5.0}
BATT_E, BATT_P, ETA = 40.0, 10.0, 0.92


def build(grid, ptdf, avail, demand, limits):
    """avail: (H, G) MW available per renewable, demand: (H, L), limits: (H, M)."""
    kind = np.array(grid.kind)
    gens = np.where(np.isin(kind, ["wind", "solar"]))[0]
    batts = np.where(kind == "battery")[0]
    loads = np.where(kind == "load")[0]
    H, G, Bn, L = avail.shape[0], len(gens), len(batts), len(loads)
    # variable layout per hour: g(G) | ch(Bn) | dis(Bn) | soc(Bn) | shed(L) | imp(1) | exp(1)
    per = G + 3 * Bn + L + 2
    nv = H * per
    off = lambda h, blk: h * per + blk
    G0, CH0, DI0, SOC0, SH0, IMP, EXP = 0, G, G + Bn, G + 2 * Bn, G + 3 * Bn, G + 3 * Bn + L, G + 3 * Bn + L + 1

    c = np.zeros(nv)
    lb, ub = np.zeros(nv), np.full(nv, np.inf)
    for h in range(H):
        c[off(h, G0):off(h, G0) + G] = -COST["curtail"]          # reward using renewables
        c[off(h, CH0):off(h, CH0) + Bn] = COST["cycle"]
        c[off(h, DI0):off(h, DI0) + Bn] = COST["cycle"]
        c[off(h, SH0):off(h, SH0) + L] = COST["shed"]
        c[off(h, IMP)], c[off(h, EXP)] = COST["import"], COST["export"]
        ub[off(h, G0):off(h, G0) + G] = avail[h]
        ub[off(h, CH0):off(h, CH0) + Bn] = BATT_P
        ub[off(h, DI0):off(h, DI0) + Bn] = BATT_P
        ub[off(h, SOC0):off(h, SOC0) + Bn] = BATT_E
        ub[off(h, SH0):off(h, SH0) + L] = demand[h]

    # equalities: power balance per hour, SoC dynamics
    Aeq = lil_matrix((H + H * Bn, nv))
    beq = np.zeros(H + H * Bn)
    r = 0
    for h in range(H):
        Aeq[r, off(h, G0):off(h, G0) + G] = 1
        Aeq[r, off(h, DI0):off(h, DI0) + Bn] = 1
        Aeq[r, off(h, CH0):off(h, CH0) + Bn] = -1
        Aeq[r, off(h, SH0):off(h, SH0) + L] = 1
        Aeq[r, off(h, IMP)], Aeq[r, off(h, EXP)] = 1, -1
        beq[r] = demand[h].sum()
        r += 1
        for b in range(Bn):
            Aeq[r, off(h, SOC0) + b] = 1
            Aeq[r, off(h, CH0) + b] = -ETA
            Aeq[r, off(h, DI0) + b] = 1 / ETA
            if h > 0:
                Aeq[r, off(h - 1, SOC0) + b] = -1
            else:
                beq[r] = BATT_E * 0.5
            r += 1

    # inequalities: |PTDF @ inj| <= limit
    M = grid.M
    Aub = lil_matrix((2 * H * M, nv))
    bub = np.zeros(2 * H * M)
    r = 0
    for h in range(H):
        Pg, Pb, Pl, Ps = ptdf[:, gens], ptdf[:, batts], ptdf[:, loads], ptdf[:, grid.slack]
        base = -(Pl @ demand[h])                                    # demand is fixed negative injection
        for sign in (1, -1):
            rows = slice(r, r + M)
            Aub[rows, off(h, G0):off(h, G0) + G] = sign * Pg
            Aub[rows, off(h, DI0):off(h, DI0) + Bn] = sign * Pb
            Aub[rows, off(h, CH0):off(h, CH0) + Bn] = -sign * Pb
            Aub[rows, off(h, SH0):off(h, SH0) + L] = sign * Pl
            Aub[rows, off(h, IMP)] = sign * Ps
            Aub[rows, off(h, EXP)] = -sign * Ps
            bub[rows] = limits[h] - sign * base
            r += M
    layout = dict(per=per, G=G, Bn=Bn, L=L, gens=gens, batts=batts, loads=loads,
                  G0=G0, CH0=CH0, DI0=DI0, SOC0=SOC0, SH0=SH0, IMP=IMP, EXP=EXP)
    return c, Aub.tocsr(), bub, Aeq.tocsr(), beq, np.column_stack([lb, ub]), layout


def solve(grid, ptdf, avail, demand, limits):
    c, Aub, bub, Aeq, beq, bounds, lay = build(grid, ptdf, avail, demand, limits)
    res = linprog(c, A_ub=Aub, b_ub=bub, A_eq=Aeq, b_eq=beq, bounds=bounds, method="highs")
    if not res.success:
        raise RuntimeError(res.message)
    H = avail.shape[0]
    x = res.x.reshape(H, lay["per"])
    sched = {
        "gen": x[:, lay["G0"]:lay["G0"] + lay["G"]],
        "charge": x[:, lay["CH0"]:lay["CH0"] + lay["Bn"]],
        "discharge": x[:, lay["DI0"]:lay["DI0"] + lay["Bn"]],
        "soc": x[:, lay["SOC0"]:lay["SOC0"] + lay["Bn"]],
        "shed": x[:, lay["SH0"]:lay["SH0"] + lay["L"]],
        "import": x[:, lay["IMP"]], "export": x[:, lay["EXP"]],
    }
    return sched, res.fun, lay
