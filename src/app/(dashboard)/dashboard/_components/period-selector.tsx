'use client';

import { useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Select } from '@/components/ui/form-fields';
import { cn } from '@/lib/utils/cn';

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface PeriodSelectorProps {
    currentMonth: number; // 1-12
    currentYear: number;
}

export function PeriodSelector({ currentMonth, currentYear }: PeriodSelectorProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const thisYear = new Date().getFullYear();
    const years = Array.from({ length: 11 }, (_, i) => thisYear - 5 + i);

    const updateFilters = (month: number, year: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('month', month.toString());
        params.set('year', year.toString());

        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateFilters(parseInt(e.target.value, 10), currentYear);
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateFilters(currentMonth, parseInt(e.target.value, 10));
    };

    const handlePrevMonth = () => {
        if (currentMonth === 1) {
            updateFilters(12, currentYear - 1);
        } else {
            updateFilters(currentMonth - 1, currentYear);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 12) {
            updateFilters(1, currentYear + 1);
        } else {
            updateFilters(currentMonth + 1, currentYear);
        }
    };

    return (
        <div className={cn(
            "flex items-center gap-1.5 p-1 rounded-xl bg-neu-raised border border-neu-border",
            "shadow-soft-out",
            isPending && "opacity-70 pointer-events-none"
        )}>
            {/* Previous Month */}
            <button
                type="button"
                onClick={handlePrevMonth}
                className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg",
                    "text-white/70 hover:text-white transition-all",
                    "hover:bg-[#1a1a1a] active:shadow-soft-in"
                )}
                aria-label="Mes anterior"
            >
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            </button>

            {/* Selectors container */}
            <div className="flex items-center gap-1">
                <Select
                    value={currentMonth}
                    onChange={handleMonthChange}
                    className="w-[125px] h-8 py-0 pl-3 pr-8 rounded-lg text-sm font-medium border border-[#1e1e1e] shadow-[inset_2px_2px_5px_#000,inset_-2px_-2px_4px_#1d1d1d] bg-[#0e0e0e] focus:ring-opacity-0"
                >
                    {MONTHS.map((name, index) => (
                        <option key={index + 1} value={index + 1}>
                            {name}
                        </option>
                    ))}
                </Select>

                <Select
                    value={currentYear}
                    onChange={handleYearChange}
                    className="w-[85px] h-8 py-0 pl-3 pr-8 rounded-lg text-sm font-medium border border-[#1e1e1e] shadow-[inset_2px_2px_5px_#000,inset_-2px_-2px_4px_#1d1d1d] bg-[#0e0e0e] focus:ring-opacity-0"
                >
                    {years.map((y) => (
                        <option key={y} value={y}>
                            {y}
                        </option>
                    ))}
                </Select>
            </div>

            {/* Next Month */}
            <button
                type="button"
                onClick={handleNextMonth}
                className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg",
                    "text-white/70 hover:text-white transition-all",
                    "hover:bg-[#1a1a1a] active:shadow-soft-in"
                )}
                aria-label="Mes siguiente"
            >
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
        </div>
    );
}
