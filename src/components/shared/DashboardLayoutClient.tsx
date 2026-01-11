'use client';

import { MonthYearProvider } from '@/lib/contexts/MonthYearContext';
import GlobalMonthYearSelector from './GlobalMonthYearSelector';
import Sidebar from './Sidebar';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  userEmail: string;
}

export default function DashboardLayoutClient({ children, userEmail }: DashboardLayoutClientProps) {
  const router = useRouter();

  const handleSignOutClick = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <MonthYearProvider>
      <div className="min-h-screen bg-[#F5F3EE] flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-[#E5E3DE] fixed h-full">
          <div className="p-6">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-[#D97757] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">L</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#1A1A1A]">Luka</h1>
                <p className="text-xs text-[#6B6B6B]">FINANCE</p>
              </div>
            </div>

            {/* Global Month/Year Selector */}
            <div className="mb-6">
              <GlobalMonthYearSelector />
            </div>

            {/* Navigation */}
            <Sidebar />

            {/* User section at bottom */}
            <div className="absolute bottom-6 left-6 right-6">
              <Link
                href="/settings"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#6B6B6B] hover:bg-[#F5F3EE] font-medium transition-colors mb-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Configuración
              </Link>

              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 bg-[#D97757] rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {userEmail?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A] truncate">
                    {userEmail?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-[#6B6B6B]">PLAN PREMIUM</p>
                </div>
                <button
                  onClick={handleSignOutClick}
                  className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
                  title="Cerrar sesión"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64">
          {/* Page Content */}
          <div className="p-12">
            {children}
          </div>
        </main>
      </div>
    </MonthYearProvider>
  );
}
