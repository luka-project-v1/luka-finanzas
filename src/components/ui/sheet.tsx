'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ─── Re-export root for controlled usage ──────────────────────────────────
export const SheetRoot = RadixDialog.Root;
export const SheetTrigger = RadixDialog.Trigger;
export const SheetClose = RadixDialog.Close;

// ─── Sheet Content (side panel) ───────────────────────────────────────────
type SheetSide = 'top' | 'right' | 'bottom' | 'left';

interface SheetContentProps {
  children: React.ReactNode;
  side?: SheetSide;
  className?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
}

const sideAnimations: Record<SheetSide, string> = {
  right:
    'data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
  left:
    'data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
  top: 'data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top',
  bottom:
    'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
};

const sidePosition: Record<SheetSide, string> = {
  right: 'inset-y-0 right-0 h-full w-full sm:max-w-md',
  left: 'inset-y-0 left-0 h-full w-full sm:max-w-md',
  top: 'inset-x-0 top-0 w-full',
  bottom: 'inset-x-0 bottom-0 w-full',
};

export function SheetContent({
  children,
  side = 'right',
  className,
  showCloseButton = true,
  onClose,
}: SheetContentProps) {
  return (
    <RadixDialog.Portal>
      {/* Backdrop with blur */}
      <RadixDialog.Overlay
        className={cn(
          'fixed inset-0 z-40',
          'bg-black/50 backdrop-blur-sm',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        )}
      />

      {/* Panel */}
      <RadixDialog.Content
        onEscapeKeyDown={onClose}
        onPointerDownOutside={onClose}
        className={cn(
          'fixed z-50',
          sidePosition[side],
          sideAnimations[side],
          // Neumorphic panel
          'bg-neu-surface border-l border-neu',
          'shadow-soft-out-md',
          'flex flex-col overflow-hidden',
          // Animations
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'duration-200 ease-out',
          side === 'right' && 'data-[state=closed]:slide-out-to-right',
          side === 'left' && 'data-[state=closed]:slide-out-to-left',
          side === 'top' && 'data-[state=closed]:slide-out-to-top',
          side === 'bottom' && 'data-[state=closed]:slide-out-to-bottom',
          className,
        )}
      >
        {showCloseButton && (
          <RadixDialog.Close
            onClick={onClose}
            className="
              absolute right-4 top-4 z-10
              flex items-center justify-center w-8 h-8 rounded-full
              bg-neu-raised border border-neu
              text-white/40 hover:text-white/80
              shadow-soft-out hover:shadow-soft-hover
              transition-all duration-150 shrink-0
            "
          >
            <X className="w-3.5 h-3.5" />
            <span className="sr-only">Cerrar</span>
          </RadixDialog.Close>
        )}
        <div className="flex-1 overflow-y-auto pt-4 pb-6 px-6">
          {children}
        </div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

// ─── Composed Sheet with open/onOpenChange ─────────────────────────────────
interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: SheetSide;
  className?: string;
  showCloseButton?: boolean;
}

export function Sheet({
  open,
  onOpenChange,
  children,
  side = 'right',
  className,
  showCloseButton = true,
}: SheetProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={className}
        showCloseButton={showCloseButton}
        onClose={() => onOpenChange(false)}
      >
        {children}
      </SheetContent>
    </RadixDialog.Root>
  );
}
