-- Add lending engine columns to transactions table
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS loan_type TEXT NOT NULL DEFAULT 'NONE'
    CHECK (loan_type IN ('NONE', 'SELF', 'EXTERNAL')),
  ADD COLUMN IF NOT EXISTS lender_name TEXT,
  ADD COLUMN IF NOT EXISTS repaid_amount DECIMAL(18,2) NOT NULL DEFAULT 0;

-- Index for fast debt summary queries
CREATE INDEX IF NOT EXISTS idx_transactions_loan_type
  ON transactions (user_id, loan_type)
  WHERE loan_type <> 'NONE';

COMMENT ON COLUMN transactions.loan_type IS 'NONE = regular transaction; SELF = self-loan to a savings goal; EXTERNAL = loan from third party';
COMMENT ON COLUMN transactions.lender_name IS 'Goal name (SELF) or lender/creditor name (EXTERNAL)';
COMMENT ON COLUMN transactions.repaid_amount IS 'Amount already repaid/restored for this loan transaction';
