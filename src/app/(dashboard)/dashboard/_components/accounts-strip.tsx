import Link from 'next/link';
import { Landmark, CreditCard, PlusCircle, ChevronRight } from 'lucide-react';
import { getBankAccounts } from '@/lib/actions/accounts';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/cn';
import { Skeleton } from '@/components/ui/skeleton';
import type { AccountWithDetails } from '@/lib/repositories/account-repository';

// ─── Skeleton ──────────────────────────────────────────────────────────────
export function AccountsStripSkeleton() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="neu-card p-5 min-w-[220px] space-y-4 shrink-0">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Currency symbol helper ────────────────────────────────────────────────
function currencySymbol(code: string | null): string {
  if (!code) return '$';
  const map: Record<string, string> = { USD: '$', COP: 'COP$', EUR: '€', GBP: '£' };
  return map[code] ?? code;
}

// ─── Single account card ───────────────────────────────────────────────────
function AccountCard({ account }: { account: AccountWithDetails }) {
  const details = account.bank_account_details;
  const balance = account.balance ?? 0;
  const isPositive = balance >= 0;
  const kind = details?.kind ?? 'SAVINGS';

  return (
    <Link
      href={`/accounts/${account.id}`}
      className="
        group neu-card p-5 min-w-[220px] shrink-0
        flex flex-col gap-3
        hover:shadow-soft-hover transition-all duration-200
        cursor-pointer
      "
    >
      {/* Top row: icon + type badge */}
      <div className="flex items-center justify-between">
        <div className="
          flex items-center justify-center w-9 h-9
          rounded-full bg-luka-accent/10 shadow-soft-out
        ">
          <Landmark className="w-4 h-4 text-luka-accent" strokeWidth={1.5} />
        </div>
        <span className="
          text-[10px] font-semibold uppercase tracking-wider
          px-2 py-0.5 rounded-full
          bg-neu-raised border border-neu
          text-neu-muted
        ">
          {kind}
        </span>
      </div>

      {/* Balance */}
      <div>
        <p className={cn(
          'text-xl font-bold tabular-nums tracking-tight',
          isPositive ? 'text-white/90' : 'text-luka-expense',
        )}>
          {formatCurrency(balance, currencySymbol(account.currency_code))}
        </p>
        <p className="text-xs text-neu-muted mt-0.5">{account.currency_code}</p>
      </div>

      {/* Account name */}
      <div>
        <p className="text-sm font-medium text-white/70 truncate">{account.name}</p>
        {details?.bank_name && (
          <p className="text-xs text-neu-muted truncate">{details.bank_name}</p>
        )}
        {details?.masked_number && (
          <p className="text-xs font-mono text-neu-subtle mt-0.5">
            •••• {details.masked_number.slice(-4)}
          </p>
        )}
      </div>
    </Link>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────
function EmptyAccounts() {
  return (
    <Link
      href="/accounts"
      className="
        neu-card p-8 flex flex-col items-center gap-3
        text-center min-w-[220px]
        hover:shadow-soft-hover transition-all duration-200
      "
    >
      <div className="
        flex items-center justify-center w-12 h-12
        rounded-full bg-luka-accent/10 shadow-soft-out
      ">
        <PlusCircle className="w-6 h-6 text-luka-accent" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium text-white/60">Agrega tu primera cuenta</p>
      <p className="text-xs text-neu-muted">Conecta una cuenta bancaria para comenzar</p>
    </Link>
  );
}

// ─── Data component ────────────────────────────────────────────────────────
interface AccountsStripProps {
  endDate?: string;
}

export async function AccountsStrip({ endDate }: AccountsStripProps = {}) {
  const result = await getBankAccounts(endDate);
  const accounts = result.success ? result.data : [];
  const activeAccounts = accounts.filter((a) => a.status === 'ACTIVE');

  return (
    <section className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-widest">
          Cuentas Bancarias
        </h2>
        <Link
          href="/accounts"
          className="flex items-center gap-1 text-xs text-luka-accent hover:text-luka-accent/80 transition-colors"
        >
          Ver todo
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Horizontal scroll container */}
      <div
        className="
          flex gap-4 overflow-x-auto pb-3
          scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neu-border
        "
      >
        {activeAccounts.length === 0 ? (
          <EmptyAccounts />
        ) : (
          <>
            {activeAccounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
            {/* Add account card */}
            <Link
              href="/accounts"
              className="
                neu-card p-5 min-w-[160px] shrink-0
                flex flex-col items-center justify-center gap-2
                text-center border-dashed
                hover:shadow-soft-hover transition-all duration-200
              "
            >
              <div className="
                flex items-center justify-center w-9 h-9
                rounded-full bg-neu-raised shadow-soft-out
              ">
                <PlusCircle className="w-4 h-4 text-neu-muted" strokeWidth={1.5} />
              </div>
              <p className="text-xs text-neu-muted">Agregar cuenta</p>
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
