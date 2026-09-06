"""Reduced quadrotor model with attitude lag, drag and a Dryden-style gust field.

State per drone: position (3), velocity (3), attitude euler (3), commanded
acceleration held by the lag filter (3). Control is a world-frame acceleration
command; roll/pitch fall out of the thrust direction. Yaw is held at zero.

Two worlds share this file:
  * "sim"  - the training world. Parameters are drawn from ranges.
  * "real" - the target world. Heavier gusts, slower motors, and a downwash
             coupling between neighbours that the training world never sees.
"""
import math

import torch

G = 9.81
DT = 0.02


class WorldParams:
    def __init__(self, mass, drag, lag, gust_sigma, gust_tau, downwash):
        self.mass = mass
        self.drag = drag
        self.lag = lag
        self.gust_sigma = gust_sigma
        self.gust_tau = gust_tau
        self.downwash = downwash

    @staticmethod
    def nominal(batch):
        one = torch.ones(batch, 1)
        return WorldParams(1.45 * one, 0.30 * one, 0.10 * one, 0.6 * one, 2.0 * one, 0.0 * one)

    @staticmethod
    def randomised(batch, gen):
        def u(lo, hi):
            return lo + (hi - lo) * torch.rand(batch, 1, generator=gen)
        return WorldParams(1.45 * u(0.85, 1.15), u(0.2, 0.45), u(0.07, 0.16), u(0.4, 1.8), u(1.0, 3.5),
                           torch.zeros(batch, 1))

    @staticmethod
    def real(batch):
        # Held out. Inside the DR ranges on every axis except downwash, which
        # the training world does not have at all.
        one = torch.ones(batch, 1)
        return WorldParams(1.58 * one, 0.42 * one, 0.14 * one, 1.6 * one, 1.4 * one, 0.35 * one)


def formation_reference(t, n_drones, radius=6.0):
    """Slow Lissajous sweep, each drone offset around the loop. t in seconds."""
    k = torch.arange(n_drones, dtype=torch.float32)
    phase = 2 * math.pi * k / n_drones
    x = radius * torch.sin(0.25 * t + phase)
    y = radius * torch.sin(0.5 * t + phase) * 0.6
    z = 12.0 + 1.5 * torch.cos(0.25 * t + phase)
    return torch.stack([x, y, z], dim=-1)


def formation_velocity(t, n_drones, radius=6.0):
    """Analytic derivative of the reference. The planner knows it; so may the policy."""
    k = torch.arange(n_drones, dtype=torch.float32)
    phase = 2 * math.pi * k / n_drones
    vx = radius * 0.25 * torch.cos(0.25 * t + phase)
    vy = radius * 0.5 * torch.cos(0.5 * t + phase) * 0.6
    vz = -1.5 * 0.25 * torch.sin(0.25 * t + phase)
    return torch.stack([vx, vy, vz], dim=-1)


class Swarm:
    """Batch of B swarms, each with N drones. Tensors are (B, N, 3)."""

    def __init__(self, batch, n_drones, params, gen=None):
        self.B, self.N = batch, n_drones
        self.p = params
        self.gen = gen
        ref = formation_reference(torch.tensor(0.0), n_drones).expand(batch, n_drones, 3)
        self.pos = ref + 0.3 * torch.randn(batch, n_drones, 3, generator=gen)
        self.vel = torch.zeros(batch, n_drones, 3)
        self.acc_cmd = torch.zeros(batch, n_drones, 3)
        self.wind = torch.zeros(batch, n_drones, 3)
        self.t = 0.0

    def _gust(self):
        # Ornstein-Uhlenbeck per axis. Roughly the Dryden low-altitude shape
        # once you squint at the spectrum; cheap enough to differentiate through.
        tau = self.p.gust_tau.unsqueeze(-1)
        sig = self.p.gust_sigma.unsqueeze(-1)
        noise = torch.randn(self.B, self.N, 3, generator=self.gen)
        self.wind = self.wind + DT * (-self.wind / tau) + sig * math.sqrt(2 * DT) / torch.sqrt(tau) * noise
        return self.wind

    def _downwash(self):
        # Drones sitting above a neighbour push it down. Only the real world has it.
        dp = self.pos.unsqueeze(2) - self.pos.unsqueeze(1)          # (B, N, N, 3)
        horiz = dp[..., :2].norm(dim=-1)
        above = dp[..., 2]                                            # positive when i is above j
        gain = torch.exp(-(horiz / 1.2) ** 2) * torch.clamp(above, 0, 4) / 4
        gain = gain * (1 - torch.eye(self.N)).unsqueeze(0)
        push = -gain.sum(dim=1, keepdim=True).transpose(1, 2)         # (B, N, 1)
        return torch.cat([torch.zeros(self.B, self.N, 2), push * self.p.downwash.unsqueeze(-1)], dim=-1)

    def step(self, acc_command):
        """acc_command: (B, N, 3) desired world acceleration, gravity-free."""
        lag = self.p.lag.unsqueeze(-1)
        self.acc_cmd = self.acc_cmd + DT / lag * (acc_command - self.acc_cmd)
        wind = self._gust()
        rel = self.vel - wind
        drag = -self.p.drag.unsqueeze(-1) * rel * rel.norm(dim=-1, keepdim=True) / self.p.mass.unsqueeze(-1)
        acc = self.acc_cmd + drag + self._downwash()
        self.vel = self.vel + DT * acc
        self.pos = self.pos + DT * self.vel
        self.t += DT
        return self.pos, self.vel

    def euler(self):
        """Roll/pitch implied by the held thrust vector; yaw held at 0."""
        a = self.acc_cmd + torch.tensor([0.0, 0.0, G])
        roll = torch.atan2(-a[..., 1], a[..., 2])
        pitch = torch.atan2(a[..., 0], a[..., 2])
        yaw = torch.zeros_like(roll)
        return torch.stack([roll, pitch, yaw], dim=-1)

    def reference(self):
        return formation_reference(torch.tensor(self.t), self.N).expand(self.B, self.N, 3)

    def reference_velocity(self):
        return formation_velocity(torch.tensor(self.t), self.N).expand(self.B, self.N, 3)
