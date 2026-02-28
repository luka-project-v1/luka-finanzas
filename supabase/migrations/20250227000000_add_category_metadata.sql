-- Add type, color, icon, is_system_category to categories table
-- These columns support custom category styling and classification

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6B7280',
  ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'tag',
  ADD COLUMN IF NOT EXISTS is_system_category BOOLEAN DEFAULT false;
