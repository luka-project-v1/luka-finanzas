# Luka - Personal Finance Control Application

## Project Overview

**Luka** is a modern Personal Finance Control PWA (Progressive Web App) built with Next.js 14+, Supabase, and shadcn/ui. The application enables users to manage their income, expenses, accounts, credit cards, investments, loans, budgets, and generate financial reports with multi-currency support.

**Name Origin**: "Luka" is Latin American slang for money, making it memorable and friendly.

**Design Aesthetic**: Inspired by Anthropic.com - minimalist, spacious, elegant with warm color palette (cream background #F5F3EE, terracotta accent #D97757).

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS)
- **Styling**: Tailwind CSS with custom design tokens
- **Charts**: Recharts
- **Forms**: React Hook Form
- **Validation**: Zod
- **Language**: TypeScript (strict mode)

### Backend
- **Framework**: Next.js Server Actions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for receipts/documents)
- **ORM**: Supabase Client

### DevOps & Tools
- **Version Control**: Git
- **Package Manager**: npm/pnpm
- **Linting**: ESLint
- **Formatting**: Prettier
- **Testing**: Jest + React Testing Library (TDD approach)
- **MCP**: Supabase MCP for database management

### PWA
- **Service Worker**: next-pwa
- **Offline Support**: Progressive enhancement
- **Push Notifications**: Web Push API

---

## Development Approach

### Test-Driven Development (TDD)

This project follows strict TDD methodology:

1. **Write Test First**: Before implementing any feature, write the test
2. **Red Phase**: Run test and watch it fail
3. **Green Phase**: Write minimal code to make test pass
4. **Refactor Phase**: Improve code while keeping tests green
5. **Repeat**: For each new feature/functionality

**Testing Layers**:
- **Unit Tests**: Business logic, utilities, calculations
- **Integration Tests**: Server Actions, API routes
- **Component Tests**: UI components behavior
- **E2E Tests**: Critical user flows (optional for MVP)

### Multi-Agent Development System

The project uses specialized sub-agents coordinated by a main orchestrator:

#### 0. **Project Maestro** (Orchestrator)
- Plans and coordinates all development
- Assigns tasks to specialized agents
- Tracks progress and manages blockers
- Ensures quality and adherence to standards

#### 1. **Backend Architect** (Next.js Expert)
- Implements Server Actions
- Designs business logic
- Creates data layer (repositories)
- Manages Supabase integration
- Ensures security and performance

#### 2. **Design Architect** (UI/UX Developer)
- Implements design system
- Builds UI components with shadcn/ui
- Creates responsive layouts
- Implements animations and micro-interactions
- Ensures accessibility (WCAG AA)

#### 3. **QA Guardian** (QA Tester)
- Reviews all code before merge
- Validates business logic and calculations
- Tests security and performance
- Ensures accessibility compliance
- Validates data integrity

### Feature-Based Development

Development is organized by features, not by technical layers:

```
/app/(features)/
  /accounts/
  /transactions/
  /budgets/
  /loans/
  /investments/
  /reports/
```

Each feature contains:
- UI components
- Server Actions
- Tests
- Types
- Validation schemas

---

## Project Structure

