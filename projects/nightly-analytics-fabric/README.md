# Nightly analytics fabric

A warehouse that rebuilds every night with tests. If a contract fails, yesterday's numbers stay up.

## Problem

Three teams (registrar, finance, facilities) each need one number every morning: active students, late invoices, energy intensity. The numbers must come from the same build, pass the same contracts, and never silently regress because an upstream feed was late or double-loaded. The transformation from notebook to job is the deliverable.

## Data

Reference: synthetic university operations (enrolment, facilities, finance) with a California housing analog for the tabular shape ([scikit-learn fetch_california_housing](https://scikit-learn.org/stable/modules/generated/sklearn.datasets.fetch_california_housing.html)).

The script generates raw tables per night so it runs offline: 3,000 enrolment rows with inconsistent status casing, 800 invoices, 40 suppliers, 12 buildings and 45 days of daily energy readings. Three faults are injected across a 90-night quarter: a double load of enrolments, null invoice ids, and a stale energy feed.

## Method

- Models: three SQL files in `models/` (`stg_enrolments`, `mart_late_invoices`, `mart_energy_intensity`) executed in DAG order inside an in-memory SQLite database. Staging deduplicates on the latest load and normalises status.
- Contracts: `tests.yml` lists 14 dbt-style tests (not_null, unique, accepted_values, range, row_count_min, freshness_hours, relationships). A small parser reads the file and each test is executed as SQL.
- Publish gate: if any test fails, the semantic layer keeps the previous night's metric values and the night is logged as blocked. Otherwise the three metrics are recomputed and published.
- Semantic layer: each metric has an owner and a single SQL definition over the marts.
- SLA: per-model runtimes are simulated from a lognormal so the quarter has a realistic p95; actual wall-clock per night is also recorded.

## How to run

```
pip install -r ../requirements.txt
python main.py
```

## Results

| Metric | Portfolio | Script (synthetic) |
|---|---|---|
| Nightly SLA | 18 min | printed (p95, simulated) |
| Tests | 42 | 14 |
| Failed days / qtr | 1 | printed |
| Models | 27 | 6 (3 SQL + 3 metrics) |

The double-load night should pass because staging deduplicates it. The null-id and stale-feed nights should block.

## What to feature in an interview

- The publish gate. A failing contract is not an alert to read later; it is the reason the dashboard shows yesterday's number and says so.
- The difference between a fault that staging absorbs and one that must block. Duplicates are a modelling problem; missing keys are a data problem.
- Owners on metrics. When the energy number moves, facilities is the name on it, and the SQL is one file.

## Files

- `main.py` - raw generator, SQL runner, test executor, publish gate, plot.
- `models/stg_enrolments.sql`, `models/mart_late_invoices.sql`, `models/mart_energy_intensity.sql` - the models.
- `tests.yml` - contracts.
- `outputs/results.json`, `outputs/figure.png` - written on each run (gitignored).

The statue does not replace the city.
