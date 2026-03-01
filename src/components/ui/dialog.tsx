'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ─── Re-export root for controlled usage ──────────────────────────────────
export const DialogRoot    = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;

// ─── Composed Dialog with neumorphic styling ──────────────────────────────
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Optional custom header (replaces title/description when provided) */
  header?: React.ReactNode;
  children: React.ReactNode;
  /** Extra classes on the panel itself */
  className?: string;
  /** Max-width override — defaults to max-w-lg */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  header,
  children,
  className,
  size = 'lg',
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        {/* Backdrop */}
        <RadixDialog.Overlay
          className="
            fixed inset-0 z-40
            bg-black/60 backdrop-blur-sm
            data-[state=open]:animate-in data-[state=closed]:animate-out
            data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
          "
        />

        {/* Panel */}
        <RadixDialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50',
            '-translate-x-1/2 -translate-y-1/2',
            'w-[calc(100vw-2rem)]',
            sizeMap[size],
            // Neumorphic card
            'bg-[#141414] rounded-[1.5rem]',
            'border border-[#1e1e1e]',
            'shadow-[4px_4px_10px_#000000,_-3px_-3px_7px_#1a1a1a]',
            // Layout
            'max-h-[90vh] overflow-y-auto',
            'p-7',
            // Animations
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            'duration-200',
            className,
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-7">
            {header ?? (
              <div>
                <RadixDialog.Title className="text-base font-semibold text-white/90 tracking-tight">
                  {title}
                </RadixDialog.Title>
                {description && (
                  <RadixDialog.Description className="text-sm text-neu-muted mt-1">
                    {description}
                  </RadixDialog.Description>
                )}
              </div>
            )}
            <RadixDialog.Close
              className="
                flex items-center justify-center w-8 h-8 rounded-full
                bg-neu-raised border border-neu
                text-white/40 hover:text-white/80
                shadow-soft-out hover:shadow-soft-hover
                transition-all duration-150 ml-4 shrink-0
              "
            >
              <X className="w-3.5 h-3.5" />
              <span className="sr-only">Cerrar</span>
            </RadixDialog.Close>
          </div>

          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
