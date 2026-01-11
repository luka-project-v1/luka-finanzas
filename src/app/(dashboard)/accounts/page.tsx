'use client';

import { useState, useEffect } from 'react';
import { getBankAccounts, deleteBankAccount, setMonthlyInitialBalance } from '@/lib/actions/accounts';
import { getAccountTransactions } from '@/lib/actions/transactions';
import { getOrCreateDefaultCurrencies } from '@/lib/actions/currencies';
import { formatCurrency, formatCOP, convertToCOP, addAmounts, subtractAmounts } from '@/lib/utils/currency';
import { refreshExchangeRates } from '@/lib/actions/currencies';
import { formatDate } from '@/lib/utils/date';
import { useMonthYear } from '@/lib/contexts/MonthYearContext';

interface Account {
  id: string;
  name: string;
  bank_name: string | null;
  account_type: 'savings' | 'checking';
  current_balance: number;
  is_active: boolean;
  currencies?: {
    symbol: string;
    code: string;
    exchange_rate_to_preferred: number | null;
  };
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accountTransactions, setAccountTransactions] = useState<any[]>([]);
  const { selectedMonth, selectedYear } = useMonthYear();
  const [monthlyBalance, setMonthlyBalance] = useState(0);
  const [error, setError] = useState('');
  const [accountBalances, setAccountBalances] = useState<Record<string, { initial: number; final: number }>>({});

  useEffect(() => {
    loadAccounts();
    loadCurrencies();
  }, []);

  // Calculate balances for all accounts when month/year or accounts change
  useEffect(() => {
    const calculateAllBalances = async () => {
      if (accounts.length === 0) {
        setAccountBalances({});
        return;
      }

      const balances: Record<string, { initial: number; final: number }> = {};

      for (const account of accounts) {
        try {
          // Get initial balance for the month
          const currentMonthDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
          const accountMonthDate = (account as any).monthly_initial_balance_date 
            ? `${new Date((account as any).monthly_initial_balance_date).getFullYear()}-${String(new Date((account as any).monthly_initial_balance_date).getMonth() + 1).padStart(2, '0')}-01`
            : null;
          
          const hasInitialBalanceForMonth = (account as any).monthly_initial_balance && accountMonthDate === currentMonthDate;
          const initialBalance = hasInitialBalanceForMonth
            ? Number((account as any).monthly_initial_balance)
            : Number(account.current_balance);

          // Get transactions for the month
          const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
          const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
          const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
          
          const result = await getAccountTransactions(account.id, startDate, endDate);
          const transactions = (result.success && 'data' in result) ? result.data || [] : [];
          
          // Calculate final balance
          let finalBalance = initialBalance;
          transactions.forEach((tx: any) => {
            if (tx.is_paid && tx.account_id === account.id) {
              if (tx.transaction_type === 'income') {
                finalBalance = addAmounts(finalBalance, Number(tx.amount));
              } else {
                finalBalance = subtractAmounts(finalBalance, Number(tx.amount));
              }
            }
          });
          
          balances[account.id] = { initial: initialBalance, final: finalBalance };
        } catch (error) {
          console.error(`Error calculating balance for account ${account.id}:`, error);
        }
      }

      setAccountBalances(balances);
    };

    calculateAllBalances();
  }, [accounts, selectedMonth, selectedYear]);

  useEffect(() => {
    if (selectedAccount && showBalanceModal) {
      const loadData = async () => {
        const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
        const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
        const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        const result = await getAccountTransactions(selectedAccount.id, startDate, endDate);
        if (result.success && 'data' in result) {
          const txs = result.data || [];
          setAccountTransactions(txs);
          calculateMonthlyBalance(selectedAccount, txs);
        }
      };
      loadData();
    }
  }, [selectedAccount, selectedMonth, selectedYear, showBalanceModal]);

  const loadCurrencies = async () => {
    const result = await getOrCreateDefaultCurrencies();
    if (result.success && 'data' in result && result.data) {
      const currenciesData = result.data as any[];
      setCurrencies(currenciesData);
    }
  };

  const loadAccounts = async () => {
    setLoading(true);
    const result = await getBankAccounts();
    if (result.success && 'data' in result) {
      setAccounts(result.data as any);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta cuenta?')) return;

    const result = await deleteBankAccount(id);
    if (result.success) {
      await loadAccounts();
    }
  };

  const openBalanceModal = (account: Account) => {
    setSelectedAccount(account);
    setShowBalanceModal(true);
  };

  const loadAccountTransactions = async () => {
    if (!selectedAccount) return;

    const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const result = await getAccountTransactions(selectedAccount.id, startDate, endDate);
    if (result.success) {
      const txs = result.data || [];
      setAccountTransactions(txs);
      calculateMonthlyBalance(selectedAccount, txs);
    }
  };

  const calculateMonthlyBalance = (account: any, transactions: any[]) => {
    // Check if monthly_initial_balance_date corresponds to the selected month/year
    const currentMonthDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const accountMonthDate = account.monthly_initial_balance_date 
      ? `${new Date(account.monthly_initial_balance_date).getFullYear()}-${String(new Date(account.monthly_initial_balance_date).getMonth() + 1).padStart(2, '0')}-01`
      : null;
    
    // Use monthly_initial_balance only if it corresponds to the selected month/year
    const startingBalance = (account.monthly_initial_balance && accountMonthDate === currentMonthDate)
      ? Number(account.monthly_initial_balance) 
      : Number(account.current_balance);

    let balance = startingBalance;
    
    // Apply all paid transactions for this account in the selected month
    transactions.forEach((tx: any) => {
      if (tx.is_paid && tx.account_id === account.id) {
        if (tx.transaction_type === 'income') {
          balance = addAmounts(balance, Number(tx.amount));
        } else {
          balance = subtractAmounts(balance, Number(tx.amount));
        }
      }
    });

    setMonthlyBalance(balance);
  };

  const handleSetInitialBalance = async (balance: number) => {
    if (!selectedAccount) return;

    const date = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const result = await setMonthlyInitialBalance(selectedAccount.id, balance, date);
    
    if (result.success) {
      await loadAccounts();
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const txResult = await getAccountTransactions(selectedAccount.id, startDate, endDate);
      if (txResult.success && 'data' in txResult) {
        const txs = txResult.data || [];
        setAccountTransactions(txs);
        const updatedAccount = accounts.find(a => a.id === selectedAccount.id) || selectedAccount;
        calculateMonthlyBalance(updatedAccount, txs);
      }
    } else if ('error' in result) {
      setError(result.error || 'Error al establecer balance inicial');
    }
  };

  const calculatePreviousMonthBalance = async (account: Account): Promise<number | null> => {
    // Calculate previous month
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;

    // Get previous month's initial balance
    const prevMonthStartDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
    const prevMonthLastDay = new Date(prevYear, prevMonth, 0).getDate();
    const prevMonthEndDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevMonthLastDay).padStart(2, '0')}`;

    // Get transactions from previous month
    const result = await getAccountTransactions(account.id, prevMonthStartDate, prevMonthEndDate);
    if (!result.success || !('data' in result)) return null;

    const prevTransactions = result.data || [];
    
    // Get previous month's initial balance (if set) or use current balance as fallback
    const prevInitialBalance = (account as any).monthly_initial_balance 
      ? Number((account as any).monthly_initial_balance) 
      : Number(account.current_balance);

    // Calculate final balance of previous month
    let finalBalance = prevInitialBalance;
    prevTransactions.forEach((tx: any) => {
      if (tx.is_paid && tx.account_id === account.id) {
        if (tx.transaction_type === 'income') {
          finalBalance = addAmounts(finalBalance, Number(tx.amount));
        } else {
          finalBalance = subtractAmounts(finalBalance, Number(tx.amount));
        }
      }
    });

    return finalBalance;
  };

  const handleUsePreviousMonthBalance = async () => {
    if (!selectedAccount) return;

    const prevBalance = await calculatePreviousMonthBalance(selectedAccount);
    if (prevBalance !== null) {
      await handleSetInitialBalance(prevBalance);
    }
  };

  // Calculate total initial and final balances in COP
  const totalInitialBalanceCOP = accounts.reduce((sum, acc) => {
    const balance = accountBalances[acc.id]?.initial ?? Number(acc.current_balance);
    const exchangeRate = acc.currencies?.exchange_rate_to_preferred || 1;
    return sum + convertToCOP(balance, exchangeRate);
  }, 0);

  const totalFinalBalanceCOP = accounts.reduce((sum, acc) => {
    const balance = accountBalances[acc.id]?.final ?? Number(acc.current_balance);
    const exchangeRate = acc.currencies?.exchange_rate_to_preferred || 1;
    return sum + convertToCOP(balance, exchangeRate);
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[#6B6B6B]">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#1A1A1A] mb-2">Cuentas Bancarias</h1>
          <p className="text-[#6B6B6B] text-lg">Gestiona el balance inicial del mes para tus cuentas.</p>
        </div>
        <a
          href="/settings"
          className="bg-[#D97757] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#C66647] transition-all shadow-sm hover:shadow-md flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Configurar Cuentas
        </a>
      </div>

      {/* Total Balance Card */}
      <div className="bg-gradient-to-br from-[#D97757] to-[#C66647] rounded-2xl p-8 shadow-lg text-white">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium opacity-90 uppercase tracking-wider">Balance Total</p>
          <button
            onClick={async () => {
              await refreshExchangeRates();
              await loadAccounts();
            }}
            className="text-xs opacity-80 hover:opacity-100 underline group relative"
            title="Actualizar tasas de cambio desde la API"
            aria-label="Actualizar tasas de cambio"
          >
            Actualizar tasas
            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-[#1A1A1A] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Actualizar tasas de cambio desde la API
            </span>
          </button>
        </div>
        <div className="mb-4">
          <h2 className="text-5xl font-bold mb-2">{formatCOP(totalFinalBalanceCOP)}</h2>
          <div className="flex items-center gap-4 text-sm opacity-90">
            <div>
              <span className="opacity-75">Inicial: </span>
              <span className="font-semibold">{formatCOP(totalInitialBalanceCOP)}</span>
            </div>
            <div className="opacity-50">•</div>
            <div>
              <span className="opacity-75">Final: </span>
              <span className="font-semibold">{formatCOP(totalFinalBalanceCOP)}</span>
            </div>
          </div>
        </div>
        <p className="text-sm opacity-80">En {accounts.length} {accounts.length === 1 ? 'cuenta' : 'cuentas'} • En pesos colombianos</p>
      </div>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 shadow-sm text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-[#F5F3EE] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#6B6B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className="text-[#6B6B6B] mb-6 text-lg">Aún no hay cuentas</p>
            <a
              href="/settings"
              className="bg-[#D97757] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#C66647] transition-all shadow-sm inline-block"
            >
              Ir a Configuración
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <div key={account.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-xl text-[#1A1A1A] mb-1">{account.name}</h3>
                  {account.bank_name && (
                    <p className="text-sm text-[#6B6B6B]">{account.bank_name}</p>
                  )}
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  account.is_active 
                    ? 'bg-[#4CAF50]/10 text-[#4CAF50]' 
                    : 'bg-[#6B6B6B]/10 text-[#6B6B6B]'
                }`}>
                  {account.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              
              <div className="mb-3">
                <p className="text-4xl font-bold mb-1 text-[#1A1A1A]">
                  {formatCurrency(
                    accountBalances[account.id]?.final ?? Number(account.current_balance), 
                    account.currencies?.symbol || '$'
                  )}
                </p>
                <div className="flex items-center gap-3 text-sm text-[#6B6B6B]">
                  <div>
                    <span className="opacity-75">Inicial: </span>
                    <span className="font-semibold">
                      {formatCurrency(
                        accountBalances[account.id]?.initial ?? Number(account.current_balance), 
                        account.currencies?.symbol || '$'
                      )}
                    </span>
                  </div>
                  <div className="opacity-50">•</div>
                  <div>
                    <span className="opacity-75">Final: </span>
                    <span className="font-semibold">
                      {formatCurrency(
                        accountBalances[account.id]?.final ?? Number(account.current_balance), 
                        account.currencies?.symbol || '$'
                      )}
                    </span>
                  </div>
                </div>
                {account.currencies?.code !== 'COP' && account.currencies?.exchange_rate_to_preferred && (
                  <p className="text-sm text-[#6B6B6B] mt-2">
                    ≈ {formatCOP(convertToCOP(
                      accountBalances[account.id]?.final ?? Number(account.current_balance), 
                      account.currencies.exchange_rate_to_preferred
                    ))} COP
                  </p>
                )}
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[#6B6B6B] capitalize">
                  {account.account_type === 'savings' ? 'Ahorros' : 'Corriente'}
                </p>
                <p className="text-xs text-[#6B6B6B] font-medium uppercase tracking-wider">
                  {account.currencies?.code || 'USD'}
                </p>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => openBalanceModal(account)}
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-[#D97757] hover:bg-[#D97757]/10 transition-all flex items-center justify-center gap-2 border border-[#D97757]"
                  title="Ver historial y establecer balance inicial"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Ver Historial
                </button>
                <button
                  onClick={() => handleDelete(account.id)}
                  className="p-2.5 rounded-xl font-semibold text-[#DC2626] hover:bg-[#DC2626]/10 transition-all border border-[#DC2626]"
                  title="Eliminar esta cuenta bancaria"
                  aria-label="Eliminar cuenta bancaria"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Balance History Modal */}
      {showBalanceModal && selectedAccount && (
        <AccountBalanceModal
          account={accounts.find(a => a.id === selectedAccount.id) || selectedAccount}
          transactions={accountTransactions}
          monthlyBalance={monthlyBalance}
          onSetInitialBalance={handleSetInitialBalance}
          onClose={() => {
            setShowBalanceModal(false);
            setSelectedAccount(null);
            setAccountTransactions([]);
          }}
        />
      )}
    </div>
  );
}

