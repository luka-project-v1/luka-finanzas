'use client';

import { useState } from 'react';

interface MonthYearSelectorProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthYearChange: (month: number, year: number) => void;
  showAllMonths?: boolean;
  onShowAllChange?: (showAll: boolean) => void;
  showAllMonthsOption?: boolean;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function MonthYearSelector({
  selectedMonth,
  selectedYear,
  onMonthYearChange,
  showAllMonths = false,
  onShowAllChange,
  showAllMonthsOption = false,
}: MonthYearSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handleMonthSelect = (month: number) => {
    onMonthYearChange(month, selectedYear);
    setIsOpen(false);
  };

  const handleYearSelect = (year: number) => {
    onMonthYearChange(selectedMonth, year);
  };

  const handlePreviousMonth = () => {
    let newMonth = selectedMonth - 1;
    let newYear = selectedYear;
    
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    
    onMonthYearChange(newMonth, newYear);
  };

  const handleNextMonth = () => {
    let newMonth = selectedMonth + 1;
    let newYear = selectedYear;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    
    onMonthYearChange(newMonth, newYear);
  };

  return (
    <div className="flex items-center gap-4">
      {showAllMonthsOption && showAllMonths && onShowAllChange && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showAllMonths}
            onChange={(e) => onShowAllChange(e.target.checked)}
            className="w-4 h-4 rounded border-[#E5E3DE] text-[#D97757] focus:ring-[#D97757]"
          />
          <span className="text-sm text-[#6B6B6B]">Mostrar todos los meses</span>
        </label>
      )}
      
      {!showAllMonths && (
        <>
          <button
            onClick={handlePreviousMonth}
            className="p-2 rounded-lg text-[#6B6B6B] hover:bg-[#F5F3EE] transition-colors"
            title="Mes anterior"
            aria-label="Mes anterior"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="px-6 py-3 rounded-xl border-2 border-[#E5E3DE] bg-white text-[#1A1A1A] font-semibold hover:border-[#D97757] transition-all flex items-center gap-2 min-w-[200px] justify-between"
            >
              <span>{MONTHS[selectedMonth - 1]} {selectedYear}</span>
              <svg 
                className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-[#E5E3DE] z-20 min-w-[200px] overflow-hidden">
                  <div className="p-4 border-b border-[#E5E3DE]">
                    <label className="block text-xs font-semibold text-[#6B6B6B] mb-2 uppercase tracking-wider">
                      Año
                    </label>
                    <div className="flex gap-2">
                      {years.map((year) => (
                        <button
                          key={year}
                          onClick={() => handleYearSelect(year)}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
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
                  <div className="p-4">
                    <label className="block text-xs font-semibold text-[#6B6B6B] mb-2 uppercase tracking-wider">
                      Mes
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {MONTHS.map((month, index) => (
                        <button
                          key={index}
                          onClick={() => handleMonthSelect(index + 1)}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
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
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg text-[#6B6B6B] hover:bg-[#F5F3EE] transition-colors"
            title="Mes siguiente"
            aria-label="Mes siguiente"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
