import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Landmark } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { getTransactionsSummary } from '@/lib/actions/transactions';
import { getTotalBalanceInPreferredCurrency } from '@/lib/actions/accounts';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/cn';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Skeleton exported for Suspense fallback ───────────────────────────────
export function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="neu-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

// ─── Data component ────────────────────────────────────────────────────────
export async function SummaryCards() {
  const now = new Date();
  const startDate = format(startOfMonth(now), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(now), 'yyyy-MM-dd');
  const monthLabel = format(now, 'MMMM yyyy', { locale: es });

  const [summaryResult, totalResult] = await Promise.all([
    getTransactionsSummary(startDate, endDate),
    getTotalBalanceInPreferredCurrency(),
  ]);

  const summary = summaryResult.success
    ? summaryResult.data
    : { totalIncome: 0, totalExpense: 0, balance: 0, preferredCode: 'COP', preferredSymbol: '$' };

  const totalBalance = totalResult.success ? totalResult.data : null;

  // Symbol and label to use for transaction-based cards (income, expense, net balance)
  const txSymbol = summary.preferredSymbol;
  const txCode = summary.preferredCode;

  const cards = [
    ...(totalBalance
      ? [
          {
            label: 'Balance Total',
            sublabel: `Todas las cuentas en ${totalBalance.preferredCode}`,
            value: totalBalance.total,
            symbol: totalBalance.preferredSymbol,
            icon: Landmark,
            iconBg: 'bg-luka-accent/10',
            iconColor: 'text-luka-accent',
            valueColor:
              totalBalance.total >= 0 ? 'text-luka-income' : 'text-luka-expense',
            trend:
              totalBalance.total >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-luka-income" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-luka-expense" />
              ),
            accentLine:
              totalBalance.total >= 0 ? 'from-luka-income/30' : 'from-luka-expense/30',
          },
        ]
      : []),
    {
      label: 'Balance Neto',
      sublabel: `${monthLabel} · ${txCode}`,
      value: summary.balance,
      symbol: txSymbol,
      icon: Wallet,
      iconBg: 'bg-luka-accent/10',
      iconColor: 'text-luka-accent',
      valueColor:
        summary.balance >= 0 ? 'text-luka-income' : 'text-luka-expense',
      trend:
        summary.balance >= 0 ? (
          <ArrowUpRight className="w-3.5 h-3.5 text-luka-income" />
        ) : (
          <ArrowDownRight className="w-3.5 h-3.5 text-luka-expense" />
        ),
      accentLine: summary.balance >= 0 ? 'from-luka-income/30' : 'from-luka-expense/30',
    },
    {
      label: 'Ingresos del Mes',
      sublabel: `Transacciones registradas · ${txCode}`,
      value: summary.totalIncome,
      symbol: txSymbol,
      icon: TrendingUp,
      iconBg: 'bg-luka-income/10',
      iconColor: 'text-luka-income',
      valueColor: 'text-luka-income',
      trend: <ArrowUpRight className="w-3.5 h-3.5 text-luka-income" />,
      accentLine: 'from-luka-income/30',
    },
    {
      label: 'Gastos del Mes',
      sublabel: `Transacciones registradas · ${txCode}`,
      value: summary.totalExpense,
      symbol: txSymbol,
      icon: TrendingDown,
      iconBg: 'bg-luka-expense/10',
      iconColor: 'text-luka-expense',
      valueColor: 'text-luka-expense',
      trend: <ArrowDownRight className="w-3.5 h-3.5 text-luka-expense" />,
      accentLine: 'from-luka-expense/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="neu-card p-6 flex flex-col gap-4 relative overflow-hidden"
          >
            {/* Subtle gradient top-left accent */}
            <div
              className={cn(
                'absolute -top-8 -left-8 w-32 h-32 rounded-full opacity-20 blur-2xl bg-gradient-radial',
                card.accentLine,
              )}
            />

            {/* Header */}
            <div className="flex items-center justify-between relative">
              <span className="text-xs font-medium text-neu-muted uppercase tracking-widest">
                {card.label}
              </span>
              <div
                className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-full',
                  'shadow-soft-out',
                  card.iconBg,
                )}
              >
                <Icon className={cn('w-4 h-4', card.iconColor)} strokeWidth={1.5} />
              </div>
            </div>

            {/* Amount */}
            <div className="relative">
              <p className={cn('text-2xl font-bold tracking-tight', card.valueColor)}>
                {formatCurrency(card.value, card.symbol ?? '$')}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-1 relative">
              {card.trend}
              <span className="text-xs text-neu-muted">{card.sublabel}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
