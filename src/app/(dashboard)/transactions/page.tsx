import { format, startOfMonth, endOfMonth } from 'date-fns';
import { getTransactions, getLastAdjustmentDates } from '@/lib/actions/transactions';
import { getBankAccounts } from '@/lib/actions/accounts';
import { getCategories } from '@/lib/actions/categories';
import { TransactionsView } from './_components/transactions-view';

export const metadata = {
  title: 'Transacciones — Luka',
};

export default async function TransactionsPage() {
  const now = new Date();
  const startDate = format(startOfMonth(now), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(now), 'yyyy-MM-dd');

  const [txResult, accountsResult, categoriesResult] = await Promise.all([
    getTransactions({ startDate, endDate, page: 1, limit: 20 }),
    getBankAccounts(),
    getCategories(),
  ]);

  const initialTransactions = txResult.success ? txResult.data.data : [];
  const initialTotal        = txResult.success ? txResult.data.count : 0;
  const initialTotalPages   = txResult.success ? txResult.data.totalPages : 0;
  const accounts            = accountsResult.success ? accountsResult.data : [];
  const categories          = categoriesResult.success ? categoriesResult.data : [];

  const accountIds = accounts.map((a) => a.id);
  const adjustmentResult = await getLastAdjustmentDates(accountIds);
  const lastAdjustmentByAccount: Record<string, { date: string; id: string }> =
    adjustmentResult.success ? adjustmentResult.data : {};

  return (
    <TransactionsView
      initialTransactions={initialTransactions}
      initialTotal={initialTotal}
      initialTotalPages={initialTotalPages}
      accounts={accounts}
      categories={categories}
      initialLastAdjustmentByAccount={lastAdjustmentByAccount}
    />
  );
}
