# Data dictionary — Night economy DiD

Stand-in shaped like City of Melbourne pedestrian sensors + PTV late-night frequency. Seed `11`.

| Field | Grain | Notes |
|---|---|---|
| sensor | 0–27 | 7 sit in the treated precinct |
| precinct | 0–3 | 0 is treated (Chapel / Greville stand-in) |
| day | 0–179 | Cut at day 120 |
| post | 0/1 | After the frequency cut |
| treated | 0/1 | Precinct 0 |
| spend | $ proxy | Night-till, not card-level |

True simulated effect is −11% on treated post. Weather and Friday nights hit both strips.
