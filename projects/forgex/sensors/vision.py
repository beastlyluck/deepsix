"""Camera on joints 2 and 3. OpenCV features, not a network.

The frame is a synthetic flange: a bright disc, a darker housing, optional
oil streak and optional motion blur. Features: Laplacian variance (focus),
a 6-bin hue histogram, contour area ratio, and a streak score from a
morphological opening. That is enough to catch a loose cover and a leak.
"""
import cv2
import numpy as np

W, H = 96, 96


def frame(rng, leak=0.0, blur=0.0, off_axis=0.0):
    img = np.full((H, W, 3), 28, np.uint8)
    cx, cy = 48 + int(8 * off_axis), 50
    cv2.circle(img, (cx, cy), 28, (70, 72, 78), -1)
    cv2.circle(img, (cx, cy), 14, (180, 190, 200), -1)
    cv2.rectangle(img, (cx - 4, cy + 14), (cx + 4, cy + 36), (90, 90, 96), -1)
    if leak > 0.3:
        pts = np.array([
            [cx + 10, cy + 8],
            [cx + 22, cy + 30],
            [cx + 16, cy + 38],
            [cx + 6, cy + 18],
        ])
        cv2.fillConvexPoly(img, pts, (20, 90, 40))
    if blur > 0.2:
        k = int(3 + 10 * blur) | 1
        img = cv2.GaussianBlur(img, (k, k), 0)
    img = cv2.add(img, rng.integers(-6, 7, img.shape, dtype=np.int16).astype(np.uint8))
    return img


def features(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    lap = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    hist = cv2.calcHist([hsv], [0], None, [6], [0, 180]).flatten()
    hist = hist / (hist.sum() + 1e-9)
    _, th = cv2.threshold(gray, 0, 255, cv2.THRESH_OTSU)
    cnts, _ = cv2.findContours(th, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    area = max((cv2.contourArea(c) for c in cnts), default=0.0) / (W * H)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    open_ = cv2.morphologyEx(th, cv2.MORPH_OPEN, kernel)
    streak = float(np.mean(th > open_) )
    return np.concatenate([[lap / 200.0, area, streak], hist])