```
luka/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── accounts/
│   │   ├── transactions/
│   │   ├── budgets/
│   │   ├── loans/
│   │   ├── investments/
│   │   └── reports/
│   ├── api/                    # API routes if needed
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── features/               # Feature-specific components
│   │   ├── accounts/
│   │   ├── transactions/
│   │   └── ...
│   └── shared/                 # Shared components
├── lib/
│   ├── actions/                # Server Actions
│   │   ├── auth.ts
│   │   ├── accounts.ts
│   │   ├── transactions.ts
│   │   └── ...
│   ├── services/               # Business Logic Layer
│   │   ├── account-service.ts
│   │   ├── transaction-service.ts
│   │   └── ...
│   ├── repositories/           # Data Access Layer
│   │   ├── account-repository.ts
│   │   ├── transaction-repository.ts
│   │   └── ...
│   ├── validations/            # Zod Schemas
│   │   ├── account-schema.ts
│   │   ├── transaction-schema.ts
│   │   └── ...
│   ├── types/                  # TypeScript Types
│   │   ├── database.types.ts   # Supabase generated types
│   │   ├── account.types.ts
│   │   └── ...
│   ├── utils/                  # Utility functions
│   │   ├── currency.ts
│   │   ├── date.ts
│   │   ├── calculations.ts
│   │   └── ...
│   ├── constants/              # Constants
│   │   ├── currencies.ts
│   │   ├── categories.ts
│   │   └── ...
│   ├── hooks/                  # Custom React hooks
│   ├── supabase/               # Supabase client
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   └── design-tokens.ts        # Design system tokens
├── public/
│   ├── icons/
│   ├── images/
│   └── manifest.json           # PWA manifest
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── supabase/
│   ├── migrations/             # Database migrations
│   └── seed.sql               # Seed data
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Database Schema

See `database-schema.dbml` for complete schema.

### Main Tables:
1. **users** - User accounts
2. **currencies** - Multi-currency support
3. **categories** - Income/Expense categories
4. **bank_accounts** - Savings/Checking accounts
5. **credit_cards** - Credit cards with interest calculations
6. **investments** - Flexible investment tracking
7. **investment_movements** - Investment deposits/withdrawals
8. **investment_documents** - Investment document attachments
9. **transactions** - All financial transactions
10. **recurring_transactions** - Recurring transaction templates
11. **budgets** - Monthly budgets by category
12. **loans_given** - Money lent to others
13. **loan_given_payments** - Loan payments received
14. **loans_received** - Money borrowed from others
15. **loan_received_payments** - Loan payments made
16. **notifications** - System notifications
17. **user_preferences** - User settings

### Security:
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Service role key only for admin operations

---

## Design System

### Color Palette

```typescript
// Primary Colors
const colors = {
  // Backgrounds
  background: '#F5F3EE',      // Cream warm
  surface: '#FFFFFF',         // White for cards
  
  // Text
  textPrimary: '#1A1A1A',     // Deep black
  textSecondary: '#6B6B6B',   // Gray
  
  // Accent
  accent: '#D97757',          // Terracotta (CTAs)
  accentHover: '#C66647',     // Darker terracotta
  
  // Semantic
  success: '#4CAF50',         // Green (income)
  warning: '#F59E0B',         // Amber (warnings)
  error: '#DC2626',           // Red (expense/errors)
  info: '#3B82F6',            // Blue (info)
  
  // Neutrals
  border: '#E5E3DE',          // Very soft neutral
  disabled: '#9CA3AF',        // Gray for disabled
}
```

### Typography

```typescript
// Font Family: Inter or system fonts
const typography = {
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  
  // Scale
  sizes: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
  },
  
  // Weights
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  }
}
```

### Spacing System

```typescript
// Base unit: 4px
const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
}
```

### Border Radius

```typescript
const radius = {
  sm: '0.25rem',    // 4px
  DEFAULT: '0.5rem', // 8px
  md: '0.75rem',    // 12px
  lg: '1rem',       // 16px
  xl: '1.5rem',     // 24px
  full: '9999px',   // Pills
}
```

### Shadows

```typescript
const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
}
```

---

## Feature Requirements

See `requerimientos-sistema-financiero.md` for complete requirements.

### MVP Features (Phase 1-3):

1. **Authentication** (Week 2)
   - Sign up / Sign in / Sign out
   - Password recovery
   - Email verification
   - Onboarding wizard

2. **Dashboard & Bank Accounts** (Week 3-4)
   - Dashboard summary
   - Total balance in preferred currency
   - Account management (CRUD)
   - Multi-currency support
   - Currency conversion

3. **Transactions** (Week 5-6)
   - Transaction management (CRUD)
   - Categories system
   - Mark as paid/pending
   - Receipt upload
   - Filters and search
   - Pagination

### Phase 2 Features (Week 7-10):

4. **Recurring Transactions** (Week 7)
   - Custom frequency (daily, weekly, monthly, etc.)
   - Automatic generation
   - Pause/Resume
   - Edit series vs instance

5. **Credit Cards** (Week 8)
   - Card management
   - Interest calculations
   - Maintenance fee tracking
   - Payment due alerts
   - Available credit display

6. **Budgets** (Week 9)
   - Monthly budgets by category
   - Progress tracking
   - 80% alerts
   - Month-to-month comparison
   - Historical suggestions

7. **Loans** (Week 10)
   - Loans given (money lent)
   - Loans received (money borrowed)
   - Partial payments tracking
   - Interest calculations
   - Due date alerts

### Phase 3 Features (Week 11-15):

8. **Investments** (Week 11)
   - Flexible investment types (CDT, stocks, crypto, etc.)
   - Movement tracking (deposits/withdrawals)
   - Document attachments
   - Custom tags
   - Balance calculations

9. **Reports & Analytics** (Week 12)
   - Income vs Expense reports
   - Category breakdown charts
   - Monthly trends
   - Period comparisons
   - Export to CSV/PDF

10. **PWA & Notifications** (Week 13)
    - Service worker
    - Offline functionality
    - Data sync
    - Push notifications
    - Install prompt

11. **Polish & Optimization** (Week 14-15)
    - Performance optimization
    - Accessibility audit
    - Security hardening
    - UI polish
    - Bug fixes

---

## Development Workflow

### Starting a New Feature

1. **Project Maestro assigns task**:
   ```markdown
   ## Feature: Bank Account Management
   
   **Assigned to**: Backend Architect → Design Architect → QA Guardian
   
   **Priority**: CRITICAL
   **Estimation**: 3 days
   
   **Acceptance Criteria**:
   - [ ] User can create bank account
   - [ ] User can edit bank account
   - [ ] User can delete bank account
   - [ ] User can view list of accounts
   - [ ] Multi-currency works correctly
   - [ ] All tests pass
   ```

2. **Backend Architect starts** (TDD):
   ```typescript
   // 1. Write test first
   describe('createBankAccount', () => {
     it('should create a bank account successfully', async () => {
       const result = await createBankAccount({
         name: 'Test Account',
         bank_name: 'Test Bank',
         account_type: 'savings',
         currency_id: 'usd-id',
         initial_balance: 1000
       });
       
       expect(result.success).toBe(true);
       expect(result.data).toHaveProperty('id');
     });
   });
   
   // 2. Implement Server Action
   // 3. Make test pass
   // 4. Refactor
   ```

3. **Design Architect implements UI**:
   ```typescript
   // 1. Write component test
   describe('AccountForm', () => {
     it('should submit form with valid data', async () => {
       // Test implementation
     });
   });
   
   // 2. Implement component
   // 3. Make test pass
   // 4. Polish UI
   ```

4. **QA Guardian reviews**:
   - Run all tests
   - Manual testing
   - Security review
   - Performance check
   - Accessibility validation
   - Code review

5. **Merge to main** (if approved)

### Commit Convention

```
type(scope): subject

