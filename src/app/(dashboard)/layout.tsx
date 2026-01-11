import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/server';
import DashboardLayoutClient from '@/components/shared/DashboardLayoutClient';

async function handleSignOut() {
  'use server';
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  return (
    <DashboardLayoutClient userEmail={user.email || ''}>
      {children}
    </DashboardLayoutClient>
  );
}
