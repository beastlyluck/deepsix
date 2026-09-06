"""Gaussian mechanism for the cohort curves that leave the device.

Release: mean glucose by hour of day across patients, clipped per patient to
[40, 400] mg/dL so the L2 sensitivity of the 24-vector is bounded. Accounting
is the analytic Gaussian mechanism (Balle & Wang 2018) approximated with the
classic sigma >= sqrt(2 ln(1.25/delta)) * S / eps, which is conservative.

The empirical check is the part reviewers actually want: build two
neighbouring cohorts (one patient swapped), release both many times, and see
whether a likelihood-ratio attacker beats the (eps, delta) bound.
"""
import numpy as np

LO, HI = 40.0, 400.0


def hourly_mean(patient_G):
    """(P, T minutes) -> (24,) mean by hour of day, clipped per patient."""
    P, T = patient_G.shape
    hours = (np.arange(T) // 60) % 24
    per = np.stack([np.clip(patient_G[:, hours == h], LO, HI).mean(1) for h in range(24)], 1)   # (P,24)
    return per.mean(0), per


def sensitivity(n_patients):
    # replacing one patient moves each hourly mean by at most (HI-LO)/n; L2 over 24 hours
    return (HI - LO) / n_patients * np.sqrt(24)


def gaussian_sigma(eps, delta, S):
    return np.sqrt(2 * np.log(1.25 / delta)) * S / eps


def release(patient_G, eps, delta, rng):
    mean, per = hourly_mean(patient_G)
    sig = gaussian_sigma(eps, delta, sensitivity(len(patient_G)))
    return mean + rng.normal(0, sig, 24), mean, sig


def empirical_check(patient_G, eps, delta, rng, trials=4000):
    """Attacker sees one release and guesses which neighbouring cohort produced it.
    Reports the attacker's advantage against the DP bound e^eps."""
    A = patient_G
    B = A.copy()
    B[0] = np.clip(A[0] * 1.5 + 60, LO, HI)          # worst-case swapped patient: very different curve
    mA, _ = hourly_mean(A)
    mB, _ = hourly_mean(B)
    sig = gaussian_sigma(eps, delta, sensitivity(len(A)))
    correct = 0
    for _ in range(trials):
        truth = rng.integers(2)
        r = (mA if truth == 0 else mB) + rng.normal(0, sig, 24)
        llA = -((r - mA) ** 2).sum()
        llB = -((r - mB) ** 2).sum()
        correct += int((llB > llA) == bool(truth))
    acc = correct / trials
    # for a (eps,delta) mechanism, attacker accuracy <= (e^eps + delta) / (1 + e^eps) roughly
    bound = (np.exp(eps)) / (1 + np.exp(eps)) + delta
    return {"eps": eps, "delta": delta, "sigma_mgdl": round(float(sig), 2), "attacker_acc": round(acc, 4),
            "bound": round(float(bound), 4), "within_bound": bool(acc <= bound + 0.01)}
