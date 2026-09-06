# Data dictionary — VIC ED flow

Stand-in shaped like public Victorian ED / ambulance ramping reports. Not an AHV extract. Seed `19`.

## Slot table (`outputs/flow.csv`)

| Field | Grain | Meaning |
|---|---|---|
| campus | Alfred, Royal Melbourne, Monash Clayton, Austin | Four metro campuses |
| slot | 0 … 1343 | 15-minute index over 14 winter days |
| day | 0–13 | Day 7+ is Austin flu week |
| hour | 0–23.75 | Site local |
| arrivals | count | Poisson draw from the GLM intensity |
| occupancy | count | Patients in a bay |
| bays | 42 / 48 / 36 / 28 | Physical cap. When full, arrivals ramp |
| ramping | count | Ambulance queue waiting for a bay |
| wait_min | minutes | Function of occupancy and ramp, plus noise |
| at_risk_4h | 0/1 | wait ≥ 90 min (early four-hour flag) |

## Winter residual

First-week midnight occupancy median per campus. Last night minus that median is the residual. Austin is built to trip it.

## What is missing on purpose

No triage category, no specialty, no named patient, no live CAD feed. This is a flow board, not a clinical record.
