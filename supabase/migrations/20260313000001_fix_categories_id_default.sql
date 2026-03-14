-- Fix: categories.id was missing DEFAULT gen_random_uuid().
-- Without this, inserting a row without an explicit id fails with:
-- "null value in column 'id' violates not-null constraint"
ALTER TABLE categories ALTER COLUMN id SET DEFAULT gen_random_uuid();
