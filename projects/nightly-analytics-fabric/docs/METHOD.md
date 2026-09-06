# Method — Nightly fabric

Raw tables → SQL models in DAG order (stg_* then mart_*) inside SQLite. tests.yml contracts: not_null, unique, accepted_values, range, row_count, freshness, relationships.

If any test fails, last good metric values stay published. Injected faults: null invoice ids (gate), double enrolments (staging dedupes), stale energy (freshness fail). SLA is p95 simulated minutes.
