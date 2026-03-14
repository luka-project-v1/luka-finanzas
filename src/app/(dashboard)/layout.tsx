import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth';
import { ensureDefaultCurrencies } from '@/lib/actions/currencies';
import { syncSystemCategories } from '@/lib/actions/categories';
import { SidebarNav } from '@/components/shared/sidebar-nav';
import { MobileNav } from '@/components/shared/mobile-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Ensure user has default currencies (USD + COP) before rendering any page.
  // Runs on every dashboard navigation so total/net values are correct from the start.
  await ensureDefaultCurrencies();
  await syncSystemCategories(user.id);

  return (
    <div className="flex min-h-screen bg-neu">
      {/* Sidebar — hidden on mobile (max-width: 768px) */}
      <div className="hidden md:block shrink-0">
        <SidebarNav userEmail={user.email ?? null} />
      </div>

      {/* ── Main content area ── */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
        {/* Top bar */}
        <header className="
          sticky top-0 z-10
          h-16 flex items-center px-4 md:px-8
          bg-neu/80 backdrop-blur-md
          border-b border-neu
        ">
          {/* Breadcrumb / page title injected by each page via slot — spacer for now */}
          <div className="flex-1" />
        </header>

        {/* Page content — responsive padding (px-4 mobile), bottom padding for mobile nav */}
        <div className="px-4 md:px-8 py-6 md:py-8 pb-24 md:pb-8 max-w-[1400px]">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav — visible only on screens < 768px */}
      <MobileNav userEmail={user.email ?? null} />
    </div>
  );
}
