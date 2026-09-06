"""Four states. The actuator will not leave HOLD without a human bit.

NORMAL  score < 0.35 and residual inside band
WATCH   score or residual rising — still moving, log every cycle
HOLD    score >= 0.65 or thermal residual over 8 K — motion gated
ESTOP   two HOLDs in five cycles, or a stall flag on the drive

Leaving HOLD needs `reset=True`. That is the interlock. A model that
auto-resets after a dip is how cells restart into a cracked reducer.
"""
NORMAL, WATCH, HOLD, ESTOP = "NORMAL", "WATCH", "HOLD", "ESTOP"


def step(state, score, residual, stall, recent_holds, reset=False):
    if state == ESTOP and not reset:
        return ESTOP, "latched"
    if state == HOLD and not reset:
        if stall or recent_holds >= 2:
            return ESTOP, "second hold inside the window"
        return HOLD, "waiting for reset"
    if stall:
        return ESTOP, "drive stall flag"
    if score >= 0.65 or residual >= 8.0:
        return HOLD, "score or thermal residual over trip"
    if score >= 0.35 or residual >= 4.0:
        return WATCH, "elevated"
    return NORMAL, "inside band"


def run(scores, residuals, stalls):
    state, holds, log = NORMAL, 0, []
    window = []
    for i, (s, r, st) in enumerate(zip(scores, residuals, stalls)):
        window.append(1 if state == HOLD else 0)
        window = window[-5:]
        state, why = step(state, s, r, st, sum(window))
        if state == HOLD:
            holds += 1
        log.append({"i": i, "state": state, "why": why, "score": round(float(s), 3),
                    "residual": round(float(r), 2)})
    return log
