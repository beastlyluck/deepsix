"""Sim-to-real audit.

Train the same architecture twice (nominal world, randomised world), then fly
both in the training world and in the target world. The number that matters
is the gap: RMSE(real) - RMSE(sim). Variance across seeds is reported because
a single lucky seed is how S2R claims usually go wrong.
"""
import torch

from rl.policy import Policy, rollout, train
from sim.quadrotor import Swarm, WorldParams


def fly(policy, world, seed, n_drones=6, horizon=500, batch=8):
    gen = torch.Generator().manual_seed(seed)
    params = {"sim": WorldParams.nominal, "real": WorldParams.real}[world](batch)
    swarm = Swarm(batch, n_drones, params, gen)
    log = []
    with torch.no_grad():
        rollout(policy, swarm, horizon, log)
    err = torch.stack([l[4] for l in log])                    # (T, B, N, 3)
    rmse = err.pow(2).sum(-1).mean().sqrt().item()
    worst = err.norm(dim=-1).max().item()
    return rmse, worst, log


def audit(seeds=(0, 1, 2), iters=160):
    rows, keep = [], {}
    for name, dr in (("nominal", False), ("domain_randomised", True)):
        for s in seeds:
            torch.manual_seed(s)
            pol = Policy()
            losses = train(pol, randomise=dr, iters=iters, seed=s)
            sim_rmse, sim_worst, _ = fly(pol, "sim", 100 + s)
            real_rmse, real_worst, log = fly(pol, "real", 200 + s)
            rows.append({
                "policy": name, "seed": s,
                "train_loss_final": round(losses[-1], 4),
                "sim_rmse_m": round(sim_rmse, 3), "real_rmse_m": round(real_rmse, 3),
                "gap_m": round(real_rmse - sim_rmse, 3),
                "real_worst_m": round(real_worst, 2),
            })
            if s == seeds[0]:
                keep[name] = (pol, log, losses)
    return rows, keep


def summarise(rows):
    out = {}
    for name in ("nominal", "domain_randomised"):
        g = torch.tensor([r["gap_m"] for r in rows if r["policy"] == name])
        rr = torch.tensor([r["real_rmse_m"] for r in rows if r["policy"] == name])
        out[name] = {
            "gap_mean_m": round(g.mean().item(), 3),
            "gap_std_m": round(g.std(unbiased=False).item(), 3),
            "real_rmse_mean_m": round(rr.mean().item(), 3),
        }
    return out
