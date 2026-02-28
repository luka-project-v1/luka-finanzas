-- Fix: transactions.id was missing DEFAULT gen_random_uuid().
-- Without this, inserting a row without an explicit id would fail with:
-- "null value in column 'id' violates not-null constraint"
ALTER TABLE transactions ALTER COLUMN id SET DEFAULT gen_random_uuid();