// Account Balance Modal Component
function AccountBalanceModal({
  account,
  transactions,
  monthlyBalance,
  onSetInitialBalance,
  onClose,
  onCalculatePreviousMonthBalance,
}: any) {
  const { selectedMonth, selectedYear } = useMonthYear();
  
  // Check if monthly_initial_balance_date corresponds to the selected month/year
  const currentMonthDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
  const accountMonthDate = account.monthly_initial_balance_date 
    ? `${new Date(account.monthly_initial_balance_date).getFullYear()}-${String(new Date(account.monthly_initial_balance_date).getMonth() + 1).padStart(2, '0')}-01`
    : null;
  
  // Use monthly_initial_balance only if it corresponds to the selected month/year
  const initialBalance = (account.monthly_initial_balance && accountMonthDate === currentMonthDate)
    ? Number(account.monthly_initial_balance) 
    : Number(account.current_balance);
    
  const [showSetBalance, setShowSetBalance] = useState(false);
  const [newBalance, setNewBalance] = useState(initialBalance);

  const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const handleSetBalance = async () => {
    await onSetInitialBalance(newBalance);
    setShowSetBalance(false);
  };

  // Calculate balance: Balance Inicial + Ingresos - Gastos
  const calculatedBalance = (() => {
    // Use monthly_initial_balance only if it corresponds to the selected month/year
    const startBalance = (account.monthly_initial_balance && accountMonthDate === currentMonthDate)
      ? Number(account.monthly_initial_balance) 
      : Number(account.current_balance);
    
    let balance = startBalance;
    transactions.forEach((tx: any) => {
      if (tx.is_paid && tx.account_id === account.id) {
        if (tx.transaction_type === 'income') {
          balance = addAmounts(balance, Number(tx.amount));
        } else {
          balance = subtractAmounts(balance, Number(tx.amount));
        }
      }
    });
    return balance;
  })();

  const totalIncome = transactions
    .filter((tx: any) => tx.transaction_type === 'income' && tx.is_paid)
    .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

  const totalExpenses = transactions
    .filter((tx: any) => tx.transaction_type === 'expense' && tx.is_paid)
    .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-[#1A1A1A]/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="sticky top-0 bg-white border-b border-[#E5E3DE] px-8 py-6 rounded-t-3xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-[#1A1A1A] mb-2">{account.name}</h2>
              <p className="text-[#6B6B6B]">Historial de transacciones y balance del mes</p>
            </div>
            <button
              onClick={onClose}
              className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors p-2 hover:bg-[#F5F3EE] rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Balance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#F5F3EE] rounded-xl p-6">
              <p className="text-sm text-[#6B6B6B] mb-2">Balance Inicial del Mes</p>
              <p className="text-2xl font-bold text-[#1A1A1A]">
                {formatCurrency(initialBalance, account.currencies?.symbol || '$')}
              </p>
              {(account.monthly_initial_balance && accountMonthDate === currentMonthDate) ? (
                <button
                  onClick={() => {
                    setNewBalance(Number(account.monthly_initial_balance));
                    setShowSetBalance(true);
                  }}
                  className="mt-2 text-xs text-[#D97757] hover:underline"
                >
                  Editar balance inicial
                </button>
              ) : (
                <button
                  onClick={() => setShowSetBalance(true)}
                  className="mt-2 text-xs text-[#D97757] hover:underline"
                >
                  Establecer balance inicial
                </button>
              )}
            </div>
            <div className="bg-[#F5F3EE] rounded-xl p-6">
              <p className="text-sm text-[#6B6B6B] mb-2">Total Ingresos</p>
              <p className="text-2xl font-bold text-[#4CAF50]">
                +{formatCurrency(totalIncome, account.currencies?.symbol || '$')}
              </p>
            </div>
            <div className="bg-[#F5F3EE] rounded-xl p-6">
              <p className="text-sm text-[#6B6B6B] mb-2">Total Gastos</p>
              <p className="text-2xl font-bold text-[#DC2626]">
                -{formatCurrency(totalExpenses, account.currencies?.symbol || '$')}
              </p>
            </div>
          </div>

          {/* Calculated Balance */}
          <div className="bg-gradient-to-br from-[#D97757] to-[#C66647] rounded-xl p-6 text-white">
            <p className="text-sm opacity-90 mb-2">Balance Calculado del Mes</p>
            <p className="text-4xl font-bold">
              {formatCurrency(calculatedBalance, account.currencies?.symbol || '$')}
            </p>
            <p className="text-xs opacity-80 mt-2">
              Balance Inicial + Ingresos - Gastos
            </p>
          </div>

          {/* Transactions List */}
          <div>
            <h3 className="text-xl font-semibold text-[#1A1A1A] mb-4">
              Transacciones de {MONTHS[selectedMonth - 1]} {selectedYear}
            </h3>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-[#6B6B6B]">
                No hay transacciones en este mes
              </div>
            ) : (
              <div className="space-y-2">
                {transactions
                  .sort((a: any, b: any) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
                  .map((tx: any) => {
                    const amount = Number(tx.amount);
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-4 bg-[#F5F3EE] rounded-xl"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-[#1A1A1A]">
                            {tx.description || 'Sin descripción'}
                          </p>
                          <p className="text-sm text-[#6B6B6B]">
                            {formatDate(tx.transaction_date, 'd MMM yyyy')} • {tx.categories?.name || 'Sin categoría'}
                          </p>
                        </div>
                        <div className={`text-lg font-bold ${
                          tx.transaction_type === 'income' ? 'text-[#4CAF50]' : 'text-[#DC2626]'
                        }`}>
                          {tx.transaction_type === 'income' ? '+' : '−'}
                          {formatCurrency(amount, account.currencies?.symbol || '$')}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Set Initial Balance Modal */}
      {showSetBalance && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm"
            onClick={() => setShowSetBalance(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-[#1A1A1A] mb-4">Establecer Balance Inicial</h3>
            <p className="text-sm text-[#6B6B6B] mb-4">
              Este será el balance inicial para {MONTHS[selectedMonth - 1]} {selectedYear}
            </p>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Balance Inicial</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#6B6B6B] text-lg font-medium">
                  {account.currencies?.symbol || '$'}
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={newBalance}
                  onChange={(e) => setNewBalance(parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] text-lg font-medium transition-all"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleSetBalance}
                className="flex-1 bg-[#D97757] text-white py-3 px-6 rounded-xl font-semibold hover:bg-[#C66647] transition-all"
              >
                Establecer
              </button>
              <button
                onClick={() => setShowSetBalance(false)}
                className="px-6 py-3 rounded-xl font-semibold border-2 border-[#E5E3DE] text-[#6B6B6B] hover:bg-[#F5F3EE] transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
