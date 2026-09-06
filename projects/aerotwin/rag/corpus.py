"""Three document families the drone has to answer from, offline.

Nothing here is a real regulation or a real part sheet. Shapes are right;
wording is invented so the retrieval test is not memorised text.

  manual     - regulatory sections, numbered, paragraph text
  cad        - part sheets: a table of fields plus dimension callouts
  checklist  - anomaly -> ordered steps
"""
import random

RULE_TOPICS = [
    ("101.245", "Operation near aerodromes", "aerodrome", "Do not operate within 5.5 km of a controlled aerodrome without approval."),
    ("101.238", "Maximum height", "height", "Remain at or below 120 m above ground level unless an area approval says otherwise."),
    ("101.250", "Visual line of sight", "vlos", "The remote pilot must keep the aircraft in visual line of sight at all times."),
    ("101.255", "Night operations", "night", "Night flight requires anti-collision lighting visible for 3 km and a night rating."),
    ("101.270", "Populous areas", "populous", "Do not fly over a populous area at a height from which a failure would endanger people."),
    ("101.280", "Distance from people", "people", "Keep 30 m from any person not directly associated with the operation."),
    ("101.300", "Swarm and multiple aircraft", "swarm", "Operating more than one aircraft per pilot requires a swarm approval and a supervising pilot."),
    ("101.310", "Lost link procedure", "lostlink", "On C2 link loss the aircraft must execute a pre-declared return or hold within 10 s."),
    ("101.320", "Wind limits", "wind", "Do not launch when steady wind exceeds the manufacturer limit or gusts exceed 1.5 times it."),
    ("101.330", "Battery reserve", "battery", "Land with at least 20 percent usable energy remaining."),
]

PARTS = [
    ("QX-ARM-380", "Carbon arm", {"length_mm": 380, "wall_mm": 1.6, "mass_g": 42, "material": "3K twill CFRP"}, "arm"),
    ("QX-MOT-2806", "Brushless motor", {"kv": 1300, "max_current_a": 38, "stator": "28x06", "mass_g": 58}, "motor"),
    ("QX-PROP-1045", "Propeller", {"diameter_in": 10, "pitch_in": 4.5, "blades": 2, "mass_g": 9}, "prop"),
    ("QX-ESC-45", "Electronic speed controller", {"cont_current_a": 45, "burst_a": 60, "protocol": "DShot600"}, "esc"),
    ("QX-FC-7", "Flight controller", {"imu": "dual ICM-42688", "loop_hz": 8000, "mass_g": 11}, "fc"),
    ("QX-BAT-6S", "Battery pack", {"cells": 6, "capacity_mah": 8000, "c_rating": 25, "mass_g": 890}, "battery"),
    ("QX-GPS-M10", "GNSS module", {"constellations": 4, "rate_hz": 10, "mass_g": 14}, "gnss"),
    ("QX-FRAME-X", "Centre plate", {"plate_mm": 3.0, "bolt_pattern": "30.5x30.5", "mass_g": 96}, "frame"),
]

ANOMALIES = [
    ("motor_overtemp", "Motor temperature above 95 C", ["Reduce throttle to 60 percent", "Widen formation spacing", "Land within 90 s if trend continues"]),
    ("gnss_dropout", "GNSS fix lost for more than 2 s", ["Switch to optical flow hold", "Freeze formation reference", "Climb 5 m to reacquire"]),
    ("battery_sag", "Cell voltage sag under load", ["Cut aggressive manoeuvres", "Announce reserve state to swarm", "Return to launch when under 25 percent"]),
    ("imu_disagree", "IMU pair disagrees beyond 3 deg", ["Trust the lower-noise unit", "Disable acrobatic mode", "Log for post-flight calibration"]),
    ("link_degraded", "C2 link RSSI below -95 dBm", ["Hold position", "Raise telemetry rate to keepalive only", "Start lost-link timer"]),
    ("prop_imbalance", "Vibration above 0.6 g at blade frequency", ["Reduce speed", "Flag the arm for inspection", "Do not launch again before balance check"]),
]


def build(seed=5, filler_per_rule=2):
    rng = random.Random(seed)
    docs = []
    for code, title, key, body in RULE_TOPICS:
        paras = [body]
        for _ in range(filler_per_rule):
            paras.append(rng.choice([
                "This section applies to remotely piloted aircraft under 25 kg.",
                "Approvals are issued in writing and may carry conditions.",
                "The operator must keep records for two years.",
                "Contravention is an offence of strict liability.",
            ]))
        docs.append({"family": "manual", "id": code, "title": title, "key": key, "paragraphs": paras})
    for pn, name, fields, key in PARTS:
        callouts = [f"{k} {v}" for k, v in fields.items()]
        docs.append({"family": "cad", "id": pn, "title": name, "key": key, "fields": fields,
                     "callouts": callouts})
    for aid, trigger, steps in ANOMALIES:
        docs.append({"family": "checklist", "id": aid, "title": trigger, "key": aid, "steps": steps})
    return docs


def planted_queries():
    """(query, expected doc id). Phrased away from the source wording."""
    q = [
        ("how close can we get to an airport", "101.245"),
        ("ceiling for the flight", "101.238"),
        ("more than one drone under one pilot", "101.300"),
        ("what happens when the radio drops", "101.310"),
        ("gusty conditions launch decision", "101.320"),
        ("how much charge do we need to keep", "101.330"),
        ("how long is the arm", "QX-ARM-380"),
        ("motor current ceiling", "QX-MOT-2806"),
        ("prop size", "QX-PROP-1045"),
        ("pack capacity and C rating", "QX-BAT-6S"),
        ("motor running hot what do we do", "motor_overtemp"),
        ("lost satellite fix steps", "gnss_dropout"),
        ("shaky at blade frequency", "prop_imbalance"),
        ("two imus not agreeing", "imu_disagree"),
    ]
    return q
