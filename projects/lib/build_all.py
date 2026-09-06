"""Write every folder's site/index.html. From repo: python projects/lib/build_all.py"""
import importlib.util
from pathlib import Path

root = Path(__file__).resolve().parent.parent
for d in sorted(root.iterdir()):
    src = d / "build_site.py"
    if not src.exists():
        continue
    spec = importlib.util.spec_from_file_location(d.name + "_site", src)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    mod.write()
    print("wrote", d.name)
