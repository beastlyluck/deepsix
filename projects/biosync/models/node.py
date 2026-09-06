"""Neural ODE in numpy with reverse-mode through RK4, written by hand.

Latent z = [glucose/100, hr/100, x1, x2]. Inputs u = [meal rate, activity,
sleep, patient embedding(3)]. Dynamics f(z,u) is a one-hidden-layer tanh MLP.
Discretise-then-optimise: the forward pass stores every RK4 stage, the
backward pass replays them in reverse and accumulates vector-Jacobian
products for weights, inputs and the initial state. No autograd anywhere,
which is the point: the same arithmetic ships to the phone.
"""
import numpy as np

Z, U, EMB, HID = 4, 6, 3, 32
DT = 5.0 / 60.0                                  # hours per step


def init_params(rng):
    s1, s2 = 1 / np.sqrt(Z + U), 1 / np.sqrt(HID)
    return {"W1": rng.normal(0, s1, (Z + U, HID)), "b1": np.zeros(HID),
            "W2": rng.normal(0, 0.1 * s2, (HID, Z)), "b2": np.zeros(Z)}


def f(theta, z, u):
    a = np.concatenate([z, u], axis=-1)
    h = np.tanh(a @ theta["W1"] + theta["b1"])
    return h @ theta["W2"] + theta["b2"], (a, h)


def f_vjp(theta, cache, g):
    """Given dL/df = g, return dL/dz, dL/du and parameter grads."""
    a, h = cache
    gW2 = np.einsum("bi,bj->ij", h, g)
    gb2 = g.sum(0)
    gh = (g @ theta["W2"].T) * (1 - h ** 2)
    gW1 = np.einsum("bi,bj->ij", a, gh)
    gb1 = gh.sum(0)
    ga = gh @ theta["W1"].T
    return ga[:, :Z], ga[:, Z:], {"W1": gW1, "b1": gb1, "W2": gW2, "b2": gb2}


def rk4_forward(theta, z0, U_seq):
    """z0 (B,Z), U_seq (T,B,U). Returns states (T+1,B,Z) and stage caches."""
    zs, caches = [z0], []
    z = z0
    for t in range(U_seq.shape[0]):
        u = U_seq[t]
        k1, c1 = f(theta, z, u)
        k2, c2 = f(theta, z + DT / 2 * k1, u)
        k3, c3 = f(theta, z + DT / 2 * k2, u)
        k4, c4 = f(theta, z + DT * k3, u)
        z = z + DT / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        zs.append(z)
        caches.append((c1, c2, c3, c4))
    return np.stack(zs), caches


def rk4_backward(theta, caches, g_states):
    """g_states (T+1,B,Z) = dL/dz_t. Returns grads for theta, inputs (T,B,U), z0."""
    gtheta = {k: np.zeros_like(v) for k, v in theta.items()}
    gU = np.zeros((len(caches),) + g_states.shape[1:-1] + (U,))
    gz = g_states[-1].copy()
    for t in range(len(caches) - 1, -1, -1):
        c1, c2, c3, c4 = caches[t]
        gk1, gk2, gk3, gk4 = DT / 6 * gz, DT / 3 * gz, DT / 3 * gz, DT / 6 * gz
        gz_acc, gu_acc = gz.copy(), 0.0
        gz4, gu4, gt = f_vjp(theta, c4, gk4); gz_acc += gz4; gu_acc = gu_acc + gu4; gk3 = gk3 + DT * gz4
        for k in gt: gtheta[k] += gt[k]
        gz3, gu3, gt = f_vjp(theta, c3, gk3); gz_acc += gz3; gu_acc = gu_acc + gu3; gk2 = gk2 + DT / 2 * gz3
        for k in gt: gtheta[k] += gt[k]
        gz2, gu2, gt = f_vjp(theta, c2, gk2); gz_acc += gz2; gu_acc = gu_acc + gu2; gk1 = gk1 + DT / 2 * gz2
        for k in gt: gtheta[k] += gt[k]
        gz1, gu1, gt = f_vjp(theta, c1, gk1); gz_acc += gz1; gu_acc = gu_acc + gu1
        for k in gt: gtheta[k] += gt[k]
        gU[t] = gu_acc
        gz = gz_acc + g_states[t]
    return gtheta, gU, gz


class Adam:
    def __init__(self, params, lr=3e-3, b1=0.9, b2=0.999):
        self.lr, self.b1, self.b2, self.t = lr, b1, b2, 0
        self.m = {k: np.zeros_like(v) for k, v in params.items()}
        self.v = {k: np.zeros_like(v) for k, v in params.items()}

    def step(self, params, grads):
        self.t += 1
        for k in params:
            g = np.clip(grads[k], -5, 5)
            self.m[k] = self.b1 * self.m[k] + (1 - self.b1) * g
            self.v[k] = self.b2 * self.v[k] + (1 - self.b2) * g * g
            mh = self.m[k] / (1 - self.b1 ** self.t)
            vh = self.v[k] / (1 - self.b2 ** self.t)
            params[k] -= self.lr * mh / (np.sqrt(vh) + 1e-8)


def masked_loss(zs, y, mask):
    """y, mask: (T+1,B,2) observed glucose/100 and hr/100. Returns loss and dL/dz."""
    pred = zs[..., :2]
    diff = (pred - y) * mask
    n = max(mask.sum(), 1.0)
    g = np.zeros_like(zs)
    g[..., :2] = 2 * diff / n
    return (diff ** 2).sum() / n, g


def train(theta, emb, batches, iters=500, lr=3e-3, seed=0, log_every=25):
    """batches: callable(rng) -> (z0, U_seq, y, mask, pid). emb: (P,EMB) learned per patient."""
    rng = np.random.default_rng(seed)
    opt = Adam(theta, lr)
    opt_e = Adam({"e": emb}, lr)
    hist = []
    for it in range(iters):
        z0, U_seq, y, mask, pid = batches(rng)
        U_seq = U_seq.copy()
        U_seq[..., U - EMB:] = emb[pid][None]
        zs, caches = rk4_forward(theta, z0, U_seq)
        loss, g = masked_loss(zs, y, mask)
        gtheta, gU, _ = rk4_backward(theta, caches, g)
        ge = np.zeros_like(emb)
        np.add.at(ge, pid, gU[..., U - EMB:].sum(0))
        opt.step(theta, gtheta)
        opt_e.step({"e": emb}, {"e": ge})
        if it % log_every == 0:
            hist.append(float(loss))
    return hist


def predict(theta, emb, z0, U_seq, pid):
    U_seq = U_seq.copy()
    U_seq[..., U - EMB:] = emb[pid][None]
    return rk4_forward(theta, z0, U_seq)[0]
