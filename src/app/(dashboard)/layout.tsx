import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth';
import { SidebarNav } from '@/components/shared/sidebar-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-neu">
      <SidebarNav userEmail={user.email ?? null} />

      {/* ── Main content area ── */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="
          sticky top-0 z-10
          h-16 flex items-center px-8
          bg-neu/80 backdrop-blur-md
          border-b border-neu
        ">
          {/* Breadcrumb / page title injected by each page via slot — spacer for now */}
          <div className="flex-1" />
        </header>

        {/* Page content */}
        <div className="px-8 py-8 max-w-[1400px]">
          {children}
        </div>
      </main>
    </div>
  );
}
