import json
import os


def write_data_js(site_dir, payload):
    os.makedirs(site_dir, exist_ok=True)
    path = os.path.join(site_dir, "data.js")
    with open(path, "w", encoding="utf-8") as f:
        f.write("window.CASE = ")
        json.dump(payload, f)
        f.write(";\n")
    return path
