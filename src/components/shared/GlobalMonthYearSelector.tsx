'use client';

import { useState } from 'react';
import { useMonthYear } from '@/lib/contexts/MonthYearContext';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function GlobalMonthYearSelector() {
  const { selectedMonth, selectedYear, showAllMonths, setSelectedMonth, setSelectedYear, setShowAllMonths } = useMonthYear();
  const [isOpen, setIsOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
    setSelectedYear(selectedYear);
    setShowAllMonths(false);
    setIsOpen(false);
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setShowAllMonths(false);
  };

  const handlePreviousMonth = () => {
    let newMonth = selectedMonth - 1;
    let newYear = selectedYear;
    
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    setShowAllMonths(false);
  };

  const handleNextMonth = () => {
    let newMonth = selectedMonth + 1;
    let newYear = selectedYear;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    setShowAllMonths(false);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={handlePreviousMonth}
          className="p-1.5 rounded-md text-[#6B6B6B] hover:bg-[#F5F3EE] hover:text-[#1A1A1A] transition-colors"
          title="Mes anterior"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="relative flex-1">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-[#F5F3EE] transition-colors flex items-center justify-between"
          >
            <span>{showAllMonths ? 'Todos los meses' : `${MONTHS[selectedMonth - 1]} ${selectedYear}`}</span>
            <svg 
              className={`w-4 h-4 text-[#6B6B6B] transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && (
            <>
              <div 
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-[#E5E3DE] z-20 w-full overflow-hidden">
                <div className="p-3 border-b border-[#E5E3DE]">
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-2">
                    Año
                  </label>
                  <div className="flex gap-1.5">
                    {years.map((year) => (
                      <button
                        key={year}
                        onClick={() => handleYearSelect(year)}
                        className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                          selectedYear === year
                            ? 'bg-[#D97757] text-white'
                            : 'bg-[#F5F3EE] text-[#6B6B6B] hover:bg-[#E5E3DE]'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-3">
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-2">
                    Mes
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {MONTHS.map((month, index) => (
                      <button
                        key={index}
                        onClick={() => handleMonthSelect(index + 1)}
                        className={`py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                          selectedMonth === index + 1
                            ? 'bg-[#D97757] text-white'
                            : 'bg-[#F5F3EE] text-[#6B6B6B] hover:bg-[#E5E3DE]'
                        }`}
                      >
                        {month.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-3 border-t border-[#E5E3DE]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showAllMonths}
                      onChange={(e) => setShowAllMonths(e.target.checked)}
                      className="w-4 h-4 rounded border-[#E5E3DE] text-[#D97757] focus:ring-[#D97757]"
                    />
                    <span className="text-xs text-[#6B6B6B]">Mostrar todos los meses</span>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        <button
          onClick={handleNextMonth}
          className="p-1.5 rounded-md text-[#6B6B6B] hover:bg-[#F5F3EE] hover:text-[#1A1A1A] transition-colors"
          title="Mes siguiente"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
