# Method — VIC1 peak

Half-hourly demand: weekday shape + CDD + late-summer heat. q90 GBM on lags + CDD. Spike: log-price residual vs demand+CDD above the train 97th percentile.

Event log names the three worst price intervals. Unit trip on day 18 ~17:30 is supposed to be in it. FastAPI app.py is the live desk.
