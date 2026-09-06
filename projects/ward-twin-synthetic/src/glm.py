"""Negative-binomial occupancy GLM.

Poisson IRLS fits the log-mean. NB2 dispersion is method-of-moments from those
residuals. Intervals are negative-binomial quantiles, not a Gaussian smear.
"""
import numpy as np
from scipy.stats import nbinom

from .simulate import WARDS


def design(df):
    """Fourier hour, weekend, linear trend, ward dummies."""
    ang = 2 * np.pi * df["hod"].values / 24
    cols = [
        np.ones(len(df)),
        np.sin(ang), np.cos(ang),
        np.sin(2 * ang), np.cos(2 * ang),
        (df["dow"].values >= 5).astype(float),
        df["t"].values / 1000,
    ]
    for w in range(1, WARDS):
        cols.append((df["ward"].values == w).astype(float))
    return np.column_stack(cols)


def fit_nb_glm(X, y, iters=30):
    """Poisson IRLS for the mean, then NB2 alpha."""
    beta = np.zeros(X.shape[1])
    beta[0] = np.log(max(y.mean(), 1e-6))
    eye = np.eye(X.shape[1])
    for _ in range(iters):
        mu = np.exp(X @ beta)
        z = X @ beta + (y - mu) / mu
        xtw = X.T * mu
        new = np.linalg.solve(xtw @ X + 1e-8 * eye, xtw @ z)
        if np.max(np.abs(new - beta)) < 1e-9:
            beta = new
            break
        beta = new
    mu = np.exp(X @ beta)
    alpha = max(((y - mu) ** 2 - mu).sum() / (mu ** 2).sum(), 1e-6)
    return beta, float(alpha)


def nb_interval(mu, alpha, level=0.8):
    n = 1 / alpha
    p = n / (n + mu)
    lo = nbinom.ppf((1 - level) / 2, n, p)
    hi = nbinom.ppf(1 - (1 - level) / 2, n, p)
    return lo, hi


def pit_values(y, mu, alpha):
    """Probability integral transform. Uniform if the NB interval is honest."""
    n = 1 / alpha
    p = n / (n + mu)
    return nbinom.cdf(y, n, p)
