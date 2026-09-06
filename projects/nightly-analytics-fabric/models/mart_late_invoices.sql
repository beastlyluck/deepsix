-- mart_late_invoices: open invoices past due, with days late and an ageing bucket.
-- Contract: invoice_id not null and unique; days_late > 0; at least one row.
-- Deliberately no IS NOT NULL filter on invoice_id: a null key is a source fault the
-- not_null test must surface, not something the model quietly drops.
SELECT
    invoice_id,
    supplier,
    amount,
    due_date,
    CAST(julianday(:as_of) - julianday(due_date) AS INTEGER) AS days_late,
    CASE
        WHEN julianday(:as_of) - julianday(due_date) <= 30 THEN '1-30'
        WHEN julianday(:as_of) - julianday(due_date) <= 60 THEN '31-60'
        ELSE '60+'
    END AS ageing_bucket,
    :as_of AS as_of
FROM raw_invoices
WHERE paid_date IS NULL
  AND julianday(due_date) < julianday(:as_of)
