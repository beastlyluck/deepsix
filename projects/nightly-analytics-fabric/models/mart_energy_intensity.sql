-- mart_energy_intensity: kWh per square metre per building over the trailing 30 days.
-- Contract: building_id unique; kwh_per_m2 between 0 and 60; feed fresh within 48 hours.
SELECT
    b.building_id,
    b.name,
    b.floor_area_m2,
    SUM(e.kwh)                                    AS kwh_30d,
    SUM(e.kwh) / b.floor_area_m2                  AS kwh_per_m2,
    MAX(e.reading_date)                           AS last_reading,
    :as_of                                        AS as_of
FROM raw_buildings b
JOIN raw_energy e ON e.building_id = b.building_id
WHERE julianday(e.reading_date) > julianday(:as_of) - 30
GROUP BY b.building_id, b.name, b.floor_area_m2
