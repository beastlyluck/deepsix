"""Freeze the policy for the edge loop.

TorchScript is what controller.cpp loads through libtorch. weights.json is
the fallback for a hand-rolled C loop on a flight controller with no libtorch.
"""
import json
import os

import torch

from rl.policy import OBS_DIM


def export(policy, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    policy.eval()
    scripted = torch.jit.trace(policy, torch.zeros(1, 6, OBS_DIM))
    pt = os.path.join(out_dir, "policy.pt")
    scripted.save(pt)
    weights = {k: v.detach().cpu().numpy().round(6).tolist() for k, v in policy.state_dict().items()}
    with open(os.path.join(out_dir, "weights.json"), "w") as f:
        json.dump({"obs_dim": OBS_DIM, "act_dim": 3, "acc_limit": 6.0, "layers": weights}, f)
    # sanity: scripted and eager must agree
    x = torch.randn(1, 6, OBS_DIM)
    with torch.no_grad():
        gap = (scripted(x) - policy(x)).abs().max().item()
    return pt, os.path.getsize(pt), gap
