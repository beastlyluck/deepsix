-- Flink SQL. Windowed features for the SGC scorer, written to the feature store.
-- Source topics carry the Avro schemas in stream/schemas/.

CREATE TABLE bus_telemetry (
  bus_id INT, ts_ms BIGINT, kind STRING, p_mw DOUBLE, v_pu DOUBLE, angle_rad DOUBLE,
  soc_mwh DOUBLE, quality STRING,
  ts AS TO_TIMESTAMP_LTZ(ts_ms, 3),
  WATERMARK FOR ts AS ts - INTERVAL '5' SECOND
) WITH ('connector' = 'kafka', 'topic' = 'grid.bus.telemetry', 'format' = 'avro-confluent',
        'properties.bootstrap.servers' = 'kafka:9092', 'scan.startup.mode' = 'latest-offset');

CREATE TABLE line_flow (
  line_id INT, ts_ms BIGINT, from_bus INT, to_bus INT, flow_mw DOUBLE,
  limit_static_mw DOUBLE, limit_dynamic_mw DOUBLE, conductor_hotspot_c DOUBLE, status STRING,
  ts AS TO_TIMESTAMP_LTZ(ts_ms, 3),
  WATERMARK FOR ts AS ts - INTERVAL '5' SECOND
) WITH ('connector' = 'kafka', 'topic' = 'grid.line.flow', 'format' = 'avro-confluent',
        'properties.bootstrap.servers' = 'kafka:9092');

-- 60 s tumbling windows per bus. Incident-line loading is a self-join through the edge list.
CREATE VIEW line_loading AS
SELECT line_id, from_bus, to_bus, ts,
       ABS(flow_mw) / limit_dynamic_mw AS loading,
       CASE WHEN status <> 'CLOSED' THEN 1 ELSE 0 END AS is_open
FROM line_flow;

CREATE VIEW incident AS
SELECT from_bus AS bus_id, line_id, ts, loading, is_open FROM line_loading
UNION ALL
SELECT to_bus AS bus_id, line_id, ts, loading, is_open FROM line_loading;

INSERT INTO bus_features
SELECT
  b.bus_id,
  window_start, window_end,
  AVG(b.p_mw)                       AS inj_mean,
  AVG(ABS(b.p_mw))                  AS inj_abs,
  COUNT(DISTINCT i.line_id) - SUM(i.is_open) AS live_degree,
  SUM(i.loading)                    AS inc_loading_sum,
  MAX(i.loading)                    AS inc_loading_max,
  MAX(i.is_open)                    AS near_trip,
  SUM(CASE WHEN i.loading > 0.9 THEN 1 ELSE 0 END) AS n_lines_hot,
  MIN(CASE WHEN b.quality = 'GOOD' THEN 1 ELSE 0 END) AS all_good
FROM TABLE(TUMBLE(TABLE bus_telemetry, DESCRIPTOR(ts), INTERVAL '60' SECOND)) b
LEFT JOIN incident i
  ON i.bus_id = b.bus_id AND i.ts BETWEEN b.window_start AND b.window_end
GROUP BY b.bus_id, window_start, window_end;
