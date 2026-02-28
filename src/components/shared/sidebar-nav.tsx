'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Landmark,
  CreditCard,
  ArrowLeftRight,
  Tag,
  CircleDollarSign,
  LogOut,
  Coins,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { signOut } from '@/lib/actions/auth';

const NAV_ITEMS = [
  { label: 'Inicio',              href: '/dashboard',      icon: LayoutDashboard },
  { label: 'Cuentas',             href: '/accounts',       icon: Landmark },
  { label: 'Tarjetas de Crédito', href: '/credits',        icon: CreditCard },
  { label: 'Transacciones',       href: '/transactions',   icon: ArrowLeftRight },
  { label: 'Categorías',          href: '/categories',     icon: Tag },
  { label: 'Divisas',             href: '/currencies',     icon: CircleDollarSign },
] as const;

interface SidebarNavProps {
  userEmail: string | null;
}

export function SidebarNav({ userEmail }: SidebarNavProps) {
  const pathname = usePathname();

  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : '??';

  return (
    <aside className="
      flex flex-col w-64 min-h-screen shrink-0
      bg-neu-surface border-r border-neu
    ">
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-6 py-7">
        <div className="
          flex items-center justify-center w-9 h-9
          rounded-neu-sm bg-neu-raised
          shadow-soft-out
        ">
          <Coins className="w-5 h-5 text-luka-accent" strokeWidth={1.5} />
        </div>
        <span className="text-xl font-semibold tracking-tight text-white/90">
          Luka
        </span>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 pb-4 space-y-1" aria-label="Navegación principal">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-[1rem] text-sm font-medium',
                'transition-all duration-150 ease-out',
                isActive
                  ? 'neu-nav-active text-luka-accent shadow-soft-in'
                  : [
                      'text-white/50 hover:text-white/80',
                      'hover:bg-neu-raised hover:shadow-soft-out',
                    ],
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors duration-150',
                  isActive
                    ? 'text-luka-accent'
                    : 'text-white/40 group-hover:text-white/70',
                )}
                strokeWidth={isActive ? 2 : 1.5}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ── User profile + logout ── */}
      <div className="px-3 pb-6 pt-2 border-t border-neu space-y-2">
        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-3 rounded-[1rem] bg-neu-raised border border-neu">
          {/* Avatar */}
          <div className="
            flex items-center justify-center w-8 h-8
            rounded-full bg-luka-accent/15 border border-luka-accent/30
            text-xs font-semibold text-luka-accent shrink-0
          ">
            {initials}
          </div>
          {/* Email — truncated */}
          <p className="text-xs text-white/50 truncate flex-1">
            {userEmail ?? 'Sin cuenta'}
          </p>
        </div>

        {/* Logout */}
        <form action={signOut}>
          <button
            type="submit"
            className="
              neu-btn w-full gap-2
              text-white/40 hover:text-luka-expense
              text-xs font-medium
            "
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
