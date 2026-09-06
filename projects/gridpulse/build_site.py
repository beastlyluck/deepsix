"""Emit site/data.js only."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from lib.emit import write_data_js_from_outputs

HERE = os.path.dirname(os.path.abspath(__file__))


def write():
    write_data_js_from_outputs(HERE)


if __name__ == "__main__":
    write()
