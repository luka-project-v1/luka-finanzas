import { ensureDefaultCurrencies } from '@/lib/actions/currencies';
import { getBaseCurrency } from '@/lib/actions/preferences';
import { getCurrentUser } from '@/lib/actions/auth';
import { CurrenciesView } from './_components/currencies-view';

export const metadata = {
  title: 'Divisas — Luka',
};

export default async function CurrenciesPage() {
  const [result, user] = await Promise.all([
    ensureDefaultCurrencies(),
    getCurrentUser(),
  ]);
  const currencies = (result.success ? result.data : []) as any;
  const baseCurrency = user ? await getBaseCurrency(user.id) : { code: 'COP', symbol: '$' };

  return <CurrenciesView currencies={currencies} baseCurrencyCode={baseCurrency.code} />;
}
