# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Luka** is a Personal Finance Control PWA built with Next.js 14+, Supabase, and shadcn/ui. The application enables users to manage income, expenses, accounts, credit cards, investments, loans, budgets, and generate financial reports with multi-currency support.

**Name Origin**: "Luka" is Latin American slang for money.

**Design Aesthetic**: Inspired by Anthropic.com - minimalist, spacious, elegant with warm color palette (cream background #F5F3EE, terracotta accent #D97757).

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), shadcn/ui, Tailwind CSS, Recharts, TypeScript (strict mode)
- **Backend**: Next.js Server Actions, Supabase (PostgreSQL), Supabase Auth, Supabase Storage
- **Testing**: Jest + React Testing Library (TDD approach)
- **PWA**: next-pwa with offline support
- **Database**: Managed via Supabase MCP

## Development Methodology

### Test-Driven Development (TDD)

This project follows strict TDD:
1. **Write Test First**: Before implementing any feature
2. **Red Phase**: Run test and watch it fail
3. **Green Phase**: Write minimal code to make test pass
4. **Refactor Phase**: Improve code while keeping tests green
5. **Repeat**: For each feature/functionality

### Multi-Agent System

The project uses specialized Claude Code agents:

- **luka-project-orchestrator**: Plans, coordinates, and supervises development across agents
- **nextjs-backend-architect**: Implements Server Actions, business logic, repositories, Supabase integration
- **luka-ui-designer**: Builds UI components following the Anthropic-inspired design system
- **luka-qa-tester**: Reviews code, validates security, tests calculations, ensures data integrity

**When to use agents**: Use the Task tool to invoke agents for complex features. The orchestrator coordinates multi-step work, backend architect handles server actions and data layer, UI designer builds components, and QA validates everything before merge.

### Feature-Based Architecture

Development is organized by features, not technical layers:

```
/app/(features)/
  /accounts/      # Account management pages
  /transactions/  # Transaction pages
  /budgets/       # Budget pages
  /loans/         # Loan tracking pages
  /investments/   # Investment pages
  /reports/       # Analytics and reports
```

Each feature contains its UI components, Server Actions, tests, types, and validation schemas in proximity.

## Project Structure

```
luka/
├── app/
│   ├── (auth)/              # Authentication pages (login, signup)
│   ├── (dashboard)/         # Main app layout with features
│   │   ├── dashboard/       # Home dashboard
│   │   ├── accounts/        # Account management
│   │   ├── transactions/    # Transaction management
│   │   ├── budgets/         # Budget planning
│   │   ├── loans/           # Loan tracking
│   │   ├── investments/     # Investment tracking
│   │   └── reports/         # Analytics and reports
│   └── api/                 # API routes (if needed)
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── features/            # Feature-specific components
│   └── shared/              # Shared components
├── lib/
│   ├── actions/             # Server Actions by feature
│   ├── services/            # Business Logic Layer
│   ├── repositories/        # Data Access Layer (Supabase queries)
│   ├── validations/         # Zod validation schemas
│   ├── types/               # TypeScript types (includes Supabase generated types)
│   ├── utils/               # Utility functions (currency, date, calculations)
│   ├── constants/           # App constants (currencies, categories)
│   ├── hooks/               # Custom React hooks
│   └── supabase/            # Supabase client configuration
├── tests/
│   ├── unit/                # Unit tests for utils and business logic
│   ├── integration/         # Integration tests for Server Actions
│   └── e2e/                 # End-to-end tests
└── supabase/
    └── migrations/          # Database migrations (managed via Supabase MCP)
```

## Database Schema

All tables use Row Level Security (RLS) - users can only access their own data.

**Main Tables**:
- `users` - User accounts (linked to Supabase Auth)
- `currencies` - Multi-currency support with exchange rates
- `categories` - Income/Expense categories (with parent/child relationships)
- `bank_accounts` - Savings/Checking accounts
- `credit_cards` - Credit cards with interest calculations
- `investments` - Flexible investment tracking with custom types
- `investment_movements` - Deposits/withdrawals to investments
- `investment_documents` - Document attachments for investments
- `transactions` - All financial transactions
- `recurring_transactions` - Templates for recurring transactions
- `budgets` - Monthly budgets by category
- `loans_given` / `loans_received` - Loan tracking
- `loan_given_payments` / `loan_received_payments` - Loan payment history
- `notifications` - System notifications
- `user_preferences` - User settings and preferences

