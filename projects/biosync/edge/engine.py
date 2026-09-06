"""Reference on-device engine: loads weights.npz, steps the replica with RK4.

This is the same arithmetic the app runs. Latency per step is what matters
on a phone that wakes for 200 ms every five minutes, so we time it here.
"""
import time

import numpy as np


class Engine:
    def __init__(self, npz_path):
        w = np.load(npz_path)
        self.W1, self.b1, self.W2, self.b2 = w["W1"], w["b1"], w["W2"], w["b2"]
        self.emb = w["emb"]
        self.dt = float(w["dt"])

    def f(self, z, u):
        h = np.tanh(np.concatenate([z, u]) @ self.W1 + self.b1)
        return h @ self.W2 + self.b2

    def step(self, z, u):
        k1 = self.f(z, u)
        k2 = self.f(z + self.dt / 2 * k1, u)
        k3 = self.f(z + self.dt / 2 * k2, u)
        k4 = self.f(z + self.dt * k3, u)
        return z + self.dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4)

    def rollout(self, z0, u_seq, pid):
        z = z0.copy()
        out = [z.copy()]
        for u in u_seq:
            u = u.copy()
            u[-self.emb.shape[1]:] = self.emb[pid]
            z = self.step(z, u)
            out.append(z.copy())
        return np.stack(out)

    def latency_us(self, reps=2000):
        z = np.array([1.0, 0.7, 0.0, 0.0])
        u = np.zeros(self.W1.shape[0] - 4)
        t0 = time.perf_counter()
        for _ in range(reps):
            z = self.step(z, u)
        return (time.perf_counter() - t0) / reps * 1e6


def save_weights(theta, emb, dt, path):
    np.savez(path, W1=theta["W1"], b1=theta["b1"], W2=theta["W2"], b2=theta["b2"], emb=emb, dt=dt)
