"""Friction + first-order thermal. The residual is measured minus this model.

A healthy arm sits inside a band. Bearing wear raises Coulomb friction on
joint 2. A blocked cooling duct raises the thermal time-constant. Neither
shows up in a vision-only detector until the weld is already off spec.
"""
import numpy as np

I_ROTOR = np.array([0.8, 2.4, 1.6, 0.4, 0.3, 0.2])
VISC = np.array([0.12, 0.35, 0.22, 0.06, 0.05, 0.04])
COULOMB = np.array([0.4, 1.8, 1.1, 0.2, 0.15, 0.1])
KT = 0.18          # Nm / A
RTH = 1.6          # K / W
CTH = 420.0        # J / K
T_AMB = 24.0


def current_from_motion(qdot, qdd, moment, coulomb_scale=1.0):
    tau = I_ROTOR * qdd + VISC * qdot + coulomb_scale * COULOMB * np.sign(qdot + 1e-9)
    tau = tau + 0.015 * moment
    return tau / KT


def thermal_step(temp, current, dt, rth_scale=1.0):
    p_loss = np.sum((current ** 2) * 0.08)
    dT = (p_loss * rth_scale * RTH - (temp - T_AMB)) / (CTH / 60.0) * dt
    return temp + dT


def residual(measured_A, predicted_A):
    """Per-joint RMS over a cycle, plus a scalar for the board."""
    err = measured_A - predicted_A
    per = np.sqrt(np.mean(err ** 2, axis=0))
    return per, float(np.sqrt(np.mean(err ** 2)))