**Key Schema Patterns**:
- All monetary amounts use `decimal(18,2)`
- All tables have `user_id` foreign key with RLS policies
- Timestamps: `created_at`, `updated_at` (auto-managed)
- UUID primary keys with `gen_random_uuid()`

See `db-structure.md` for complete schema.

## Design System

### Color Palette

```typescript
// Backgrounds
background: '#F5F3EE'      // Cream warm
surface: '#FFFFFF'         // White for cards

// Text
textPrimary: '#1A1A1A'     // Deep black
textSecondary: '#6B6B6B'   // Gray

// Accent
accent: '#D97757'          // Terracotta (CTAs)
accentHover: '#C66647'     // Darker terracotta

// Semantic
success: '#4CAF50'         // Green (income)
warning: '#F59E0B'         // Amber
error: '#DC2626'           // Red (expense/errors)
info: '#3B82F6'            // Blue

// Neutrals
border: '#E5E3DE'          // Very soft neutral
disabled: '#9CA3AF'        // Gray for disabled
```

### Typography

- **Font Family**: Inter or system fonts
- **Weights**: Regular (400), Medium (500), Semibold (600), Bold (700)
- **Scale**: xs(12px), sm(14px), base(16px), lg(18px), xl(20px), 2xl(24px), 3xl(30px), 4xl(36px), 5xl(48px)

### Spacing System

Base unit: 4px. Use: 0, 1(4px), 2(8px), 3(12px), 4(16px), 6(24px), 8(32px), 12(48px), 16(64px), 20(80px), 24(96px)

### Key Principles

- **Generous white space** - Don't be afraid of empty space
- **Subtle shadows**: `0 1px 3px rgba(0,0,0,0.08)`
- **Rounded corners**: 8-12px (use Tailwind's `rounded-lg`)
- **Smooth transitions**: All hover/focus states should transition smoothly
- **Mobile-first**: Design for mobile, enhance for desktop

## Architecture Layers

### 1. Server Actions Layer (`lib/actions/`)

Entry point for all data mutations and queries from client components. Always authenticated and validated.

```typescript
'use server'

export async function createBankAccount(data: unknown) {
  // 1. Authenticate
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // 2. Validate with Zod
  const validated = accountSchema.parse(data);

  // 3. Call service layer
  const result = await accountService.create({ ...validated, user_id: user.id });

  // 4. Revalidate
  revalidatePath('/accounts');

  return { success: true, data: result };
}
```

### 2. Service Layer (`lib/services/`)

Contains business logic and orchestrates repository calls. Never called directly from UI.

```typescript
export const accountService = {
  async create(data: AccountCreateInput) {
    // Business logic
    // Multi-step operations
    // Calculations
    return accountRepository.create(data);
  }
};
```

### 3. Repository Layer (`lib/repositories/`)

Direct Supabase queries. No business logic, just data access.

```typescript
export const accountRepository = {
  async create(data: AccountData) {
    const { data: account, error } = await supabase
      .from('bank_accounts')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return account;
  }
};
```

## Critical Implementation Rules

### Financial Precision

**ALWAYS use Decimal.js for calculations** - never use native JavaScript numbers for money:

```typescript
import Decimal from 'decimal.js';

// ❌ BAD: Floating point errors
const bad = 0.1 + 0.2; // 0.30000000000000004

// ✅ GOOD: Precise decimal math
const good = new Decimal(0.1).plus(0.2).toNumber(); // 0.3
```

All monetary amounts are stored as `decimal(18,2)` in database and must be rounded to 2 decimal places for display.

### Security

**Every Server Action must**:
1. Authenticate the user first
2. Validate input with Zod schema
3. Add `user_id` to all queries/mutations
4. Never trust client data
5. Use RLS policies to prevent unauthorized access

```typescript
// RLS Policy Pattern (in migration)
CREATE POLICY "Users can view own accounts"
ON bank_accounts
FOR SELECT
USING (auth.uid() = user_id);
```

### Error Handling

All Server Actions return a structured result:

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };
```

### Database Operations

- **Transactions**: Use Supabase RPC for multi-step operations requiring atomicity
- **Pagination**: Always paginate lists (default 20 items per page)
- **N+1 Queries**: Use Supabase joins to fetch related data in one query
- **Caching**: Cache expensive queries (dashboard summaries) with revalidation

### Testing

**Test Coverage Requirements**:
- Unit tests: Business logic, calculations, utilities (>80% coverage)
- Integration tests: All Server Actions with mocked Supabase
- Component tests: UI behavior, form validation, user interactions
- E2E tests: Critical flows (authentication, transaction creation)

**TDD Pattern**:
```typescript
// 1. Write test first
describe('calculateInterest', () => {
  it('should calculate monthly interest correctly', () => {
    const result = calculateInterest(1000, 12); // $1000 at 12% annual
    expect(result).toBe(10); // 1% monthly = $10
  });
});

