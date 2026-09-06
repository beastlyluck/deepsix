# Method — Campus load

GBM (or HistGBM fallback) on hour, dow, temp, CDD, occupancy, lag24, lag168. Rolling-origin: retrain weekly, 24h from midnight, last 14 days.

q0.9 pinball, normalised by mean kWh. Ridge AR(72) residual corrector. PSI on temp / occupancy / lag24; gate STOP if any PSI > 0.2.

Challenger retrains on the last 28 days only. Swap if MAE wins. Early-summer heat is injected in the eval window — the gate is supposed to trip.
