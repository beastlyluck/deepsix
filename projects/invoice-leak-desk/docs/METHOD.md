# Method — Invoice leak

Plant exact duplicates and split payments. Block on vendor + rounded amount + 5-day window; splits also if two amounts sum to a third open item.

Score leftover pairs: 0.45 same amount + 0.40 remittance difflib + 0.15 recency. Precision@20 on labelled hold-out. The queue is the product; Flask holds/releases.