body (optional)

footer (optional)
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, styling
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

**Examples**:
```
feat(accounts): add bank account creation

Implements server action and UI for creating bank accounts with multi-currency support.

Closes #12
```

---

## Testing Strategy

### Unit Tests

Test business logic in isolation:

```typescript
// lib/utils/calculations.test.ts
describe('calculateInterest', () => {
  it('should calculate monthly interest correctly', () => {
    const principal = 1000;
    const annualRate = 12; // 12% annual
    const result = calculateInterest(principal, annualRate);
    expect(result).toBe(10); // 1% monthly
  });
  
  it('should handle zero principal', () => {
    expect(calculateInterest(0, 12)).toBe(0);
  });
  
  it('should handle zero rate', () => {
    expect(calculateInterest(1000, 0)).toBe(0);
  });
});
```

### Integration Tests

Test Server Actions with mocked Supabase:

```typescript
// lib/actions/accounts.test.ts
describe('createBankAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should create account and return success', async () => {
    // Mock Supabase
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: '123', name: 'Test' },
        error: null
      })
    };
    
    const result = await createBankAccount(validData);
    
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('id');
  });
  
  it('should return error on validation failure', async () => {
    const result = await createBankAccount(invalidData);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### Component Tests

Test UI components behavior:

```typescript
// components/features/accounts/account-form.test.tsx
describe('AccountForm', () => {
  it('should render all fields', () => {
    render(<AccountForm />);
    
    expect(screen.getByLabelText(/account name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bank name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/initial balance/i)).toBeInTheDocument();
  });
  
  it('should show validation errors', async () => {
    render(<AccountForm />);
    
    const submitButton = screen.getByRole('button', { name: /create/i });
    await userEvent.click(submitButton);
    
    expect(screen.getByText(/account name is required/i)).toBeInTheDocument();
  });
  
  it('should submit form successfully', async () => {
    const onSubmit = jest.fn();
    render(<AccountForm onSubmit={onSubmit} />);
    
    await userEvent.type(screen.getByLabelText(/account name/i), 'Test Account');
    await userEvent.type(screen.getByLabelText(/initial balance/i), '1000');
    await userEvent.click(screen.getByRole('button', { name: /create/i }));
    
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Test Account',
      initial_balance: 1000
    }));
  });
});
```

---

## Critical Business Logic

### Financial Calculations

All financial calculations must be precise:

```typescript
// Use decimal.js for precision
import Decimal from 'decimal.js';

