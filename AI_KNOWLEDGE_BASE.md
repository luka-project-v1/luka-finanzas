# Luka — Complete AI Knowledge Base

> Last updated: March 2026. This document is the single source of truth for the entire Luka application. Intended for external AI assistants that need full context.

---

## 1. Project Overview

**Luka** is a Personal Finance Control web application (PWA-ready).

- **Name origin**: "Luka" is Latin American slang for money.
- **Primary market**: Colombia / Latin America (dual-currency: COP + USD).
- **Stack**: Next.js 14 (App Router) + Supabase (auth + database) + Prisma (ORM layer, generated types) + Tailwind CSS + shadcn/ui.
- **Design aesthetic**: Dark neumorphism — deep blacks, soft raised/inset shadows, terracotta accent (`#D97757`).
- **Language of all code, comments, and documentation**: English (UI strings may be in Spanish).

---

## 2. Tech Stack & Dependencies

| Category | Library / Version |
|---|---|
| Framework | Next.js 14.2+ (App Router, Server Actions) |
| Auth + DB | Supabase (`@supabase/supabase-js` 2.45, `@supabase/ssr` 0.8) |
| ORM | Prisma 7.2 (`@prisma/client`) |
| UI | shadcn/ui, Radix UI, Lucide React 0.445 |
| Styling | Tailwind CSS 3.4 + `tailwindcss-animate` |
| Forms | React Hook Form 7.53 + `@hookform/resolvers` |
| Validation | Zod 3.23 |
| Currency math | Decimal.js 10.4 |
| Charts | Recharts 2.12 |
| Date utils | date-fns 3.6 |
| Toasts | Sonner 2.0 |
| Testing | Jest 29 + React Testing Library 16 |
| TypeScript | Strict mode, v5 |

### Key npm scripts
```
dev              → next dev
build            → next build
db:generate      → prisma generate
db:push          → prisma db push
db:migrate       → prisma migrate dev
db:seed          → tsx prisma/seed.ts
test             → jest
```

### Environment variables required
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY    (admin client for cron jobs)
CURRENCY_API_KEY             (currencyapi.net)
CRON_SECRET                  (protects /api/cron/refresh-rates)
NEXT_PUBLIC_APP_URL          (for auth email redirect)
```

---

## 3. Repository Structure

```
luka-finanzas/
├── src/
│   ├── app/
│   │   ├── (auth)/                    # Public auth pages
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (dashboard)/               # Protected app pages
│   │   │   ├── layout.tsx             # Auth guard + default currencies init
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx
│   │   │   │   └── _components/
│   │   │   │       ├── summary-cards.tsx
│   │   │   │       ├── accounts-strip.tsx
│   │   │   │       ├── recent-transactions.tsx
│   │   │   │       └── refresh-balances-button.tsx
│   │   │   ├── accounts/
│   │   │   │   ├── page.tsx
│   │   │   │   └── _components/
│   │   │   │       ├── accounts-view.tsx
│   │   │   │       └── create-account-dialog.tsx
│   │   │   ├── transactions/
│   │   │   │   ├── page.tsx
│   │   │   │   └── _components/
│   │   │   │       ├── transactions-view.tsx
│   │   │   │       └── create-transaction-dialog.tsx
│   │   │   ├── credits/
│   │   │   │   ├── page.tsx
│   │   │   │   └── _components/
│   │   │   │       ├── credits-view.tsx
│   │   │   │       ├── create-credit-card-dialog.tsx
│   │   │   │       └── card-detail-panel.tsx
│   │   │   ├── categories/
│   │   │   │   ├── page.tsx
│   │   │   │   └── _components/
│   │   │   │       ├── categories-view.tsx
│   │   │   │       └── create-category-dialog.tsx
│   │   │   └── currencies/
│   │   │       ├── page.tsx
│   │   │       └── _components/
│   │   │           └── currencies-view.tsx
│   │   ├── api/
│   │   │   └── cron/
│   │   │       └── refresh-rates/route.ts   # GET endpoint, secured by CRON_SECRET
│   │   ├── layout.tsx                        # Root layout (fonts, global CSS)
│   │   └── page.tsx                          # Root → redirects to /login
│   ├── components/
│   │   ├── shared/
│   │   │   └── sidebar-nav.tsx
│   │   └── ui/
│   │       ├── dialog.tsx
│   │       ├── form-fields.tsx
│   │       ├── skeleton.tsx
│   │       └── tooltip.tsx
│   └── lib/
│       ├── actions/           # Server Actions (entry point for all mutations)
│       │   ├── auth.ts
│       │   ├── accounts.ts
│       │   ├── transactions.ts
│       │   ├── credits.ts
│       │   ├── categories.ts
│       │   └── currencies.ts
│       ├── repositories/      # Data Access Layer (Supabase queries, no business logic)
│       │   ├── account-repository.ts
│       │   ├── transaction-repository.ts
│       │   └── credit-card-repository.ts
│       ├── validations/       # Zod schemas
│       │   ├── account-schema.ts
│       │   ├── transaction-schema.ts
│       │   ├── credit-card-schema.ts
│       │   └── category-schema.ts
│       ├── types/
│       │   └── database.types.ts   # Auto-generated from Supabase schema
│       ├── utils/
│       │   ├── currency.ts
│       │   ├── date.ts
│       │   └── cn.ts
│       ├── constants/
│       │   └── categories.ts
│       ├── supabase/
│       │   ├── client.ts      # Browser Supabase client
│       │   └── server.ts      # Server Supabase client (+ admin client)
│       └── prisma/
│           └── client.ts      # Prisma singleton
├── middleware.ts               # Auth guard for all routes
├── tailwind.config.ts
├── next.config.js
├── vercel.json                 # Cron job config (every 12h)
├── prisma/
│   └── seed.ts
└── supabase/
    └── migrations/
