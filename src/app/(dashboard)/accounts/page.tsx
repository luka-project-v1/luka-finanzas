import { getBankAccounts } from '@/lib/actions/accounts';
import { AccountsView } from './_components/accounts-view';

export const metadata = {
  title: 'Cuentas Bancarias — Luka',
};

export default async function AccountsPage() {
  const result = await getBankAccounts();
  const accounts = result.success ? result.data : [];

  return <AccountsView accounts={accounts} />;
}
