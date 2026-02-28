'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function RefreshBalancesButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={isPending}
      title="Recalcular balances con las tasas de cambio actuales"
      className={cn(
        'flex items-center gap-1.5',
        'text-xs font-medium text-neu-muted',
        'px-3 py-1.5 rounded-lg',
        'border border-transparent',
        'transition-all duration-150',
        'hover:text-white/70 hover:border-[#2a2a2a] hover:bg-[#141414]',
        'disabled:opacity-40 disabled:cursor-not-allowed',
      )}
    >
      <RefreshCw
        className={cn('w-3.5 h-3.5', isPending && 'animate-spin')}
        strokeWidth={2}
      />
      {isPending ? 'Actualizando…' : 'Refrescar Balances'}
    </button>
  );
}