// 2. Implement function to pass test
// 3. Refactor while keeping test green
```

## Common Development Tasks

### Working with Supabase

The project uses Supabase MCP tools:

- `mcp__supabase__list_tables`: View all database tables
- `mcp__supabase__apply_migration`: Apply database migrations
- `mcp__supabase__execute_sql`: Run SQL queries
- `mcp__supabase__generate_typescript_types`: Generate types from database schema
- `mcp__supabase__get_advisors`: Check for security/performance issues

**Always regenerate TypeScript types after schema changes**:
```typescript
// After migration, regenerate types
mcp__supabase__generate_typescript_types
```

### Creating a New Feature

1. **Plan**: Use `luka-project-orchestrator` agent to break down the feature
2. **Backend First** (TDD):
   - Write Zod validation schema
   - Write Server Action tests
   - Implement Server Action, Service, Repository layers
   - Run tests until green
3. **Database**: Apply migrations via Supabase MCP, regenerate types
4. **UI**: Use `luka-ui-designer` agent to build components following design system
5. **QA**: Use `luka-qa-tester` agent to validate before merge

### Validation Patterns

All user input must be validated with Zod:

```typescript
// lib/validations/account-schema.ts
import { z } from 'zod';

export const createAccountSchema = z.object({
  name: z.string().min(1).max(100),
  bank_name: z.string().max(100).optional(),
  account_type: z.enum(['savings', 'checking']),
  currency_id: z.string().uuid(),
  initial_balance: z.number().min(0),
});
```

### Multi-Currency Handling

All accounts and transactions support multiple currencies. Dashboard shows totals in user's preferred currency using configured exchange rates:

```typescript
// Convert amount from one currency to another
function convertCurrency(
  amount: number,
  fromRate: number,
  toRate: number
): number {
  return new Decimal(amount)
    .times(fromRate)
    .dividedBy(toRate)
    .toDecimalPlaces(2)
    .toNumber();
}
```

## Development Phases

The project follows a phased roadmap:

**Phase 1 (MVP)**: Authentication, Dashboard, Bank Accounts, Transactions, Categories, Multi-currency
**Phase 2**: Recurring Transactions, Credit Cards, Budgets, Loans
**Phase 3**: Investments, Reports & Analytics, PWA & Notifications, Polish

See `context.md` and `requirements.md` for detailed phase breakdown and acceptance criteria.

## Important Files

- `context.md` - Complete project context and architecture
- `requirements.md` - Functional requirements with acceptance criteria
- `db-structure.md` - Database schema in DBML format
- `ui-ux.md` - Design specifications and visual guidelines
- `.claude/agents/` - Specialized agent prompts for multi-agent coordination

## Key Principles

1. **Quality over Speed**: Build it right the first time with TDD
2. **Security First**: Authenticate everything, validate all inputs, use RLS
3. **Precision Matters**: Use Decimal.js for all financial calculations
4. **Test Everything**: Write tests before implementation
5. **Feature-Based**: Keep related code together by feature
6. **Design Consistency**: Follow the Anthropic-inspired aesthetic strictly
7. **Mobile First**: Design for mobile, enhance for desktop
8. **Document Decisions**: Explain why, not just what

## Resources

- **Full Context**: See `context.md` for comprehensive overview
- **Requirements**: See `requirements.md` for all features and acceptance criteria
- **Database Schema**: See `db-structure.md` for complete schema
- **Design Specs**: See `ui-ux.md` for visual design guidelines
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **shadcn/ui**: https://ui.shadcn.com
