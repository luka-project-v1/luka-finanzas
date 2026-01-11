import { getBankAccounts } from '@/lib/actions/accounts';
import { getTransactions } from '@/lib/actions/transactions';
import DashboardContent from '@/components/dashboard/DashboardContent';

export default async function DashboardPage() {
  const accountsResult = await getBankAccounts();
  const recentTransactionsResult = await getTransactions({ limit: 5 });

  const accounts = accountsResult.success ? accountsResult.data : [];
  const recentTransactions = recentTransactionsResult.success ? recentTransactionsResult.data?.data || [] : [];

  return (
    <DashboardContent 
      initialAccounts={accounts}
      initialRecentTransactions={recentTransactions}
    />
  );
}
