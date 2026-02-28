import { getOrCreateDefaultCurrencies } from '@/lib/actions/currencies';
import { CurrenciesView } from './_components/currencies-view';

export const metadata = {
  title: 'Divisas — Luka',
};

export default async function CurrenciesPage() {
  const result = await getOrCreateDefaultCurrencies();
  const currencies = result.success ? result.data : [];

  return <CurrenciesView currencies={currencies} />;
}
