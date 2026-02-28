import { Suspense } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SummaryCards, SummaryCardsSkeleton } from './_components/summary-cards';
import { AccountsStrip, AccountsStripSkeleton } from './_components/accounts-strip';
import { RecentTransactions, RecentTransactionsSkeleton } from './_components/recent-transactions';
import { RefreshBalancesButton } from './_components/refresh-balances-button';

export const metadata = {
  title: 'Inicio — Luka',
};

export default function DashboardPage() {
  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });

  return (
    <div className="space-y-10">
      {/* ── Page header ── */}
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-neu-muted uppercase tracking-widest">
            {today}
          </p>
          <h1 className="text-2xl font-bold text-white/90 tracking-tight">
            Resumen
          </h1>
        </div>
        <RefreshBalancesButton />
      </div>

      {/* ── Summary cards — streamed ── */}
      <Suspense fallback={<SummaryCardsSkeleton />}>
        <SummaryCards />
      </Suspense>

      {/* ── Bank accounts strip — streamed ── */}
      <Suspense fallback={<AccountsStripSkeleton />}>
        <AccountsStrip />
      </Suspense>

      {/* ── Recent transactions — streamed ── */}
      <Suspense fallback={<RecentTransactionsSkeleton />}>
        <RecentTransactions />
      </Suspense>
    </div>
  );
}
