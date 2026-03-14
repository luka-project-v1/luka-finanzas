import { Suspense } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { getTransactions, getLastAdjustmentDates } from '@/lib/actions/transactions';
import { getAllAccounts } from '@/lib/actions/accounts';
import { getOrCreateDefaultCategories } from '@/lib/actions/categories';
import { TransactionsView } from './_components/transactions-view';

export const metadata = {
  title: 'Transacciones — Luka',
};

export default async function TransactionsPage() {
  const now = new Date();
  const startDateObj = startOfMonth(now);
  const endDateObj = endOfMonth(now);

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

  const [txResult, accountsResult, categoriesResult] = await Promise.all([
    getTransactions({ startDate, endDate, page: 1, limit: 20 }),
    getAllAccounts(),
    getOrCreateDefaultCategories(),
  ]);
  const initialTransactions = txResult.success ? txResult.data.data : [];
  const initialTotal = txResult.success ? txResult.data.count : 0;
  const initialTotalPages = txResult.success ? txResult.data.totalPages : 0;
  const initialTransferInfo = txResult.success ? txResult.data.transferInfo ?? {} : {};
  const accounts = accountsResult.success ? accountsResult.data : [];
  const categories = categoriesResult.success ? categoriesResult.data : [];

  const accountIds = accounts.map((a) => a.id);
  const adjustmentResult = await getLastAdjustmentDates(accountIds);
  const lastAdjustmentByAccount: Record<string, { date: string; id: string }> =
    adjustmentResult.success ? adjustmentResult.data : {};

  return (
    <Suspense fallback={null}>
      <TransactionsView
        initialTransactions={initialTransactions}
        initialTotal={initialTotal}
        initialTotalPages={initialTotalPages}
        initialTransferInfo={initialTransferInfo}
        accounts={accounts}
        categories={categories as any}
        initialLastAdjustmentByAccount={lastAdjustmentByAccount}
      />
    </Suspense>
  );
}
