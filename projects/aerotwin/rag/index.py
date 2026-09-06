"""Chunking and retrieval. Each family gets its own chunker on purpose.

  manual     -> one chunk per paragraph, section header prepended
  cad        -> one chunk per field row plus one summary row for the sheet
  checklist  -> one chunk per step, trigger prepended

Dense embeddings would be swapped in with a local encoder on the aircraft;
offline here we use TF-IDF over word and character n-grams and a small
lexical boost on ids. Recall@3 on planted queries is the honesty check.
"""
import numpy as np
from scipy.sparse import hstack
from sklearn.feature_extraction.text import TfidfVectorizer

SYN = {
    "airport": "aerodrome", "ceiling": "height maximum", "radio": "link lost", "charge": "battery energy reserve",
    "gusty": "wind gust", "drone": "aircraft", "hot": "temperature overtemp", "satellite": "gnss fix",
    "shaky": "vibration imbalance", "size": "diameter", "pack": "battery", "current ceiling": "max current",
}


def chunk(docs):
    chunks = []
    for d in docs:
        head = f"{d['id']} {d['title']} {d['key']}"
        if d["family"] == "manual":
            for i, p in enumerate(d["paragraphs"]):
                chunks.append({"doc": d["id"], "family": "manual", "loc": f"para {i+1}", "text": f"{head}. {p}"})
        elif d["family"] == "cad":
            chunks.append({"doc": d["id"], "family": "cad", "loc": "sheet", "text": f"{head}. " + "; ".join(d["callouts"])})
            for k, v in d["fields"].items():
                chunks.append({"doc": d["id"], "family": "cad", "loc": k, "text": f"{head}. {k.replace('_', ' ')} {v}"})
        else:
            for i, s in enumerate(d["steps"]):
                chunks.append({"doc": d["id"], "family": "checklist", "loc": f"step {i+1}", "text": f"{head}. {d['title']}. {s}"})
    return chunks


def expand(q):
    out = q.lower()
    for k, v in SYN.items():
        if k in out:
            out += " " + v
    return out


class Index:
    def __init__(self, docs):
        self.chunks = chunk(docs)
        texts = [c["text"].lower() for c in self.chunks]
        self.word = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True).fit(texts)
        self.char = TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), sublinear_tf=True).fit(texts)
        self.M = hstack([self.word.transform(texts), 0.6 * self.char.transform(texts)]).tocsr()

    def query(self, q, k=3):
        qe = expand(q)
        v = hstack([self.word.transform([qe]), 0.6 * self.char.transform([qe])]).tocsr()
        scores = (self.M @ v.T).toarray().ravel()
        # collapse to documents: best chunk wins, second-best adds a little
        best = {}
        for i in np.argsort(-scores)[:12]:
            d = self.chunks[i]["doc"]
            best.setdefault(d, []).append((float(scores[i]), i))
        ranked = sorted(best.items(), key=lambda kv: -(kv[1][0][0] + 0.2 * (kv[1][1][0] if len(kv[1]) > 1 else 0)))
        out = []
        for d, hits in ranked[:k]:
            s, i = hits[0]
            c = self.chunks[i]
            out.append({"doc": d, "family": c["family"], "loc": c["loc"], "score": round(s, 3), "text": c["text"]})
        return out


def evaluate(index, planted, k=3):
    hits, per_family = 0, {}
    for q, want in planted:
        res = index.query(q, k)
        ok = any(r["doc"] == want for r in res)
        fam = next(r["family"] for r in res) if res else "none"
        per_family.setdefault(fam, [0, 0])
        per_family[fam][1] += 1
        per_family[fam][0] += int(ok)
        hits += int(ok)
    return hits / len(planted), {f: round(a / b, 2) for f, (a, b) in per_family.items()}
