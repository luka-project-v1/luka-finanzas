'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface MonthYearContextType {
  selectedMonth: number;
  selectedYear: number;
  showAllMonths: boolean;
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
  setShowAllMonths: (show: boolean) => void;
}

const MonthYearContext = createContext<MonthYearContextType | undefined>(undefined);

export function MonthYearProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAllMonths, setShowAllMonths] = useState(false);

  // Initialize from URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const monthParam = params.get('month');
    const yearParam = params.get('year');
    const allMonthsParam = params.get('allMonths');
    
    if (monthParam) setSelectedMonth(parseInt(monthParam));
    if (yearParam) setSelectedYear(parseInt(yearParam));
    if (allMonthsParam === 'true') setShowAllMonths(true);
  }, []);

  // Update URL when state changes (but only if different from current URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentMonth = params.get('month');
    const currentYear = params.get('year');
    const currentAllMonths = params.get('allMonths') === 'true';

    // Only update if values have actually changed
    if (
      currentMonth !== String(selectedMonth) ||
      currentYear !== String(selectedYear) ||
      currentAllMonths !== showAllMonths
    ) {
      params.set('month', String(selectedMonth));
      params.set('year', String(selectedYear));
      if (showAllMonths) {
        params.set('allMonths', 'true');
      } else {
        params.delete('allMonths');
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [selectedMonth, selectedYear, showAllMonths, router, pathname]);

  return (
    <MonthYearContext.Provider
      value={{
        selectedMonth,
        selectedYear,
        showAllMonths,
        setSelectedMonth,
        setSelectedYear,
        setShowAllMonths,
      }}
    >
      {children}
    </MonthYearContext.Provider>
  );
}

export function useMonthYear() {
  const context = useContext(MonthYearContext);
  if (context === undefined) {
    throw new Error('useMonthYear must be used within a MonthYearProvider');
  }
  return context;
}
