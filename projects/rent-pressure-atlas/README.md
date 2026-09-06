# Rent pressure atlas

Which Melbourne SA2s are paying more than thirty percent of household income for the median listing this quarter.

## The question

Councils get a rent series and an income series and then argue about "affordability" with no shared definition. This folder uses one: weekly rent × 52 / (0.3 × household income). Above 1, the listing is eating the rule of thumb. Vacancy sits next to it so a tight market is not confused with an empty one.

Names are real suburbs. Counts are a stand-in with the same inner / middle / outer gradient you see in ABS SEIFA and DHHS rental reports. No scrape.

## Method

Log weekly rent on rooms, kilometres to rail, and a ring dummy (Ridge). Residual = actual − fitted. Footscray, Dandenong and St Kilda are shifted up on purpose so the leftover is visible.

Spatial lag: mean residual of suburbs that share a border. If that correlation is not noise, the leftover is a precinct effect.

`main.py` writes `site/index.html` — a table plus a bar of stress, no server.

```
pip install -r ../requirements.txt
python main.py
# open site/index.html
```

## What should come out

Log RMSE around 0.07. Share stressed near a third. The five hottest names should include at least two of Footscray, Dandenong, St Kilda.

## What to say in a room

Stress is a definition, not a model. The hedonic is only there to stop you blaming "the market" when a listing is just far from the station. The lag tells you whether to write a precinct note or a one-off.

## Layout

- `main.py`
- `site/index.html` (generated)
- `outputs/sa2.csv`, `results.json`, `figure.png`