// Bad: floating point errors
const bad = 0.1 + 0.2; // 0.30000000000000004

// Good: precise decimal math
const good = new Decimal(0.1).plus(0.2).toNumber(); // 0.3
```

### Currency Conversion

```typescript
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  exchangeRate: number
): number {
  const decimal = new Decimal(amount);
  const rate = new Decimal(exchangeRate);
  return decimal.times(rate).toDecimalPlaces(2).toNumber();
}
```

### Interest Calculation

```typescript
export function calculateMonthlyInterest(
  principal: number,
  annualRate: number
): number {
  const principalDecimal = new Decimal(principal);
  const monthlyRate = new Decimal(annualRate).dividedBy(12).dividedBy(100);
  return principalDecimal.times(monthlyRate).toDecimalPlaces(2).toNumber();
}
```

### Balance Updates

Always use database transactions for balance updates:

```typescript
export async function updateAccountBalance(
  accountId: string,
  amount: number,
  type: 'income' | 'expense'
) {
  // Use Supabase transaction
  const { data, error } = await supabase.rpc('update_account_balance', {
    account_id: accountId,
    amount: amount,
    operation: type === 'income' ? 'add' : 'subtract'
  });
  
  if (error) throw error;
  return data;
}
```

---

## Security Best Practices

### Server Actions

```typescript
'use server'

import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';

export async function createBankAccount(data: unknown) {
  try {
    // 1. Always authenticate
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }
    
    // 2. Validate input
    const schema = z.object({
      name: z.string().min(1).max(100),
      bank_name: z.string().max(100).optional(),
      account_type: z.enum(['savings', 'checking']),
      currency_id: z.string().uuid(),
      initial_balance: z.number().min(0),
    });
    
    const validated = schema.parse(data);
    
    // 3. Add user_id
    const accountData = {
      ...validated,
      user_id: user.id
    };
    
    // 4. Execute operation
    const result = await accountRepository.create(accountData);
    
    // 5. Revalidate
    revalidatePath('/accounts');
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating account:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation error', details: error.errors };
    }
    
    return { success: false, error: 'Internal server error' };
  }
}
```

### Row Level Security (RLS)

All tables must have RLS enabled:

```sql
-- Enable RLS
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own accounts
CREATE POLICY "Users can view own accounts"
ON bank_accounts
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can only insert their own accounts
CREATE POLICY "Users can insert own accounts"
ON bank_accounts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own accounts
CREATE POLICY "Users can update own accounts"
ON bank_accounts
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can only delete their own accounts
CREATE POLICY "Users can delete own accounts"
ON bank_accounts
FOR DELETE
USING (auth.uid() = user_id);
```

---

## Performance Optimization

### Database Queries

```typescript
// Bad: N+1 query
const accounts = await getAccounts(userId);
for (const account of accounts) {
  const transactions = await getTransactions(account.id); // N queries!
}

// Good: Join or batch query
const accountsWithTransactions = await supabase
  .from('bank_accounts')
  .select('*, transactions(*)')
  .eq('user_id', userId);
```

### Pagination

```typescript
export async function getTransactions(
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  const offset = (page - 1) * limit;
  
  const { data, error, count } = await supabase
    .from('transactions')
    .select('*, category(*), account(*)', { count: 'exact' })
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) throw error;
  
  return {
    data,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  };
}
```

### Caching

```typescript
// Cache dashboard summary for 5 minutes
export async function getDashboardSummary(userId: string) {
  const cacheKey = `dashboard:${userId}`;
  
  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Fetch from database
  const summary = await fetchDashboardData(userId);
  
  // Cache result
  await redis.setex(cacheKey, 300, JSON.stringify(summary));
  
  return summary;
}
```

---

## Accessibility Guidelines

### Semantic HTML

```tsx
// Bad
<div onClick={handleClick}>Click me</div>

// Good
<button onClick={handleClick}>Click me</button>
```

### ARIA Labels

```tsx
<input
  type="text"
  id="account-name"
  aria-label="Account name"
  aria-required="true"
  aria-invalid={!!errors.name}
  aria-describedby={errors.name ? 'name-error' : undefined}
/>
{errors.name && (
  <p id="name-error" role="alert">
    {errors.name.message}
  </p>
)}
```

### Keyboard Navigation

```tsx
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleAction();
  }
};

