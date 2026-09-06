-- stg_enrolments: one row per student, typed and de-duplicated on the latest record.
-- Contract: student_id not null and unique; status in (active, deferred, withdrawn).
WITH ranked AS (
    SELECT
        student_id,
        campus,
        LOWER(TRIM(status))                       AS status,
        CAST(units_enrolled AS INTEGER)           AS units_enrolled,
        loaded_at,
        ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY loaded_at DESC) AS rn
    FROM raw_enrolments
    WHERE student_id IS NOT NULL
)
SELECT student_id, campus, status, units_enrolled, loaded_at
FROM ranked
WHERE rn = 1
