'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Menu, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { MoreMenu } from './more-menu';

interface MobileNavProps {
  userEmail?: string | null;
}

export function MobileNav({ userEmail }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const isDashboardActive = pathname === '/dashboard';

  function handleCenterButton() {
    router.push('/transactions?openCreate=1');
  }

  return (
    <>
      <nav
        className="
          md:hidden
          fixed bottom-0 left-0 right-0 z-50
          h-[72px] flex items-center justify-center
          bg-neu-surface/95 backdrop-blur-lg
          border-t border-neu
          safe-area-inset-bottom
        "
        aria-label="Navegación móvil"
      >
        <div className="flex items-center justify-evenly w-full max-w-[440px] px-2 h-full">
          {/* Inicio (left) */}
          <Link
            href="/dashboard"
            className="flex flex-col items-center justify-center group touch-manipulation"
            aria-label="Inicio"
          >
            <div
              className={cn(
                'flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200',
                'bg-neu-surface shadow-soft-in',
                isDashboardActive ? 'border border-luka-terracotta/30' : 'border border-transparent',
              )}
            >
              <LayoutDashboard
                className={cn(
                  'w-5 h-5 transition-colors',
                  isDashboardActive ? 'text-luka-terracotta' : 'text-white/40 group-active:text-white/60',
                )}
                strokeWidth={isDashboardActive ? 2 : 1.5}
              />
            </div>
            <span
              className={cn(
                'text-[10px] font-medium mt-1.5 transition-colors',
                isDashboardActive ? 'text-white' : 'text-white/50',
              )}
            >
              Inicio
            </span>
          </Link>

          {/* Center FAB — New Transaction */}
          <div className="relative -top-4">
            <button
              type="button"
              onClick={handleCenterButton}
              className="
                flex items-center justify-center
                w-16 h-16 rounded-full
                bg-[#D67F61] text-white
                shadow-soft-out
                hover:brightness-110 active:scale-95 active:shadow-soft-in
                transition-all duration-200
                touch-manipulation
              "
              aria-label="Nueva transacción"
            >
              <Plus className="w-8 h-8" strokeWidth={3} />
            </button>
          </div>

          {/* Menú (right) — opens MoreMenu */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center justify-center group touch-manipulation"
            aria-label="Menú"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-neu-surface shadow-soft-in border border-transparent transition-all duration-200">
              <Menu className="w-5 h-5 text-white/40 group-active:text-white/60" strokeWidth={1.5} />
            </div>
            <span className="text-[10px] font-medium mt-1.5 text-white/50">
              Menú
            </span>
          </button>
        </div>
      </nav>

      <MoreMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        userEmail={userEmail}
      />
    </>
  );
}
