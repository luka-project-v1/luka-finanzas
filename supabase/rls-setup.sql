-- =============================================================
-- LUKA-FINANZAS — Row Level Security (RLS) Setup
-- Copiar y pegar COMPLETO en el Editor SQL de Supabase
-- Última actualización: 2026-03-13
-- =============================================================

-- ⚠️  IMPORTANTE:
--   - El rol `service_role` (usado en createAdminClient) bypasea RLS automáticamente.
--   - El rol `anon` con sesión JWT (usado en createClient con cookies) respeta RLS.
--   - Las políticas usan auth.uid()::text porque user_id es TEXT (UUID string).
-- =============================================================


-- 1. HABILITAR RLS EN TODAS LAS TABLAS
-- =============================================================
ALTER TABLE public.accounts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_tags     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_account_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_card_details  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currencies           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                ENABLE ROW LEVEL SECURITY;

-- account_types es tabla global (data fija de seed), lectura para todos los auth
ALTER TABLE public.account_types        ENABLE ROW LEVEL SECURITY;


-- 2. ELIMINAR POLÍTICAS PREVIAS (idempotente — re-ejecutar es seguro)
-- =============================================================
DROP POLICY IF EXISTS "user_accounts"             ON public.accounts;
DROP POLICY IF EXISTS "user_transactions"          ON public.transactions;
DROP POLICY IF EXISTS "user_transfers"             ON public.transfers;
DROP POLICY IF EXISTS "user_categories"            ON public.categories;
DROP POLICY IF EXISTS "user_reconciliations"       ON public.reconciliations;
DROP POLICY IF EXISTS "user_tags"                  ON public.tags;
DROP POLICY IF EXISTS "user_transaction_tags"      ON public.transaction_tags;
DROP POLICY IF EXISTS "user_bank_account_details"  ON public.bank_account_details;
DROP POLICY IF EXISTS "user_credit_card_details"   ON public.credit_card_details;
DROP POLICY IF EXISTS "user_currencies"            ON public.currencies;
DROP POLICY IF EXISTS "user_own_profile"           ON public.users;
DROP POLICY IF EXISTS "account_types_read"         ON public.account_types;


-- 3. POLÍTICAS PARA TABLAS CON user_id DIRECTO
-- =============================================================

-- accounts
CREATE POLICY "user_accounts" ON public.accounts
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- transactions
CREATE POLICY "user_transactions" ON public.transactions
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- transfers
CREATE POLICY "user_transfers" ON public.transfers
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- categories
CREATE POLICY "user_categories" ON public.categories
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- reconciliations
CREATE POLICY "user_reconciliations" ON public.reconciliations
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- tags
CREATE POLICY "user_tags" ON public.tags
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- currencies (tabla gestionada fuera de Prisma, solo en Supabase)
CREATE POLICY "user_currencies" ON public.currencies
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- users (cada usuario ve y modifica solo su propio perfil)
CREATE POLICY "user_own_profile" ON public.users
  FOR ALL
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);


-- 4. POLÍTICAS PARA TABLAS DE DETALLE (sin user_id propio — via JOIN)
-- =============================================================

-- bank_account_details → protegida a través de la cuenta propietaria
CREATE POLICY "user_bank_account_details" ON public.bank_account_details
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = bank_account_details.account_id
        AND auth.uid()::text = accounts.user_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = bank_account_details.account_id
        AND auth.uid()::text = accounts.user_id
    )
  );

-- credit_card_details → igual que bank_account_details
CREATE POLICY "user_credit_card_details" ON public.credit_card_details
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = credit_card_details.account_id
        AND auth.uid()::text = accounts.user_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = credit_card_details.account_id
        AND auth.uid()::text = accounts.user_id
    )
  );

-- transaction_tags → protegida a través de la transacción propietaria
CREATE POLICY "user_transaction_tags" ON public.transaction_tags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions
      WHERE transactions.id = transaction_tags.transaction_id
        AND auth.uid()::text = transactions.user_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transactions
      WHERE transactions.id = transaction_tags.transaction_id
        AND auth.uid()::text = transactions.user_id
    )
  );


-- 5. ACCOUNT_TYPES — Tabla global, solo lectura para usuarios autenticados
-- =============================================================
CREATE POLICY "account_types_read" ON public.account_types
  FOR SELECT
  USING (auth.role() = 'authenticated');


-- 6. NOTAS SOBRE SERVICE_ROLE (Prisma server-side)
-- =============================================================
-- El rol service_role en Supabase bypasea RLS automáticamente sin ninguna config adicional.
-- createAdminClient() ya usa SUPABASE_SERVICE_ROLE_KEY → bypasea RLS (para cron jobs).
-- createClient() usa NEXT_PUBLIC_SUPABASE_ANON_KEY + JWT cookie → respeta RLS.
-- No se necesita ninguna configuración extra en Prisma para este comportamiento.


-- 7. VERIFICACIÓN — Ejecutar para confirmar que RLS está activo
-- =============================================================
SELECT
  schemaname,
  tablename,
  rowsecurity AS "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
