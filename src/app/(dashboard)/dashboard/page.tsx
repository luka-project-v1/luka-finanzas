import { Suspense } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { SummaryCards, SummaryCardsSkeleton } from './_components/summary-cards';
import { AccountsStrip, AccountsStripSkeleton } from './_components/accounts-strip';
import { RecentTransactions, RecentTransactionsSkeleton } from './_components/recent-transactions';
import { DebtSummary, DebtSummarySkeleton } from './_components/debt-summary';
import { RefreshBalancesButton } from './_components/refresh-balances-button';
import { PeriodSelector } from './_components/period-selector';

export const metadata = {
  title: 'Inicio — Luka',
};

interface DashboardProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function DashboardPage({ searchParams }: DashboardProps) {
  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });

  const now = new Date();
  const currentMonth = typeof searchParams.month === 'string' ? parseInt(searchParams.month, 10) : now.getMonth() + 1;
  const currentYear = typeof searchParams.year === 'string' ? parseInt(searchParams.year, 10) : now.getFullYear();

  const targetDate = new Date(currentYear, currentMonth - 1, 1);
  const startDateObj = startOfMonth(targetDate);
  const endDateObj = endOfMonth(targetDate);

  const startDate = new Date(
    startDateObj.getFullYear(),
    startDateObj.getMonth(),
    startDateObj.getDate(),
    0, 0, 0
  ).toISOString();

  const endDate = new Date(
    endDateObj.getFullYear(),
    endDateObj.getMonth(),
    endDateObj.getDate(),
    23, 59, 59, 999
  ).toISOString();

  const monthLabel = format(targetDate, 'MMMM yyyy', { locale: es });

  return (
    <div className="space-y-10">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-neu-muted uppercase tracking-widest">
            {today}
          </p>
          <h1 className="text-2xl font-bold text-white/90 tracking-tight">
            Resumen
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <PeriodSelector currentMonth={currentMonth} currentYear={currentYear} />
          <RefreshBalancesButton />
        </div>
      </div>

      {/* ── Summary cards — streamed ── */}
      <Suspense fallback={<SummaryCardsSkeleton />}>
        <SummaryCards startDate={startDate} endDate={endDate} monthLabel={monthLabel} />
      </Suspense>

      {/* ── Bank accounts strip — streamed ── */}
      <Suspense fallback={<AccountsStripSkeleton />}>
        <AccountsStrip endDate={endDate} />
      </Suspense>

      {/* ── Debt summary — streamed (only renders when there are active loans) ── */}
      <Suspense fallback={<DebtSummarySkeleton />}>
        <DebtSummary />
      </Suspense>

      {/* ── Recent transactions — streamed ── */}
      <Suspense fallback={<RecentTransactionsSkeleton />}>
        <RecentTransactions startDate={startDate} endDate={endDate} />
      </Suspense>
    </div>
  );
}
