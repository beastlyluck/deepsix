"""Gear-mesh tone plus a bearing sideband. Features are band energies.

16 kHz, 0.25 s. A healthy mesh sits at 420 Hz. Wear puts energy at
420 ± 37 Hz. We do not feed raw samples to the detector — only eight
bands and a crest factor, because that is what the edge loop can keep
under a millisecond.
"""
import numpy as np
from scipy.signal import stft

FS = 16000
MESH = 420.0
CAGE = 37.0


def record(rng, n, wear=0.0, knock=0.0):
    t = np.arange(n) / FS
    tone = 0.55 * np.sin(2 * np.pi * MESH * t)
    side = wear * 0.45 * (
        np.sin(2 * np.pi * (MESH - CAGE) * t) + np.sin(2 * np.pi * (MESH + CAGE) * t)
    )
    knocks = np.zeros(n)
    if knock > 0:
        hits = rng.integers(0, n, size=max(1, int(knock * 6)))
        knocks[hits] = rng.normal(0, 1.8, size=len(hits))
    noise = rng.normal(0, 0.08, n)
    return tone + side + knocks + noise


def features(x):
    _, _, z = stft(x, fs=FS, nperseg=256, noverlap=128)
    mag = np.abs(z)
    bands = [(80, 160), (160, 320), (320, 400), (400, 440),
             (440, 520), (520, 800), (800, 1600), (1600, 4000)]
    freqs = np.linspace(0, FS / 2, mag.shape[0])
    out = []
    for lo, hi in bands:
        m = (freqs >= lo) & (freqs < hi)
        out.append(float(mag[m].mean()) if m.any() else 0.0)
    crest = float(np.max(np.abs(x)) / (np.sqrt(np.mean(x ** 2)) + 1e-9))
    out.append(crest)
    return np.array(out)


def spectrogram(x):
    f, t, z = stft(x, fs=FS, nperseg=256, noverlap=128)
    return f, t, np.abs(z)
