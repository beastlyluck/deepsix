"""Formation-tracking policy trained by backprop through the sim.

Analytic policy gradient: unroll the differentiable world for H steps, score
tracking error plus effort plus a spacing penalty, step Adam. Domain
randomisation is a flag; the S2R audit trains both ways and compares.
"""
import torch
from torch import nn

from sim.quadrotor import Swarm, WorldParams

OBS_DIM = 12   # pos err(3), vel err(3), held acc(3), nearest-neighbour offset(3)
ACT_DIM = 3
ACC_LIMIT = 6.0


class Policy(nn.Module):
    def __init__(self, hidden=64):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(OBS_DIM, hidden), nn.Tanh(),
            nn.Linear(hidden, hidden), nn.Tanh(),
            nn.Linear(hidden, ACT_DIM),
        )
        # PD prior. The net learns the residual on top of it.
        self.kp = nn.Parameter(torch.tensor(2.2))
        self.kd = nn.Parameter(torch.tensor(1.9))

    def forward(self, obs):
        pd = self.kp * obs[..., 0:3] + self.kd * obs[..., 3:6]
        return torch.clamp(pd + self.net(obs), -ACC_LIMIT, ACC_LIMIT)


def observe(swarm):
    err = swarm.reference() - swarm.pos
    verr = swarm.reference_velocity() - swarm.vel
    dp = swarm.pos.unsqueeze(2) - swarm.pos.unsqueeze(1)
    dist = dp.norm(dim=-1) + torch.eye(swarm.N) * 1e3
    idx = dist.argmin(dim=-1)                                     # (B, N)
    nearest = torch.gather(dp, 2, idx[..., None, None].expand(-1, -1, 1, 3)).squeeze(2)
    return torch.cat([err, verr, swarm.acc_cmd, nearest], dim=-1)


def rollout(policy, swarm, horizon, log=None):
    track, effort, spacing = 0.0, 0.0, 0.0
    for _ in range(horizon):
        obs = observe(swarm)
        act = policy(obs)
        swarm.step(act)
        e = swarm.reference() - swarm.pos
        track = track + (e ** 2).sum(-1).mean()
        effort = effort + 0.01 * (act ** 2).sum(-1).mean()
        gap = obs[..., 9:12].norm(dim=-1)
        spacing = spacing + torch.relu(1.5 - gap).pow(2).mean()
        if log is not None:
            log.append((swarm.pos.detach(), swarm.euler().detach(), act.detach(), swarm.wind.detach(), e.detach()))
    return (track + effort + 3.0 * spacing) / horizon


def train(policy, randomise, iters=160, batch=12, n_drones=6, horizon=150, seed=0):
    gen = torch.Generator().manual_seed(seed)
    opt = torch.optim.Adam(policy.parameters(), lr=3e-3)
    losses = []
    for it in range(iters):
        params = WorldParams.randomised(batch, gen) if randomise else WorldParams.nominal(batch)
        swarm = Swarm(batch, n_drones, params, gen)
        loss = rollout(policy, swarm, horizon)
        opt.zero_grad()
        loss.backward()
        nn.utils.clip_grad_norm_(policy.parameters(), 5.0)
        opt.step()
        losses.append(loss.item())
    return losses
