"""Write site/data.js from a project's outputs. Never touch index.html."""
import json
import os

try:
    from .datajs import write_data_js
except ImportError:
    from datajs import write_data_js


def write_data_js_from_outputs(here):
    dash = os.path.join(here, "outputs", "dashboard.json")
    res = os.path.join(here, "outputs", "results.json")
    payload = {}
    path = dash if os.path.exists(dash) else res
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            payload = json.load(f)
    return write_data_js(os.path.join(here, "site"), payload)