<div
  role="button"
  tabIndex={0}
  onClick={handleAction}
  onKeyDown={handleKeyDown}
>
  Action
</div>
```

### Focus Management

```tsx
import { useRef, useEffect } from 'react';

function Modal({ isOpen }: { isOpen: boolean }) {
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Focus first focusable element
      const firstFocusable = modalRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();
    }
  }, [isOpen]);
  
  return <div ref={modalRef}>{/* modal content */}</div>;
}
```

---

## Error Handling

### Global Error Boundaries

```tsx
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <button
        onClick={reset}
        className="px-4 py-2 bg-accent text-white rounded-lg"
      >
        Try again
      </button>
    </div>
  );
}
```

### Server Action Error Handling

```typescript
export type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };

export async function safeAction<T>(
  action: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const data = await action();
    return { success: true, data };
  } catch (error) {
    console.error('Action error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation error',
        details: error.errors
      };
    }
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message
      };
    }
    
    return {
      success: false,
      error: 'Unknown error occurred'
    };
  }
}
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values. See the table below for where to get each token.

| Variable | Source | Required |
|----------|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon public | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role (keep secret!) | Cron, seed |
| `CRON_SECRET` | Generate with `openssl rand -hex 24` | Production (Vercel cron) |
| `NEXT_PUBLIC_APP_URL` | Your app URL (e.g. `http://localhost:3000`) | Yes |
| `NEXT_PUBLIC_APP_NAME` | App name | Yes |
| `DATABASE_URL` / `DIRECT_URL` | Supabase → Settings → Database → Connection string | Prisma migrations |

**Token locations:**
- **Supabase API keys**: Supabase Dashboard → Your Project → Settings → API
- **CRON_SECRET**: Set in Vercel Dashboard → Project → Settings → Environment Variables. Vercel sends it in the `Authorization: Bearer` header when invoking cron jobs.

---

## Getting Started with Claude Code

When you run `/init` in Claude Code, provide this context:

```
I'm building Luka, a Personal Finance Control PWA. This is a feature-based development project using TDD with Next.js 14+, Supabase, and shadcn/ui.

Key points:
- Multi-agent system: Project Maestro coordinates Backend Architect, Design Architect, and QA Guardian
- TDD approach: Write tests first, then implement
- Feature-based structure: Each feature is self-contained
- Design: Anthropic.com aesthetic (minimalist, warm colors)
- Security: RLS on all tables, strict validation
- Performance: Optimized queries, pagination, caching
- Accessibility: WCAG AA compliance

Current phase: [Specify current phase from roadmap]
Current feature: [Specify feature being developed]

Please read the complete context from CONTEXT.md and let's start building!
```

---

## Important Reminders

### Financial Precision
- ✅ Use Decimal.js for all calculations
- ✅ Store amounts as decimal(18,2) in database
- ✅ Always round to 2 decimal places for display
- ❌ Never use JavaScript floating point arithmetic

### Security First
- ✅ Authenticate every server action
- ✅ Validate all inputs with Zod
- ✅ Use RLS policies on all tables
- ✅ Never trust client data
- ❌ Never expose sensitive data in responses

### Test Coverage
- ✅ Write tests before implementation
- ✅ Test happy path and edge cases
- ✅ Test error scenarios
- ✅ Maintain >80% code coverage
- ❌ Never skip testing for "quick fixes"

### Code Quality
- ✅ Follow TypeScript strict mode
- ✅ Use meaningful variable names
- ✅ Write self-documenting code
- ✅ Keep functions small and focused
- ❌ Don't use 'any' type

### User Experience
- ✅ Provide immediate feedback
- ✅ Handle loading states
- ✅ Show meaningful error messages
- ✅ Ensure keyboard navigation works
- ❌ Don't block UI unnecessarily

---

## Resources

- **Requirements**: See `requerimientos-sistema-financiero.md`
- **Database Schema**: See `database-schema.dbml`
- **Agent Prompts**: See `agentes-especializados.md`
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## Support & Questions

When in doubt:
1. Refer to this CONTEXT.md
2. Check requirements in `requerimientos-sistema-financiero.md`
3. Review database schema in `database-schema.dbml`
4. Consult agent prompts in `agentes-especializados.md`
5. Ask Project Maestro to clarify or prioritize

Remember: Quality over speed. Build it right the first time.

---

**Let's build Luka! 🚀**