```

---

## 4. Authentication & Routing

### Middleware (`middleware.ts`)

Runs on every request (except static assets). Uses `@supabase/ssr` `createServerClient`.

- **Unauthenticated + non-public path** → redirect to `/login`
- **Authenticated + `/login` or `/signup`** → redirect to `/dashboard`
- Public paths: `/`, `/login`, `/signup`, `/auth/*`

### Auth Server Actions (`lib/actions/auth.ts`)

| Function | Description |
|---|---|
| `signUp(data)` | Creates Supabase auth user, sends confirmation email |
| `signIn(data)` | `signInWithPassword`, then `redirect('/dashboard')` |
| `signOut()` | Clears session, `redirect('/login')` |
| `getCurrentUser()` | Returns Supabase user or null |

Both `signIn` and `signOut` call `revalidatePath('/', 'layout')` before redirecting.

### Dashboard Layout (`app/(dashboard)/layout.tsx`)

1. Calls `getCurrentUser()` — redirects to `/login` if null.
2. Calls `getOrCreateDefaultCurrencies()` to ensure user has USD + COP.
3. Renders `<SidebarNav>` + main content area.

---

## 5. Database Schema (Supabase / PostgreSQL)

All tables use Row Level Security (RLS). Users can only access their own data via `user_id` foreign keys. All monetary amounts use `decimal(18,2)` stored as `number` in TypeScript.

### Tables

#### `users`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | Mirrors Supabase Auth user ID |
| email | text | |
| full_name | text nullable | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `account_types` (lookup / seed table)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| code | text | `BANK_ACCOUNT`, `CREDIT_CARD` |
| name | text | |
| balance_nature | enum | `ASSET`, `LIABILITY` |

#### `accounts`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → users | |
| account_type_id | uuid FK → account_types | |
| name | text | |
| currency_code | text | e.g., `USD`, `COP` |
| institution_name | text nullable | |
| status | enum | `ACTIVE`, `CLOSED` |
| opened_at | date nullable | |
| closed_at | date nullable | |
| external_id | text nullable | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Note: Balance is **not stored** — it is always calculated from transactions at query time.

#### `bank_account_details` (1:1 with accounts where type = BANK_ACCOUNT)
| Column | Type | Notes |
|---|---|---|
| account_id | uuid PK/FK → accounts | |
| kind | enum | `SAVINGS`, `CHECKING` |
| bank_name | text nullable | |
| masked_number | text nullable | Last 4 digits or full masked |
| interest_rate_annual | decimal nullable | |
| monthly_fee | decimal nullable | |
| overdraft_limit | decimal nullable | |

#### `credit_card_details` (1:1 with accounts where type = CREDIT_CARD)
| Column | Type | Notes |
|---|---|---|
| account_id | uuid PK/FK → accounts | |
| issuer | text nullable | `VISA`, `MASTERCARD`, `AMEX` |
| bank_name | text nullable | |
| last4 | text(4) nullable | Last 4 digits |
| credit_limit | decimal nullable | |
| management_fee | decimal nullable | |
| management_fee_period | text nullable | `MONTHLY`, `ANNUAL` |
| interest_rate_annual | decimal nullable | |
| interest_rate_monthly | decimal nullable | |
| billing_cycle_day | int nullable | Day of month (1–31) |
| payment_due_day | int nullable | Day of month (1–31) |
| last_statement_date | date nullable | |

#### `transactions`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → users | |
| account_id | uuid FK → accounts | |
| category_id | uuid nullable FK → categories | |
| signed_amount | decimal | Positive = credit/income, Negative = debit/expense |
| kind | enum | `NORMAL`, `TRANSFER`, `ADJUSTMENT`, `FEE`, `INTEREST` |
| status | enum | `PENDING`, `POSTED`, `VOID` |
| description | text(500) nullable | |
| occurred_at | timestamptz | When the transaction happened |
| posted_at | timestamptz nullable | When it cleared |
| source | text(50) | Default `MANUAL` |
| transfer_id | uuid nullable FK → transfers | |
| reconciliation_id | uuid nullable FK → reconciliations | |
| balance_after | decimal nullable | Snapshot balance after this tx |
| created_at / updated_at | timestamptz | |

#### `categories`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → users | |
| name | text | |
| type | text | `income` or `expense` |
| color | text | Hex color string |
| icon | text | Lucide icon name |
| parent_id | uuid nullable FK → categories | Hierarchical categories |
| is_system_category | boolean | Default system categories |
| created_at / updated_at | timestamptz | |

Note: The `categories` table has extra columns (`type`, `color`, `icon`, `is_system_category`) beyond what the auto-generated Prisma types show. This is because the Supabase migration added these after the initial Prisma schema was generated. Always use Supabase client directly for categories.

#### `currencies` (NOT in Prisma-generated types — use Supabase client with `as any`)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → users | |
| code | text | `USD`, `COP` |
| name | text | |
| symbol | text | `$`, `COP$` |
| exchange_rate_to_preferred | decimal nullable | Units of this currency per 1 unit of base (stored as USD-based rate from currencyapi.net) |
| created_at / updated_at | timestamptz | |

The preferred/base currency is identified as the one with `exchange_rate_to_preferred = 1` (or `null` as fallback).

#### `transfers`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → users | |
| from_account_id | uuid FK → accounts | |
| to_account_id | uuid FK → accounts | |
| from_transaction_id | uuid nullable FK → transactions | |
| to_transaction_id | uuid nullable FK → transactions | |
| amount | decimal | |
| currency_code | text | |
| status | enum | `PENDING`, `POSTED`, `VOID` |
| occurred_at | timestamptz | |

#### `reconciliations`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → users | |
| account_id | uuid FK → accounts | |
| entered_balance | decimal | Balance the user entered |
| calculated_balance_before | decimal | What the system had |
| delta | decimal | Difference |
| note | text nullable | |
| occurred_at | timestamptz | |

#### `tags` + `transaction_tags` (pivot)
Simple tagging system — tags belong to a user, many-to-many with transactions.

### Enums

```sql
account_status:       ACTIVE | CLOSED
balance_nature:       ASSET | LIABILITY
bank_account_kind:    SAVINGS | CHECKING
transaction_kind:     NORMAL | TRANSFER | ADJUSTMENT | FEE | INTEREST
transaction_status:   PENDING | POSTED | VOID
```

---

## 6. Balance Calculation Logic

This is a critical piece of business logic. Balances are **never stored** on the `accounts` table — they are computed from transactions every time.

### Algorithm (`accountRepository.calculateBalance`)

1. Find the most recent `POSTED` `ADJUSTMENT` transaction for the account.
2. **If an ADJUSTMENT exists**: The `signed_amount` of that adjustment IS the balance at that point in time. Then sum all `POSTED`, non-`ADJUSTMENT` transactions that occurred **strictly after** that adjustment's `occurred_at`. Add to the checkpoint.
3. **If no ADJUSTMENT**: Sum all `POSTED` transactions (legacy behavior).

This allows users to reconcile accounts by entering a real-world balance as an ADJUSTMENT transaction, which acts as a checkpoint going forward.

### Historical Transactions

In the transactions list UI, any transaction that is "pre-adjustment" (occurred at or before the most recent ADJUSTMENT for its account) is marked as **historical**:
- Displayed with reduced opacity + strikethrough + "Histórico" badge
- A tooltip explains it doesn't affect the current balance
- The active ADJUSTMENT row itself is NOT historical (it's the current checkpoint)

### Summary Calculation (Income/Expense)

The `transactionRepository.getSummary` method also respects the adjustment checkpoint:
- Loads all ADJUSTMENT transactions to build a `lastAdjMap` per account
- For each transaction in the date range, if `occurred_at <= lastAdjustmentDate`, it's skipped
- TRANSFER and ADJUSTMENT kinds are excluded from income/expense totals
- ASSET accounts: positive `signed_amount` = income, negative = expense
- LIABILITY accounts (credit cards): positive = expense (charge), negative = payment (NOT counted as income)

---

## 7. Multi-Currency System

### Storage
- Rates are stored as "units of that currency per 1 USD" (the currencyapi.net base).
  - USD: rate = 1
  - COP: rate ≈ 4200 (meaning 1 USD = 4200 COP)
- The preferred/base currency for a user is whichever currency has `exchange_rate_to_preferred = 1`.

### Conversion formula (`lib/utils/currency.ts → convertToBase`)
```
amount × (toRate / fromRate)
```
Examples:
- COP → USD: `4,200,000 × (1 / 4200) = 1,000`
- USD → COP: `1,000 × (4200 / 1) = 4,200,000`

### Rate refresh
- **Manual**: User clicks "Actualizar Tasas de Cambio" on the Currencies page → calls `refreshExchangeRates()` Server Action.
- **Automatic (cron)**: Vercel cron job calls `GET /api/cron/refresh-rates` every 12 hours, secured by `CRON_SECRET` Bearer token. Uses `refreshAllUsersExchangeRates()` which uses the Supabase admin client (bypasses RLS).
- **API source**: `https://currencyapi.net/api/v2/rates?base=USD&output=json&key=<CURRENCY_API_KEY>`

### Dashboard defaults
When the dashboard layout loads, `getOrCreateDefaultCurrencies()` ensures the user has USD + COP rows in the `currencies` table. Both start with `exchange_rate_to_preferred = 1` as a placeholder until the user refreshes rates.

---

## 8. Server Actions Reference

All Server Actions:
1. Authenticate via `getCurrentUser()` (calls `supabase.auth.getUser()`).
2. Return `ActionResult<T>` = `{ success: true; data: T } | { success: false; error: string; details?: unknown }`.
3. Call `revalidatePath(...)` on success.

### `lib/actions/auth.ts`
| Export | Signature | Notes |
|---|---|---|
| `signUp` | `(data: unknown) → ActionResult<{email}>` | Validates with Zod, calls `supabase.auth.signUp` |
| `signIn` | `(data: unknown) → ActionResult<void>` | Validates, `signInWithPassword`, redirects to `/dashboard` |
| `signOut` | `() → ActionResult<void>` | Clears session, redirects to `/login` |
| `getCurrentUser` | `() → User \| null` | Used by layout/server components |

### `lib/actions/accounts.ts`
| Export | Notes |
|---|---|
| `getBankAccounts()` | Returns all accounts of type BANK_ACCOUNT for current user |
| `getBankAccount(id)` | Single BANK_ACCOUNT with validation |
| `createBankAccount(data)` | Validates with `createBankAccountSchema`, creates account + `bank_account_details` |
| `updateBankAccount(id, data)` | Validates with `updateBankAccountSchema`, updates account + details |
| `deleteBankAccount(id)` | Cascades deletion of details |
| `getTotalBalanceInPreferredCurrency()` | Sums all active BANK_ACCOUNT balances, converts to preferred currency. Returns `{total, preferredCode, preferredSymbol}` |

### `lib/actions/transactions.ts`
| Export | Notes |
|---|---|
| `getTransactions(filters?)` | Paginated (default 20/page). Filters: `startDate`, `endDate`, `categoryId`, `accountId`, `kind`, `status`, `page`, `limit`. Returns `{data, count, totalPages}` |
| `getTransaction(id)` | Single transaction with relations |
| `createTransaction(data)` | Validates with `createTransactionSchema` |
| `updateTransaction(id, data)` | Validates with `updateTransactionSchema` |
| `deleteTransaction(id)` | Hard delete |
| `getTransactionsSummary(startDate, endDate)` | Returns `{totalIncome, totalExpense, balance, preferredCode, preferredSymbol}` in user's preferred currency |
| `getLastAdjustmentDates(accountIds[])` | Returns `Record<accountId, {date, id}>` for most recent ADJUSTMENT per account. Used for historical marking in the UI |
| `getAccountTransactions(accountId, startDate?, endDate?)` | All transactions for one account (limit 1000) |

### `lib/actions/credits.ts`
| Export | Notes |
|---|---|
| `createCreditCard(data)` | Validates with `createCreditCardSchema`, creates account + `credit_card_details` |
| `updateCreditCard(id, data)` | Validates with `updateCreditCardSchema` |
| `deleteCreditCard(id)` | Cascades |
| `getCreditCards()` | All credit cards for current user |
| `getCreditCardTransactions(cardId, startDate?, endDate?)` | Transactions for a specific credit card |

### `lib/actions/categories.ts`
| Export | Notes |
|---|---|
| `getCategories()` | All categories for current user, ordered by name |
| `getOrCreateDefaultCategories()` | If user has no categories, creates 13 default ones (9 expense + 4 income) |
| `createCategory(data)` | Validates with `createCategorySchema` |
| `updateCategory(id, data)` | Validates with `updateCategorySchema` |

**Default categories created on first use:**
- Expenses: Alimentación, Transporte, Entretenimiento, Salud, Educación, Vivienda, Servicios, Ropa, Otros Gastos
- Income: Salario, Freelance, Inversiones, Otros Ingresos

### `lib/actions/currencies.ts`
| Export | Notes |
|---|---|
| `getCurrencies()` | All currencies for current user, ordered by code |
| `getOrCreateDefaultCurrencies()` | Creates USD + COP if none exist |
| `refreshExchangeRates()` | Fetches live rates from currencyapi.net, updates current user's currencies |
| `refreshAllUsersExchangeRates()` | Admin: refreshes ALL users (used by cron). Uses `createAdminClient()` (service role, bypasses RLS) |

---

## 9. Repository Layer

### `accountRepository`
Located at `lib/repositories/account-repository.ts`.

- `getAll(userId)`: Fetches all accounts with `account_types`, `bank_account_details`, `credit_card_details`. Calculates balance for each via `calculateBalance()`.
- `getById(id, userId)`: Same joins + balance.
- `create(account, details?)`: Inserts account, then inserts into the correct details table based on `account_type.code`.
- `update(id, userId, updates)`: Updates account row.
- `delete(id, userId)`: Deletes details first, then account.
- `calculateBalance(accountId)`: The core balance algorithm (see Section 6).
- `getAccountType(typeId)`: Lookup by ID.
- `getAccountTypeByCode(code)`: Lookup by code string (e.g., `'BANK_ACCOUNT'`).

### `transactionRepository`
Located at `lib/repositories/transaction-repository.ts`.

- `getAll(userId, filters?)`: Paginated query with optional date/category/account/kind/status filters. Returns `{data, count}`.
- `getById(id, userId)`: Single with relations.
- `create(transaction)`: Insert + return with relations.
- `update(id, userId, updates)`: Update + return with relations.
- `delete(id, userId)`: Hard delete.
- `getLastAdjustmentPerAccount(userId, accountIds[])`: Returns `Map<accountId, {date, id}>` for most recent POSTED ADJUSTMENT.
- `getSummary(userId, startDate, endDate, rateByCode?, preferredCode?)`: Calculates income/expense totals with currency conversion and adjustment-awareness (see Section 6).

### `creditCardRepository`
Located at `lib/repositories/credit-card-repository.ts`. Thin wrapper over `accountRepository`.

- `create(data)`: Gets CREDIT_CARD account type, delegates to `accountRepository.create`.
- `getById(id, userId)`: Returns account with `credit_card_details`.
- `getAll(userId)`: All credit card accounts with details + balance.
- `update(id, userId, updates)`: Updates account and/or details separately.
- `delete(id, userId)`: Delegates to `accountRepository.delete`.

---

## 10. Zod Validation Schemas

### `createBankAccountSchema`
```typescript
{
  name: string (min 1, max 100)
  currency_code: enum ['USD', 'COP']
  institution_name?: string | null (max 100)
  opened_at?: string | null (YYYY-MM-DD)
  kind: enum ['SAVINGS', 'CHECKING']
  bank_name?: string | null
  masked_number?: string | null (max 20)
  interest_rate_annual?: number | null (0-100)
  monthly_fee?: number | null (min 0)
  overdraft_limit?: number | null (min 0)
}
```

### `updateBankAccountSchema`
Same fields, all optional. Additionally:
- `status?: enum ['ACTIVE', 'CLOSED']`
- `closed_at?: string | null`

### `createTransactionSchema`
```typescript
{
  account_id: string (UUID)
  signed_amount: number (coerced, non-zero)
  kind?: enum ['NORMAL', 'TRANSFER', 'ADJUSTMENT', 'FEE', 'INTEREST'] (default: NORMAL)
  status?: enum ['PENDING', 'POSTED', 'VOID'] (default: POSTED)
  category_id?: string | null (UUID or empty string → null)
  description?: string | null (max 500)
  occurred_at: ISO datetime string or Date
  posted_at?: string | null
  source?: string | null (max 50, default: 'MANUAL')
}
```

### `createCreditCardSchema`
```typescript
{
  name: string (min 1, max 100)
  currency_code: string (length 3)
  institution_name?: string | null
  opened_at?: string | null (YYYY-MM-DD)
  issuer?: string | null (max 50) — 'VISA', 'MASTERCARD', 'AMEX'
  bank_name?: string | null
  last4?: string | null (length exactly 4)
  credit_limit?: number | null (min 0)
  management_fee?: number | null
  management_fee_period?: string | null — 'MONTHLY' or 'ANNUAL'
  interest_rate_annual?: number | null (0-100)
  interest_rate_monthly?: number | null (0-100)
  billing_cycle_day?: int | null (1-31)
  payment_due_day?: int | null (1-31)
  last_statement_date?: string | null (YYYY-MM-DD)
}
```

---

## 11. UI Pages & Components

### Navigation (Sidebar)
File: `components/shared/sidebar-nav.tsx` — Client Component.

Routes:
- `/dashboard` — Inicio
- `/accounts` — Cuentas
- `/credits` — Tarjetas de Crédito
- `/transactions` — Transacciones
- `/categories` — Categorías
- `/currencies` — Divisas

Shows user email initials avatar at bottom, logout button (calls `signOut` Server Action via form).

### Dashboard (`/dashboard`)
Fully streamed with `<Suspense>` + skeleton fallbacks.

**SummaryCards**: Shows 4 cards:
1. Balance Total (all accounts in preferred currency)
2. Balance Neto (current month income - expense)
3. Ingresos del Mes (current month, preferred currency)
4. Gastos del Mes (current month, preferred currency)

**AccountsStrip**: Horizontal scroll of active bank account cards, each linking to `/accounts/{id}`. Empty state with "Agrega tu primera cuenta" CTA.

**RecentTransactions**: Last N transactions.

**RefreshBalancesButton**: Client component button to trigger balance refresh.

### Bank Accounts (`/accounts`)
- Page loads all bank accounts, renders `<AccountsView accounts={...} />`
- `AccountsView` (Client): Grid of `AccountCard` components (ACTIVE + CLOSED sections). "Nueva Cuenta" button opens `CreateAccountDialog`.
- `AccountCard`: Shows name, bank, kind badge (Ahorro/Corriente), balance, masked number, interest rate, opening date, edit button.
- `CreateAccountDialog`: Modal with React Hook Form. Handles both create and update. Fields match `createBankAccountSchema` / `updateBankAccountSchema`.
- Stats bar shows: active count, total USD balance, total COP balance.

### Credit Cards (`/credits`)
- Page loads all credit cards, renders `<CreditsView cards={...} />`
- `CreditsView` (Client): List of `CardRow` components.
- `CreditCardChip`: Physical credit card visual (standard aspect ratio 1.586:1). Shows issuer gradient (VISA=dark blue, MC=dark red, AMEX=dark teal). Shows chip SVG, NFC icon, masked number, available balance, limit. A colored top stripe shows utilization % (green < 30%, amber < 70%, red ≥ 70%).
- Clicking card expands `CardDetailPanel` which shows transaction list + card details.
- `CreateCreditCardDialog`: Modal for creating/editing cards.

### Transactions (`/transactions`)
- Page fetches initial data (first page, current month), renders `<TransactionsView />`
- `TransactionsView` (Client): Full featured table with:
  - **FilterBar**: date range (start/end), category select, account select, clear filters button
  - **Table columns**: Description+Category, Account (hidden on mobile), Date+Time (hidden on mobile), Status+Kind (hidden on mobile), Amount (always visible)
  - **Historical rows**: 40% opacity + strikethrough + "Histórico" badge + tooltip explanation
  - **Pagination**: 20 per page with prev/next controls
  - **`useTransition`** for non-blocking filter/page changes
  - `CreateTransactionDialog`: Opens from "Nueva Transacción" button

### Categories (`/categories`)
- Displays all user categories (expense + income).
- "Crear Categorías por Defecto" button calls `getOrCreateDefaultCategories()`.
- `CreateCategoryDialog`: Form with name, type (income/expense), color picker, icon name.

### Currencies (`/currencies`)
- `CurrenciesView` (Client): Read-only display of configured currencies.
- Shows which currency is the "Moneda base" (preferred).
- Shows each currency's `exchange_rate_to_preferred`.
- "Actualizar Tasas de Cambio" button calls `refreshExchangeRates()` → shows success/error toast.
- Auto-update indicator shows cron is active (every 12h).
- Currencies are NOT editable by the user — the system manages them automatically.

---

## 12. Design System

### Color Tokens (Tailwind config)

```
// Neumorphism palette
neu-bg:        #0a0a0a  — page background
neu-surface:   #121212  — sidebar
neu-raised:    #161616  — raised elements, cards
neu-highlight: #1d1d1d  — highlights
neu-shadow:    #000000  — shadow color
neu-border:    #222222  — borders

// Semantic
luka-accent:        #D97757   — terracotta, CTAs, primary actions
luka-accent-hover:  #C66647
luka-accent-dim:    rgba(217,119,87,0.15)
luka-income:        #4ade80   — green for positive amounts
luka-expense:       #f87171   — red for negative amounts
luka-warning:       #fbbf24   — amber for ADJUSTMENT, INTEREST
luka-info:          #60a5fa   — blue for TRANSFER
luka-muted:         #888888
```

### CSS Custom Classes (global CSS)

```
neu-card         — neumorphic card: bg-neu-raised + border + rounded-neu + shadow-soft-out
neu-btn          — base button style
neu-btn-primary  — accent colored button (bg-luka-accent, text-white)
neu-btn-icon     — square icon button
neu-input        — neumorphic input: inset shadow
neu-nav-active   — active nav item style
neu-divider      — horizontal rule
```

### Box Shadows
```
shadow-soft-out     — raised element (6px 6px 14px #000, -4px -4px 10px #1d1d1d)
shadow-soft-in      — inset/pressed (inset 4px 4px 10px #000, inset -3px -3px 8px #1d1d1d)
shadow-soft-hover   — hovered lift
shadow-soft-accent  — accent glow for CTA
```

### Typography
- Font: Inter (system fallback)
- Sizes: xs(12), sm(14), base(16), lg(18), xl(20), 2xl(24)
- Weights used: 400, 500, 600, 700

### Component patterns
- All text on dark background uses `text-white/90`, `text-white/70`, `text-white/50`, `text-neu-muted`
- Amount labels: `tabular-nums tracking-tight` for financial values
- Section labels: `text-xs font-medium text-neu-muted uppercase tracking-widest`
- Badges: rounded-full, tiny text, colored borders, `text-[10px] font-semibold uppercase tracking-wider`

---

## 13. Financial Calculation Utilities (`lib/utils/currency.ts`)

All use `Decimal.js` for precision. Never use native JS float math for money.

```typescript
formatCurrency(amount, symbol, decimals?)
// → "$1,234.56" (hides trailing zeros: "$1,234" not "$1,234.00")

formatCOP(amount, decimals?)
// → "$4,200,000" (locale: es-CO)

convertCurrency(amount, fromRate, toRate)
// Direct rate-to-rate conversion: amount × fromRate / toRate

convertToBase(amount, fromCurrencyCode, toCurrencyCode, rateByCode: Map)
// General formula: amount × (toRate / fromRate)
// Uses rate map: { 'USD': 1, 'COP': 4200 }

convertToCOP(amount, exchangeRateToCOP)
// amount × exchangeRateToCOP, rounded to 0 decimals

addAmounts(...amounts)       // Decimal sum, 2dp
subtractAmounts(from, ...amounts) // Decimal subtract, 2dp
multiplyAmount(amount, multiplier) // Decimal multiply, 2dp
calculatePercentage(amount, pct)   // amount × pct / 100, 2dp
```

---

## 14. Supabase Client Setup

### `lib/supabase/server.ts`
```typescript
createClient()       // Server-side client for Server Actions and Server Components
                     // Uses @supabase/ssr, reads cookies via next/headers
createAdminClient()  // Service role client (bypasses RLS), used ONLY in cron jobs
```

### `lib/supabase/client.ts`
```typescript
createClient()       // Browser client for Client Components (singleton pattern)
```

---

## 15. Cron Job (`vercel.json`)

Configured to call `GET /api/cron/refresh-rates` every 12 hours.

The endpoint:
1. Validates `Authorization: Bearer <CRON_SECRET>` header.
2. Calls `refreshAllUsersExchangeRates()`.
3. Returns `{ success: true, updated: N }` or error JSON.

---

## 16. Known Quirks / Important Notes

### Categories table mismatch
The Prisma-generated `database.types.ts` for `categories` only shows `id, name, parent_id, user_id, created_at, updated_at`. However, the actual Supabase table also has `type`, `color`, `icon`, and `is_system_category` columns (added via migration). All category operations use the Supabase client directly (NOT Prisma) to access these extra columns.

### Currencies table not in generated types
The `currencies` table exists in Supabase but was created outside the Prisma schema. All queries use `(supabase as any).from('currencies')` to bypass TypeScript type checking.

### Database types contain unrelated enums
The `database.types.ts` file contains enums from another project (`HistoryStatus`, `NotificationStatus`, `PaymentMethod`, `Role`, `RoomStatus`, `ServiceType`). These should be ignored — they are artifacts of a shared Supabase database.

### Balance is computed, not stored
Never attempt to read or write a `balance` column on the `accounts` table — it doesn't exist. Balance is always computed via `accountRepository.calculateBalance()`.

### signed_amount convention
- For ASSET accounts (bank): positive = credit (money in), negative = debit (money out)
- For LIABILITY accounts (credit cards): positive = charge (spending increases debt), negative = payment (reduces debt)
- ADJUSTMENT transactions: `signed_amount` IS the new balance checkpoint

### `currency_code` vs `currency_id`
The `accounts` table stores `currency_code` (string like `'USD'`, `'COP'`), NOT a foreign key to the `currencies` table. The `currencies` table is a separate per-user configuration layer for exchange rates.

---

## 17. Development Workflow

1. **New feature**: Create Zod schema → Server Action → Repository method → Page + components.
2. **Database changes**: Write and apply SQL migration via Supabase MCP, then regenerate TypeScript types.
3. **Always use Decimal.js** for any money calculation.
4. **Every Server Action** must authenticate first (`getCurrentUser()`) and return `ActionResult<T>`.
5. **Error handling**: Zod errors returned as `{ success: false, error: string, details: ZodIssue[] }`. DB errors caught and returned as `{ success: false, error: string }`.
6. **Route structure rule**: Pages call Server Actions → Server Actions call Repositories. Pages never call repositories directly.

---

## 18. Pages Not Yet Implemented (Planned)

The following pages are in the navigation roadmap but not yet built:
- Budgets (`/budgets`)
- Investments (`/investments`)
- Loans (`/loans`)
- Reports (`/reports`)

These are Phase 2/3 items per the project roadmap.
