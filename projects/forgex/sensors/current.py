"""q-axis current features. Torque ripple shows up as a 6th harmonic.

We do not stream the waveform off the line. Four numbers leave the drive:
RMS, THD of the first eight harmonics, crest, and a locked-rotor flag.
"""
import numpy as np

FS = 4000


def record(rng, n, predicted_A, ripple=0.0, stall=0.0):
    t = np.arange(n) / FS
    fund = 60.0
    base = predicted_A.mean()
    wave = base * np.sin(2 * np.pi * fund * t)
    wave = wave + ripple * base * np.sin(2 * np.pi * 6 * fund * t)
    if stall > 0:
        wave = wave + stall * base * np.exp(-((t - 0.04) / 0.008) ** 2)
    return wave + rng.normal(0, 0.04 * max(abs(base), 0.3), n)


def features(x):
    rms = float(np.sqrt(np.mean(x ** 2)))
    spec = np.abs(np.fft.rfft(x * np.hanning(len(x))))
    freqs = np.fft.rfftfreq(len(x), 1 / FS)
    fund_i = int(np.argmin(np.abs(freqs - 60.0)))
    harm = [spec[min(len(spec) - 1, fund_i * k)] for k in range(1, 9)]
    thd = float(np.sqrt(np.sum(np.square(harm[1:]))) / (harm[0] + 1e-9))
    crest = float(np.max(np.abs(x)) / (rms + 1e-9))
    stall = float(np.max(np.abs(x)) > 4.5 * rms)
    return np.array([rms, thd, crest, stall])
