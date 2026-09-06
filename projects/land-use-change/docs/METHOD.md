# Method — Land-use change

HistGBM on spectral-index stand-ins (NDVI, NDBI, NDWI, brightness, texture, red/nir). Per-class IoU, mIoU, accuracy.

Year-2 scene converts some pasture/crop to residential/industrial. Change map = class flip AND entropy ≤ 0.6 on both years. Unsure tiles do not vote. Transition matrix in hectares. Three highest-entropy tiles are the field check list.
