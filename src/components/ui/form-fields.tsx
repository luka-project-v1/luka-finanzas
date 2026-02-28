import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ─── Label ────────────────────────────────────────────────────────────────
interface FieldLabelProps {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}

export function FieldLabel({ children, required, htmlFor }: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2"
    >
      {children}
      {required && <span className="text-luka-accent ml-0.5">*</span>}
    </label>
  );
}

// ─── Error message ────────────────────────────────────────────────────────
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-luka-expense mt-1.5">{message}</p>;
}

// ─── Input ────────────────────────────────────────────────────────────────
export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'w-full rounded-[0.75rem] px-4 py-2.5',
      'bg-[#0e0e0e] border border-[#1e1e1e]',
      'text-sm text-white/80 placeholder-[#444444]',
      'shadow-[inset_3px_3px_7px_#000,inset_-2px_-2px_5px_#1d1d1d]',
      'focus:outline-none focus:border-[#D97757]/50 focus:ring-1 focus:ring-[#D97757]/20',
      'transition-all duration-150',
      'disabled:opacity-40 disabled:cursor-not-allowed',
      // Date/datetime-local inputs have lighter placeholder text in dark mode
      '[color-scheme:dark]',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';

// ─── Select ───────────────────────────────────────────────────────────────
export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        'w-full rounded-[0.75rem] px-4 py-2.5 pr-9',
        'bg-[#0e0e0e] border border-[#1e1e1e]',
        'text-sm text-white/80',
        'shadow-[inset_3px_3px_7px_#000,inset_-2px_-2px_5px_#1d1d1d]',
        'focus:outline-none focus:border-[#D97757]/50 focus:ring-1 focus:ring-[#D97757]/20',
        'appearance-none cursor-pointer transition-all duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        '[color-scheme:dark]',
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
      <ChevronDown className="w-4 h-4" />
    </div>
  </div>
));
Select.displayName = 'Select';

// ─── Textarea ─────────────────────────────────────────────────────────────
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'w-full rounded-[0.75rem] px-4 py-2.5',
      'bg-[#0e0e0e] border border-[#1e1e1e]',
      'text-sm text-white/80 placeholder-[#444444]',
      'shadow-[inset_3px_3px_7px_#000,inset_-2px_-2px_5px_#1d1d1d]',
      'focus:outline-none focus:border-[#D97757]/50 focus:ring-1 focus:ring-[#D97757]/20',
      'transition-all duration-150 resize-none',
      'disabled:opacity-40 disabled:cursor-not-allowed',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
