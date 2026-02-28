import { getCreditCards } from '@/lib/actions/credits';
import { CreditsView } from './_components/credits-view';

export const metadata = {
  title: 'Tarjetas de Crédito — Luka',
};

export default async function CreditsPage() {
  const result = await getCreditCards();
  const cards = result.success ? result.data : [];

  return <CreditsView cards={cards} />;
}
