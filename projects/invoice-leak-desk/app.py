"""Review queue.

flask --app app run
"""
from pathlib import Path

import pandas as pd
from flask import Flask, redirect, render_template_string, request, url_for

ROOT = Path(__file__).parent
OUT = ROOT / "outputs"
STATE = OUT / "decisions.csv"

app = Flask(__name__)

PAGE = """
<!doctype html>
<title>AP leak queue</title>
<style>
  body { font-family: Georgia, serif; margin: 24px; background: #faf7f2; color: #1b1b1b; }
  h1 { font-size: 22px; }
  table { border-collapse: collapse; width: 100%; background: #fff; }
  th, td { border-bottom: 1px solid #ddd; padding: 8px; font-size: 14px; text-align: left; }
  form { display: inline; }
  button { font: inherit; padding: 3px 8px; }
  .held { background: #fdecea; }
  .ok { background: #eaf6ea; }
</style>
<h1>AP leak queue</h1>
<p>{{ remaining }} open pairs. Hold if you would stop the second payment.</p>
<table>
  <tr><th>vendor</th><th>a</th><th>b</th><th>amounts</th><th>score</th><th></th></tr>
  {% for r in rows %}
  <tr class="{{ r.cls }}">
    <td>{{ r.vendor }}</td>
    <td>{{ r.a }}</td>
    <td>{{ r.b }}</td>
    <td>{{ r.amount_a }} / {{ r.amount_b }}</td>
    <td>{{ '%.2f'|format(r.score) }}</td>
    <td>
      <form method="post" action="{{ url_for('decide') }}">
        <input type="hidden" name="a" value="{{ r.a }}"/>
        <input type="hidden" name="b" value="{{ r.b }}"/>
        <button name="action" value="hold">hold</button>
        <button name="action" value="release">release</button>
      </form>
    </td>
  </tr>
  {% endfor %}
</table>
"""


def _decisions():
    if STATE.exists():
        return pd.read_csv(STATE)
    return pd.DataFrame(columns=["a", "b", "action"])


@app.route("/")
def queue():
    qpath = OUT / "queue.csv"
    if not qpath.exists():
        return "Run python main.py first.", 400
    q = pd.read_csv(qpath)
    dec = _decisions()
    rows = []
    for r in q.head(25).itertuples():
        k = f"{r.a}|{r.b}"
        act = ""
        if len(dec):
            hit = dec[(dec["a"] == r.a) & (dec["b"] == r.b)]
            if len(hit):
                act = hit.iloc[0]["action"]
        rows.append(
            {
                "vendor": r.vendor,
                "a": r.a,
                "b": r.b,
                "amount_a": r.amount_a,
                "amount_b": r.amount_b,
                "score": r.score,
                "cls": "held" if act == "hold" else "ok" if act == "release" else "",
            }
        )
    remaining = sum(1 for r in rows if r["cls"] == "")
    return render_template_string(PAGE, rows=rows, remaining=remaining)


@app.post("/decide")
def decide():
    a, b, action = request.form["a"], request.form["b"], request.form["action"]
    dec = _decisions()
    dec = pd.concat([dec, pd.DataFrame([{"a": a, "b": b, "action": action}])], ignore_index=True)
    OUT.mkdir(exist_ok=True)
    dec.to_csv(STATE, index=False)
    return redirect(url_for("queue"))


if __name__ == "__main__":
    app.run(debug=False)
