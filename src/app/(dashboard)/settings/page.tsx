import { getUserPreferences } from '@/lib/actions/preferences';
import { SettingsView } from './_components/settings-view';

export const metadata = {
  title: 'Ajustes — Luka',
};

export default async function SettingsPage() {
  const result = await getUserPreferences();
  const data = result.success ? result.data : null;

  return <SettingsView data={data} />;
}
