"""Six-axis DH arm. Forward kinematics only — we do not invent a solver.

Joint 2 and 3 carry most of the payload moment. Those two are the ones the
physics residual and the camera look at. Units: metres and radians.
"""
import numpy as np

# a, alpha, d, theta_offset
DH = np.array([
    [0.00,  np.pi / 2, 0.33, 0.0],
    [0.35,  0.0,       0.00, 0.0],
    [0.05,  np.pi / 2, 0.00, 0.0],
    [0.00, -np.pi / 2, 0.35, 0.0],
    [0.00,  np.pi / 2, 0.00, 0.0],
    [0.00,  0.0,       0.08, 0.0],
])


def _T(a, alpha, d, theta):
    ca, sa = np.cos(alpha), np.sin(alpha)
    ct, st = np.cos(theta), np.sin(theta)
    return np.array([
        [ct, -st * ca,  st * sa, a * ct],
        [st,  ct * ca, -ct * sa, a * st],
        [0,   sa,       ca,      d],
        [0,   0,        0,       1],
    ])


def frames(q):
    """Homogeneous frames of every joint, base first. q is (6,)."""
    out = [np.eye(4)]
    T = np.eye(4)
    for i, row in enumerate(DH):
        T = T @ _T(row[0], row[1], row[2], q[i] + row[3])
        out.append(T)
    return out


def joint_xyz(q):
    return np.stack([T[:3, 3] for T in frames(q)], axis=0)


def pick_cycle(phase, wear=0.0):
    """One pick-and-place. phase in [0, 1]. wear droops joint 2 a few degrees."""
    reach = 0.55 + 0.35 * np.sin(2 * np.pi * phase)
    lift = 0.40 + 0.25 * np.cos(2 * np.pi * phase)
    q = np.array([
        0.6 * np.sin(2 * np.pi * phase),
        0.4 + 0.7 * reach - 0.08 * wear,
        -0.9 * lift,
        0.2 * np.sin(4 * np.pi * phase),
        0.3 * np.cos(2 * np.pi * phase),
        0.1 * np.sin(2 * np.pi * phase),
    ])
    return q


def payload_moment(q, mass=8.0):
    """Approximate moment at joints 2 and 3 from a point mass at the flange."""
    g = 9.81
    xyz = joint_xyz(q)
    tip = xyz[-1]
    j2, j3 = xyz[2], xyz[3]
    m2 = mass * g * np.linalg.norm(tip[:2] - j2[:2])
    m3 = mass * g * np.linalg.norm(tip[:2] - j3[:2])
    return np.array([0.0, m2, m3, 0.0, 0.0, 0.0])
