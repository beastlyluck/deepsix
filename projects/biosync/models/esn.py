"""Echo-state network baseline: the discrete-time recurrent model.

Fixed random reservoir, ridge readout. Runs on the 5-minute grid, so gaps
have to be filled before it sees them; a mask channel tells it which values
were real. Cheap, strong on regular data, and exactly the kind of model that
quietly degrades when the wearable comes off the wrist.
"""
import numpy as np


class ESN:
    def __init__(self, n_in, n_res=300, spectral=0.9, leak=0.3, seed=0, ridge=1e-2):
        rng = np.random.default_rng(seed)
        self.Win = rng.uniform(-0.5, 0.5, (n_in, n_res))
        W = rng.normal(0, 1, (n_res, n_res)) * (rng.random((n_res, n_res)) < 0.1)
        W *= spectral / np.max(np.abs(np.linalg.eigvals(W)))
        self.W, self.leak, self.ridge = W, leak, ridge
        self.Wout = None

    def _states(self, X):
        """X (T,B,n_in) -> reservoir states (T,B,n_res)."""
        T, B, _ = X.shape
        h = np.zeros((B, self.W.shape[0]))
        out = np.zeros((T, B, self.W.shape[0]))
        for t in range(T):
            pre = X[t] @ self.Win + h @ self.W
            h = (1 - self.leak) * h + self.leak * np.tanh(pre)
            out[t] = h
        return out

    def fit(self, X, Y, mask):
        H = self._states(X)
        Hf = np.concatenate([H, X], axis=-1).reshape(-1, H.shape[-1] + X.shape[-1])
        Yf, m = Y.reshape(-1, Y.shape[-1]), mask.reshape(-1, Y.shape[-1])
        w = m.max(-1)
        A = Hf[w > 0]
        Yw = Yf[w > 0]
        self.Wout = np.linalg.solve(A.T @ A + self.ridge * np.eye(A.shape[1]), A.T @ Yw)
        return self

    def predict(self, X):
        H = self._states(X)
        return np.concatenate([H, X], axis=-1) @ self.Wout
