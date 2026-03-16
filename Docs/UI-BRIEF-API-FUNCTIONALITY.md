# Luka - UI Brief: APIs & Functionality

Brief for UI/design AI. **No design specs** — only endpoints and functionality.

---

## 1. Auth (`src/lib/actions/auth.ts`)

| Action | Params | Returns | Notes |
|--------|--------|---------|-------|
| `signUp` | `{ email, password }` | `{ success, data?: { email }, error? }` | On success: shows confirmation message |
| `signIn` | `{ email, password }` | `{ success, error? }` | On success: redirects to `/dashboard` |
| `signOut` | - | `{ success, error? }` | On success: redirects to `/login` |
| `getCurrentUser` | - | `User \| null` | Returns current session user |

---

## 2. Bank Accounts (`src/lib/actions/accounts.ts`)

| Action | Params | Returns |
|--------|--------|---------|
| `getBankAccounts` | - | `{ success, data?: Account[], error? }` |
| `getBankAccount` | `id: string` | `{ success, data?: Account, error? }` |
| `createBankAccount` | `data` | `{ success, data?: Account, error? }` |
| `updateBankAccount` | `id, data` | `{ success, data?: Account, error? }` |
| `deleteBankAccount` | `id` | `{ success, error? }` |

**CreateBankAccount payload:**
- `name` (required)
- `currency_code` (USD | COP)
- `kind` (SAVINGS | CHECKING)
- `institution_name`, `opened_at` (optional)
- `bank_name`, `masked_number`, `interest_rate_annual`, `monthly_fee`, `overdraft_limit` (optional)

---

## 3. Categories (`src/lib/actions/categories.ts`)

| Action | Params | Returns |
|--------|--------|---------|
| `getCategories` | - | `{ success, data?: Category[], error? }` |
| `getOrCreateDefaultCategories` | - | `{ success, data?: Category[], error? }` | Creates defaults if none exist |

**Category fields:** `id`, `name`, `type` (expense | income), `color`, `icon`, `is_system_category`, `user_id`

---

## 4. Credit Cards (`src/lib/actions/credits.ts`)

| Action | Params | Returns |
|--------|--------|---------|
| `getCreditCards` | - | `{ success, data?: CreditCard[], error? }` |
| `createCreditCard` | `data` | `{ success, data?: CreditCard, error? }` |
| `updateCreditCard` | `id, data` | `{ success, data?: CreditCard, error? }` |
| `deleteCreditCard` | `id` | `{ success, error? }` |
| `getCreditCardTransactions` | `creditCardId, startDate?, endDate?` | `{ success, data?: Transaction[], error? }` |

**CreateCreditCard payload:**
- `name` (required)
- `currency_code` (3 chars, e.g. USD, COP)
- Optional: `institution_name`, `opened_at`, `issuer`, `bank_name`, `last4`, `credit_limit`, `management_fee`, `management_fee_period`, `interest_rate_annual`, `interest_rate_monthly`, `billing_cycle_day`, `payment_due_day`, `last_statement_date`

---

## 5. Currencies (`src/lib/actions/currencies.ts`)

| Action | Params | Returns |
|--------|--------|---------|
| `getCurrencies` | - | `{ success, data?: Currency[], error? }` |
| `getOrCreateDefaultCurrencies` | - | `{ success, data?: Currency[], error? }` | Creates USD + COP if none exist |
| `refreshExchangeRates` | - | `{ success, error? }` |

**Currency fields:** `id`, `code`, `name`, `symbol`, `exchange_rate_to_preferred`, `user_id`

---

## 6. Transactions (`src/lib/actions/transactions.ts`)

| Action | Params | Returns |
|--------|--------|---------|
| `getTransactions` | `filters?` | `{ success, data?: { data, count, totalPages }, error? }` |
| `getTransaction` | `id` | `{ success, data?: Transaction, error? }` |
| `createTransaction` | `data` | `{ success, data?: Transaction, error? }` |
| `updateTransaction` | `id, data` | `{ success, data?: Transaction, error? }` |
| `deleteTransaction` | `id` | `{ success, error? }` |
| `getTransactionsSummary` | `startDate, endDate` | `{ success, data?: { totalIncome, totalExpense, balance }, error? }` |
| `getAccountTransactions` | `accountId, startDate?, endDate?` | `{ success, data?: Transaction[], error? }` |

**GetTransactions filters:** `startDate`, `endDate`, `categoryId`, `accountId`, `kind`, `status`, `page`, `limit`

**CreateTransaction payload:**
- `account_id` (required)
- `signed_amount` (required, positive = income, negative = expense)
- `kind` (NORMAL | TRANSFER | ADJUSTMENT | FEE | INTEREST), default NORMAL
- `status` (PENDING | POSTED | VOID), default POSTED
- `category_id`, `description` (optional)
- `occurred_at` (ISO datetime, required)
- `posted_at`, `source` (optional)

---

## 7. Response pattern

All actions return:
```ts
{ success: true, data?: T } | { success: false, error: string, details?: unknown }
```

---

## 8. Screens / flows

- **Auth:** Login, Signup, Logout
- **Dashboard:** Balance summary, accounts overview, recent transactions, summary (income/expense) by date range
- **Accounts:** List bank accounts, create/edit/delete, view one account
- **Credit cards:** List cards, create/edit/delete, view transactions by card
- **Transactions:** List (with filters), create, edit, delete, view one
- **Categories:** List categories (auto-created via `getOrCreateDefaultCategories`)
- **Currencies:** List currencies, refresh exchange rates (auto-created via `getOrCreateDefaultCurrencies`)

---

## 9. Tech stack

- Next.js 14+ (App Router)
- Server Actions (all above)
- shadcn/ui components
- React Hook Form + Zod
- Supabase Auth
