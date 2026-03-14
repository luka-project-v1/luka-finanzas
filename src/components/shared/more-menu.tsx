'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Landmark,
  CreditCard,
  ArrowLeftRight,
  Tag,
  CircleDollarSign,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { signOut } from '@/lib/actions/auth';
import { Sheet } from '@/components/ui/sheet';

const MENU_ITEMS = [
  { label: 'Cuentas', href: '/accounts', icon: Landmark },
  { label: 'Tarjetas', href: '/credits', icon: CreditCard },
  { label: 'Transacciones', href: '/transactions', icon: ArrowLeftRight },
  { label: 'Categorías', href: '/categories', icon: Tag },
  { label: 'Divisas', href: '/currencies', icon: CircleDollarSign },
  { label: 'Ajustes', href: '/settings', icon: Settings },
] as const;

interface MoreMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail?: string | null;
}

export function MoreMenu({ open, onOpenChange, userEmail }: MoreMenuProps) {
  const pathname = usePathname();

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      side="bottom"
      showCloseButton={false}
      className="max-h-[85vh] rounded-t-[1.5rem] rounded-b-none border-t border-b-0"
    >
        <div className="flex flex-col h-full">
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div
              className="w-12 h-1 rounded-full bg-white/20 shadow-soft-in"
              aria-hidden
            />
          </div>

          {/* Header */}
          <div className="px-4 pb-4">
            <h2 className="text-lg font-semibold text-white/90 tracking-tight">
              Más opciones
            </h2>
            {userEmail && (
              <p className="text-xs text-neu-muted truncate mt-0.5">
                {userEmail}
              </p>
            )}
          </div>

          {/* Menu items — neumorphic list */}
          <nav className="flex-1 overflow-y-auto space-y-1 px-2" aria-label="Menú de navegación">
            {MENU_ITEMS.map(({ label, href, icon: Icon }) => {
              const isActive =
                href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3.5 rounded-[1rem]',
                    'transition-all duration-150',
                    isActive
                  ? 'neu-nav-active text-luka-accent shadow-soft-in'
                  : 'text-white/70 hover:text-white/90 hover:bg-neu-raised hover:shadow-soft-out active:shadow-soft-in',
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-9 h-9 rounded-xl shrink-0',
                      'shadow-soft-out',
                      isActive ? 'bg-luka-accent/15' : 'bg-neu-raised',
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4',
                        isActive ? 'text-luka-accent' : 'text-white/50',
                      )}
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                  </div>
                  <span className="flex-1 font-medium text-sm">{label}</span>
                  <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
                </Link>
              );
            })}
          </nav>

          {/* Logout — subtle but clear, safe area for home indicator */}
          <div className="pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] px-2 border-t border-neu mt-2">
            <form action={signOut}>
              <button
                type="submit"
                className="
                  w-full flex items-center gap-3 px-4 py-3.5 rounded-[1rem]
                  neu-btn neu-btn-destructive
                  text-white/50 hover:text-luka-expense
                  text-sm font-medium
                  transition-colors duration-150
                "
              >
                <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
    </Sheet>
  );
}
