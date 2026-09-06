"""Conductor temperature along a line as a PINN.

    dT/dt = a d2T/dx2 + q I^2 - b(x) (T - T_amb)        x in [0,1], t in [0,1]
    T(0,t) = T(1,t) = T_amb        T(x,0) = T_amb

b(x) is convective cooling; it dips in a sheltered mid-span, which is where
the hotspot forms. The network takes (x, t, I) so one model covers every
loading level the dispatcher might ask about. Reference solution is an
explicit finite-difference scheme; the PINN is judged against it, not
against its own residual.
"""
import numpy as np
import torch
from torch import nn

# Non-dimensional: x, t in [0,1] (t = one hour), current in per-unit of static rating.
# Q is sized so that roughly 85 percent loading overheats the sheltered mid-span
# within the hour, which is the whole reason a static rating is not enough.
A, Q, T_AMB, T_LIMIT, SCALE = 0.02, 256.0, 25.0, 90.0, 60.0


def cooling(x):
    return 5.0 - 3.2 * torch.exp(-((x - 0.55) / 0.12) ** 2)


class ThermalNet(nn.Module):
    def __init__(self, width=64):
        super().__init__()
        self.f = nn.Sequential(nn.Linear(3, width), nn.Tanh(), nn.Linear(width, width), nn.Tanh(),
                               nn.Linear(width, width), nn.Tanh(), nn.Linear(width, 1))

    def theta(self, x, t, i):
        # hard-encode BC and IC: theta = 4 x(1-x) (1 - e^{-5t}) net(x,t,I). The time
        # factor gives the net a first-order rise for free instead of making it learn one.
        u = torch.cat([x, t, i], dim=-1)
        return 4.0 * x * (1 - x) * (1 - torch.exp(-5.0 * t)) * self.f(u)

    def forward(self, x, t, i):
        return T_AMB + SCALE * self.theta(x, t, i)


def residual(net, x, t, i):
    """PDE residual in the scaled variable theta = (T - T_amb)/SCALE, so it is O(1)."""
    x.requires_grad_(True)
    t.requires_grad_(True)
    th = net.theta(x, t, i)
    th_x, th_t = torch.autograd.grad(th.sum(), [x, t], create_graph=True)
    th_xx = torch.autograd.grad(th_x.sum(), x, create_graph=True)[0]
    return th_t - A * th_xx - (Q / SCALE) * i ** 2 + cooling(x) * th


def train(net, iters=3000, n=1536, seed=0, lr=4e-3):
    gen = torch.Generator().manual_seed(seed)
    opt = torch.optim.Adam(net.parameters(), lr=lr)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, iters)
    hist = []
    for it in range(iters):
        # a third of the collocation points sit in the sheltered span where the gradients are
        x = torch.rand(n, 1, generator=gen)
        x[: n // 3] = 0.55 + 0.15 * torch.randn(n // 3, 1, generator=gen)
        x = x.clamp(0.001, 0.999)
        t = torch.rand(n, 1, generator=gen)
        i = 0.4 + 1.0 * torch.rand(n, 1, generator=gen)
        loss = residual(net, x, t, i).pow(2).mean()
        opt.zero_grad()
        loss.backward()
        opt.step()
        sched.step()
        if it % 50 == 0:
            hist.append(loss.item())
    return hist


def reference(i, nx=101, nt=4000):
    """Explicit FD. dt chosen well under the stability bound a dt/dx^2 < 0.5."""
    x = np.linspace(0, 1, nx)
    dx = x[1] - x[0]
    dt = 1.0 / nt
    assert A * dt / dx ** 2 < 0.5
    b = 5.0 - 3.2 * np.exp(-((x - 0.55) / 0.12) ** 2)
    T = np.full(nx, T_AMB)
    snaps = {0: T.copy()}
    for k in range(1, nt + 1):
        lap = np.zeros(nx)
        lap[1:-1] = (T[2:] - 2 * T[1:-1] + T[:-2]) / dx ** 2
        T = T + dt * (A * lap + Q * i ** 2 - b * (T - T_AMB))
        T[0] = T[-1] = T_AMB
        if k % (nt // 10) == 0:
            snaps[k / nt] = T.copy()
    return x, snaps


def compare(net, currents=(0.6, 0.9, 1.1)):
    """Relative L2 against FD at t=1 and the hotspot error, per current."""
    rows = []
    for i in currents:
        x, snaps = reference(i)
        with torch.no_grad():
            pred = net(torch.tensor(x, dtype=torch.float32)[:, None], torch.ones(len(x), 1),
                       torch.full((len(x), 1), float(i))).squeeze().numpy()
        ref = snaps[1.0]
        rows.append({"I": i, "rel_l2": float(np.linalg.norm(pred - ref) / np.linalg.norm(ref - T_AMB)),
                     "hotspot_ref_c": float(ref.max()), "hotspot_pinn_c": float(pred.max()),
                     "profile_ref": ref.round(2).tolist(), "profile_pinn": pred.round(2).tolist()})
    return rows


def time_to_limit(net, i, steps=200):
    """First t at which the hotspot crosses T_LIMIT, or None. Used as a dynamic rating."""
    x = torch.linspace(0, 1, 101)[:, None]
    with torch.no_grad():
        for t in np.linspace(0, 1, steps):
            T = net(x, torch.full_like(x, float(t)), torch.full_like(x, float(i)))
            if T.max() >= T_LIMIT:
                return float(t)
    return None


def sustainable_current(net, lo=0.3, hi=1.5, iters=20):
    """Largest per-unit current whose hotspot stays under T_LIMIT for the whole hour.
    Bisection on the PINN; this is the dynamic rating as a fraction of the static one."""
    for _ in range(iters):
        mid = 0.5 * (lo + hi)
        if time_to_limit(net, mid) is None:
            lo = mid
        else:
            hi = mid
    return lo
