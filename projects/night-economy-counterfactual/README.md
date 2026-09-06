# Night economy — late-night tram cut

One strip loses after-11 frequency. A matched strip does not. Difference-in-differences is the leftover after Friday nights and weather.

If the pre-period event study is ugly, there is no brief. That is the product.

## What you get

| Artefact | Where |
|---|---|
| Brief + board | `site/index.html` |
| Docs | `docs/METHOD.md`, `docs/DATA.md`, `docs/OPERATIONS.md` |
| Event-study coefficients | `outputs/dashboard.json` |

## Method (short)

- Match control on pre-period weekday shape.
- TWFE `log(spend) ~ sensor + day + treated×post`.
- Sensor-clustered bootstrap (90%).
- Weekly event study; week −1 omitted. Parallel-trends gate: max |lead| < 0.04.
- Residual map: sensors the model cannot explain stay on the page.

## Run

```
python main.py
```

Open `site/index.html`. True simulated effect is −11%. The brief should recover a number near that, with an interval.

## Interview points

- Why you match on shape, not level.
- Why you show leads before the ATT.
- Why unexplained sensors are not smoothed into the headline.
