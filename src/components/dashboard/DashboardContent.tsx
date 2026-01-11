'use client';

import { useState, useEffect } from 'react';
import { getTransactionsSummary, getTransactions } from '@/lib/actions/transactions';
import { formatCurrency, formatCOP, convertToCOP } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import Link from 'next/link';
import { useMonthYear } from '@/lib/contexts/MonthYearContext';

interface DashboardContentProps {
  initialAccounts: any[];
  initialRecentTransactions: any[];
}

export default function DashboardContent({ 
  initialAccounts, 
  initialRecentTransactions 
}: DashboardContentProps) {
  const { selectedMonth, selectedYear, showAllMonths } = useMonthYear();
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [lastMonthSummary, setLastMonthSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [monthlyTransactions, setMonthlyTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!showAllMonths) {
      loadMonthData();
    }
  }, [selectedMonth, selectedYear, showAllMonths]);

  const loadMonthData = async () => {
    setLoading(true);
    
    // Calculate date ranges
    const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
    // Previous month
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    const lastMonthStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
    const lastMonthLastDay = new Date(prevYear, prevMonth, 0).getDate();
    const lastMonthEnd = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(lastMonthLastDay).padStart(2, '0')}`;

    const [summaryResult, lastMonthSummaryResult, monthlyTransactionsResult] = await Promise.all([
      getTransactionsSummary(startDate, endDate),
      getTransactionsSummary(lastMonthStart, lastMonthEnd),
      getTransactions({ startDate, endDate, limit: 100 }),
    ]);

    if (summaryResult.success) {
      setSummary(summaryResult.data);
    }
    if (lastMonthSummaryResult.success) {
      setLastMonthSummary(lastMonthSummaryResult.data);
    }
    if (monthlyTransactionsResult.success && monthlyTransactionsResult.data?.data) {
      setMonthlyTransactions(monthlyTransactionsResult.data.data as any[]);
    }

    setLoading(false);
  };

  // Calculate total balance in COP
  const totalBalanceCOP = initialAccounts.reduce((sum, acc: any) => {
    const balance = Number(acc.current_balance);
    const exchangeRate = acc.currencies?.exchange_rate_to_preferred || 1;
    return sum + convertToCOP(balance, exchangeRate);
  }, 0);

  // Calculate percentage change from last month
  const lastMonthBalance = lastMonthSummary.balance || 0;
  const currentMonthBalance = summary.balance || 0;
  const percentageChange = lastMonthBalance !== 0 
    ? ((currentMonthBalance - lastMonthBalance) / Math.abs(lastMonthBalance)) * 100 
    : 0;

  // Calculate weekly expenses for chart
  const weeklyExpenses = [0, 0, 0, 0];
  monthlyTransactions.forEach((tx: any) => {
    if (tx.transaction_type === 'expense' && tx.is_paid) {
      const txDate = new Date(tx.transaction_date);
      const weekOfMonth = Math.floor((txDate.getDate() - 1) / 7);
      if (weekOfMonth >= 0 && weekOfMonth < 4) {
        const amount = Number(tx.amount);
        const exchangeRate = tx.currencies?.exchange_rate_to_preferred || 1;
        weeklyExpenses[weekOfMonth] += convertToCOP(amount, exchangeRate);
      }
    }
  });

  const maxExpense = Math.max(...weeklyExpenses, 1);
  const weeklyHeights = weeklyExpenses.map(exp => (exp / maxExpense) * 100);

  const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">
          {showAllMonths ? 'Resumen General' : `${MONTHS[selectedMonth - 1]} ${selectedYear}`}
        </h1>
        <p className="text-[#6B6B6B]">
          {showAllMonths ? 'Resumen financiero de todos los meses' : 'Resumen financiero del mes'}
        </p>
      </div>

      {/* Hero Section - Total Net Worth */}
      <div className="text-center">
        <p className="text-sm font-medium tracking-wider text-[#6B6B6B] mb-4 uppercase">
          Patrimonio Neto Total
        </p>
        <h2 className="text-7xl font-bold text-[#1A1A1A] mb-6 tracking-tight">
          {formatCOP(totalBalanceCOP)}
        </h2>
        <p className="text-sm text-[#6B6B6B] mb-4">En pesos colombianos</p>
        {percentageChange !== 0 && (
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            percentageChange >= 0 ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <svg className={`w-4 h-4 ${percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {percentageChange >= 0 ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              )}
            </svg>
            <span className={`text-sm font-medium ${percentageChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {percentageChange >= 0 ? '+' : ''}{percentageChange % 1 === 0 ? percentageChange : percentageChange.toFixed(1)}% desde el mes pasado
            </span>
          </div>
        )}
      </div>

      {/* Monthly Spending Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-[#1A1A1A]">Gastos Mensuales</h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-[#6B6B6B]">Cargando...</p>
            </div>
          ) : (
            <>
              <h3 className="text-5xl font-bold text-[#1A1A1A] mb-12">
                {formatCOP(summary.totalExpense)}
              </h3>
              <p className="text-sm text-[#6B6B6B] mb-4">En pesos colombianos</p>

              {/* Weekly expenses chart */}
              <div className="h-48 flex items-end gap-4">
                {weeklyHeights.map((height, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-gradient-to-t from-[#D97757] to-[#F5B89F] rounded-t-lg opacity-80 transition-all hover:opacity-100" 
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={`Semana ${i + 1}: ${formatCOP(weeklyExpenses[i])}`}
                  ></div>
                ))}
              </div>
              <div className="flex justify-between mt-4 text-sm text-[#6B6B6B]">
                <span>Semana 1</span>
                <span>Semana 2</span>
                <span>Semana 3</span>
                <span>Semana 4</span>
              </div>
            </>
          )}
        </div>

        {/* Bank Accounts Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A]">Cuentas Bancarias</h2>
            <Link 
              href="/accounts"
              className="text-sm font-medium text-[#D97757] hover:text-[#C66647] transition-colors"
            >
              Ver todas
            </Link>
          </div>

          {initialAccounts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#6B6B6B] mb-6">Aún no hay cuentas</p>
              <Link
                href="/accounts"
                className="inline-block bg-[#D97757] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#C66647] transition-colors"
              >
                Agregar tu primera cuenta
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {initialAccounts.slice(0, 2).map((account: any) => (
                <div key={account.id} className="p-6 bg-[#F5F3EE] rounded-xl">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs font-medium text-[#6B6B6B] uppercase mb-1">
                        {account.name}
                      </p>
                      {account.bank_name && (
                        <p className="text-sm text-[#6B6B6B]">{account.bank_name}</p>
                      )}
                    </div>
                    <div className="w-10 h-10 bg-[#D97757] rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-[#1A1A1A]">
                    {formatCurrency(Number(account.current_balance), account.currencies?.symbol || '$')}
                  </h3>
                  {account.currencies?.code !== 'COP' && account.currencies?.exchange_rate_to_preferred && (
                    <p className="text-sm text-[#6B6B6B] mt-1">
                      ≈ {formatCOP(convertToCOP(Number(account.current_balance), account.currencies.exchange_rate_to_preferred))} COP
                    </p>
                  )}
                  <p className="text-xs text-[#6B6B6B] mt-2">
                    {account.account_type === 'savings' ? 'Ahorros' : 'Corriente'} • {account.currencies?.code || 'USD'}
                  </p>
                </div>
              ))}

              {initialAccounts.length > 2 && (
                <Link 
                  href="/accounts"
                  className="w-full flex items-center justify-center gap-2 py-4 text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors rounded-xl hover:bg-[#F5F3EE]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium">Ver todas las cuentas</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-[#1A1A1A]">Transacciones Recientes</h2>
          <Link 
            href="/transactions"
            className="text-sm font-medium text-[#D97757] hover:text-[#C66647] transition-colors"
          >
            Ver todas
          </Link>
        </div>

        {initialRecentTransactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#6B6B6B] mb-6">Aún no hay transacciones</p>
            <Link
              href="/transactions"
              className="inline-block bg-[#D97757] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#C66647] transition-colors"
            >
              Agregar tu primera transacción
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {initialRecentTransactions.map((tx: any) => {
              const amount = Number(tx.amount);
              const exchangeRate = tx.currencies?.exchange_rate_to_preferred || 1;
              const amountInCOP = convertToCOP(amount, exchangeRate);
              
              return (
                <Link
                  key={tx.id}
                  href="/transactions"
                  className="flex items-center gap-4 p-4 hover:bg-[#F5F3EE] rounded-xl transition-colors cursor-pointer"
                >
                  <div 
                    className="w-12 h-12 flex items-center justify-center text-xl bg-[#FFF5F0] rounded-xl"
                    style={{ backgroundColor: `${tx.categories?.color || '#D97757'}15` }}
                  >
                    {tx.categories?.icon || (tx.transaction_type === 'income' ? '💰' : '💸')}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-[#1A1A1A] mb-1">
                      {tx.description || 'Sin descripción'}
                    </h4>
                    <p className="text-sm text-[#6B6B6B]">
                      {formatDate(tx.transaction_date, 'd MMM yyyy')} • {tx.categories?.name || 'Sin categoría'}
                    </p>
                  </div>
                  <div className={`text-xl font-bold ${tx.transaction_type === 'income' ? 'text-[#4CAF50]' : 'text-[#DC2626]'}`}>
                    {tx.transaction_type === 'income' ? '+' : '−'}
                    {formatCOP(amountInCOP)}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
