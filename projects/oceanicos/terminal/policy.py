"""Two ways to hand boxes to AGVs and blocks.

Greedy    first waiting box, nearest free AGV, nearest block with room.
Matrix    every dispatch call solves an assignment over all free AGVs and all
          waiting boxes (Hungarian), cost = empty travel to the crane + the
          box's block leg + a congestion penalty on the block predicted by the
          spatio-temporal model. Block choice uses the dwell forecast: long
          stayers go deep, short stayers stay near the gate.
"""
import numpy as np
from scipy.optimize import linear_sum_assignment


class Greedy:
    name = "greedy"

    def dispatch(self, T):
        free = [a for a in T.agvs if not a.busy]
        for c in range(T.L.Q):
            while T.crane_queue[c] and free:
                box = T.crane_queue[c][0]
                cn = T.L.crane_node[c]
                agv = min(free, key=lambda a: T.L.travel_s(a.node, cn))
                free.remove(agv)
                room = np.where(T.block_occ + np.array(T._inbound()) < T.L.block_cap)[0]
                block = int(room[np.argmin([T.L.travel_s(cn, T.L.block_node[b]) for b in room])])
                T.assign(agv, box, block)


class Matrix:
    name = "matrix"

    def __init__(self, layout, congestion_fn=None, dwell_fn=None, w_congest=25.0):
        self.L = layout
        self.congestion_fn = congestion_fn or (lambda T: np.zeros(len(layout.block_xy)))
        self.dwell_fn = dwell_fn or (lambda box: box.dwell_s)
        self.w = w_congest
        gate = layout.gate_node
        self.depth = np.array([layout.travel_s(gate, n) for n in layout.block_node])   # gate distance per block
        self.depth = (self.depth - self.depth.min()) / (self.depth.max() - self.depth.min() + 1e-9)

    def choose_block(self, T, box, congest, slack):
        """slack in [0,1]: 1 = AGVs to spare, spend travel on yard shape; 0 = cranes
        starving, shortest leg wins and only saturation still matters."""
        inbound = np.array(T._inbound())
        room = T.block_occ + inbound < T.L.block_cap
        fill = (T.block_occ + inbound) / T.L.block_cap
        dwell_days = self.dwell_fn(box) / 86400
        want_deep = np.clip(dwell_days / 6.0, 0, 1)                 # 6+ days -> deep in the yard
        cn = T.L.crane_node[box.crane]
        leg = np.array([T.L.travel_s(cn, n) for n in T.L.block_node])
        cost = leg + slack * (60 * np.abs(self.depth - want_deep) + self.w * congest) + 250 * fill ** 3
        cost[~room] = np.inf
        return int(np.argmin(cost)), leg

    def dispatch(self, T):
        free = [a for a in T.agvs if not a.busy]
        boxes = [b for c in range(T.L.Q) for b in T.crane_queue[c]]
        if not free or not boxes:
            return
        congest = self.congestion_fn(T)
        slack = float(np.clip((len(free) - len(boxes)) / max(len(T.agvs) * 0.3, 1), 0, 1))
        blocks, cost = [], np.zeros((len(free), len(boxes)))
        for j, box in enumerate(boxes):
            blk, leg = self.choose_block(T, box, congest, slack)
            blocks.append(blk)
            cn = T.L.crane_node[box.crane]
            ready_in = max(box.born + 110.0 - T.t, 0.0)
            stalling = max(T.t - (box.born + 110.0), 0.0)
            for i, a in enumerate(free):
                # empty travel only; the block leg is the box's problem, not the pairing's.
                # lateness against the hook is what stalls a crane, so it is the cost. A box
                # already on the hook is stalling now; without the age term the solver
                # prefers boxes that are not ready yet and starves the ones that are.
                tr = T.L.travel_s(a.node, cn)
                cost[i, j] = max(tr - ready_in, 0.0) + 0.1 * tr - 2.0 * stalling
        rows, cols = linear_sum_assignment(cost)
        for i, j in zip(rows, cols):
            T.assign(free[i], boxes[j], blocks[j])
