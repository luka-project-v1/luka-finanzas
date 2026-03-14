-- Allow categories to have type 'both' for categories applicable to income and expense transactions
ALTER TABLE categories
  DROP CONSTRAINT IF EXISTS categories_type_check;

ALTER TABLE categories
  ADD CONSTRAINT categories_type_check
    CHECK (type IN ('income', 'expense', 'both'));
