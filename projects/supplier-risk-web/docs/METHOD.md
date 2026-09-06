# Method — Supplier risk

Four-tier DAG: vendors → ports → DCs → hospitals. Edge betweenness (networkx or Brandes BFS). Risk = normalised betweenness × delay p × log volume × (1 + hospitals starved if cut).

Recall: of delay events that starve ≥1 hospital, share that sat in top-17. The brief is the top edge and the hospital count, not the picture.
