# Invoice leak desk

Accounts payable does not need another anomaly score. It needs a queue: two payments, one vendor, a reason to hold the second one.

## The leak

Duplicates (same invoice, two payment ids) and splits (one bill paid as two lines a couple of days apart) are the ones that get through a "unique invoice number" check. This folder plants both, then tries to find them the way a clerk would: block first, score second.

## How it blocks

Vendor + amount rounded to $10 + a five-day window. A second pass looks for two lines from the same vendor whose amounts add to a third open item (the split).

Pairs that survive the block get a score:

- same amount
- remittance-line overlap (`difflib`)
- closeness in days

Precision@20 is the number I care about. If the first screen is dirty, nobody will use the desk.

## Queue

`app.py` is Flask. Hold or release writes `outputs/decisions.csv`. That file is the audit.

```
pip install -r requirements.txt
python main.py
flask --app app run
```

http://127.0.0.1:5000

## Expected printout

Four hundred-odd invoices, a wide block (a hundred-plus pairs), precision at 20 around 0.4. The head of the queue should be the D* duplicates; splits sit further down because the amount bins differ.

## Files

`main.py`, `app.py`, `outputs/invoices.csv`, `outputs/queue.csv`, `outputs/results.json`.
