'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTransactions, createTransaction, deleteTransaction, updateTransaction } from '@/lib/actions/transactions';
import { getBankAccounts } from '@/lib/actions/accounts';
import { getCreditCards } from '@/lib/actions/credits';
import { getOrCreateDefaultCategories } from '@/lib/actions/categories';
import { getOrCreateDefaultCurrencies } from '@/lib/actions/currencies';
import { formatCurrency, formatCOP, convertToCOP } from '@/lib/utils/currency';
import { formatDate, getCurrentDate } from '@/lib/utils/date';
import { useMonthYear } from '@/lib/contexts/MonthYearContext';

interface Transaction {
  id: string;
  transaction_type: 'income' | 'expense';
  amount: number;
  description: string | null;
  transaction_date: string;
  is_paid: boolean;
  categories: {
    name: string;
    color: string | null;
  };
  currencies: {
    symbol: string;
    exchange_rate_to_preferred: number | null;
  };
  bank_accounts?: {
    name: string;
  };
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [creditCards, setCreditCards] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'pending'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const { selectedMonth, selectedYear, showAllMonths } = useMonthYear();
  const [formData, setFormData] = useState({
    transaction_type: 'expense' as 'income' | 'expense',
    amount: 0,
    currency_id: '',
    category_id: '',
    account_id: '',
    credit_card_id: '',
    description: '',
    transaction_date: getCurrentDate(),
    is_paid: false,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    
    try {
      // Calculate date range if not showing all months
      let startDate: string | undefined;
      let endDate: string | undefined;
      
      if (!showAllMonths) {
        startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
        const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
        endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      }
      
      const [txResult, acctResult, cardsResult, catResult, currResult] = await Promise.all([
        getTransactions({ 
          limit: 1000, 
          startDate, 
          endDate 
        }),
        getBankAccounts(),
        getCreditCards(),
        getOrCreateDefaultCategories(),
        getOrCreateDefaultCurrencies(),
      ]);

      if (txResult.success && 'data' in txResult && txResult.data) {
        setTransactions(txResult.data.data as any);
      } else {
        setTransactions([]);
      }
      if (acctResult.success && 'data' in acctResult && acctResult.data) {
        setAccounts(acctResult.data as any);
      }
      if (cardsResult.success && 'data' in cardsResult && cardsResult.data) {
        setCreditCards(cardsResult.data as any);
      }
      if (catResult.success && 'data' in catResult && catResult.data) {
        setCategories(catResult.data as any);
      }
      if (currResult.success && 'data' in currResult && currResult.data) {
        const currenciesData = currResult.data as any[];
        setCurrencies(currenciesData);
        setFormData(prev => {
          if (currenciesData.length > 0 && !prev.currency_id) {
            return { ...prev, currency_id: currenciesData[0].id };
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, showAllMonths]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, filterType, searchTerm, selectedCategory]);

  const filterTransactions = () => {
    let filtered = [...transactions];

    if (filterType === 'income') {
      filtered = filtered.filter(t => t.transaction_type === 'income');
    } else if (filterType === 'expense') {
      filtered = filtered.filter(t => t.transaction_type === 'expense');
    } else if (filterType === 'pending') {
      filtered = filtered.filter(t => !t.is_paid);
    }

    if (selectedCategory) {
      filtered = filtered.filter(t => t.categories.name === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.categories.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.bank_accounts?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  };

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    
    const category = categories.find(c => c.name === transaction.categories.name);
    
    setFormData({
      transaction_type: transaction.transaction_type,
      amount: Number(transaction.amount),
      currency_id: currencies[0]?.id || '',
      category_id: category?.id || '',
      account_id: transaction.bank_accounts ? accounts.find(a => a.name === transaction.bank_accounts?.name)?.id || '' : '',
      credit_card_id: (transaction as any).credit_cards ? creditCards.find(c => c.name === (transaction as any).credit_cards?.name)?.id || '' : '',
      description: transaction.description || '',
      transaction_date: transaction.transaction_date,
      is_paid: transaction.is_paid,
    });
    
    setShowModal(true);
  };

  const openNewModal = () => {
    setEditingTransaction(null);
    setFormData({
      transaction_type: 'expense',
      amount: 0,
      currency_id: currencies[0]?.id || '',
      category_id: '',
      account_id: '',
      credit_card_id: '',
      description: '',
      transaction_date: getCurrentDate(),
      is_paid: false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      let result;
      
      if (editingTransaction) {
        result = await updateTransaction(editingTransaction.id, {
          ...formData,
          account_id: formData.account_id || null,
          credit_card_id: formData.credit_card_id || null,
        });
      } else {
        result = await createTransaction({
          ...formData,
          account_id: formData.account_id || null,
          credit_card_id: formData.credit_card_id || null,
        });
      }
      
      if (result.success) {
        setShowModal(false);
        setEditingTransaction(null);
        setFormData({
          transaction_type: 'expense',
          amount: 0,
          currency_id: currencies[0]?.id || '',
          category_id: '',
          account_id: '',
          credit_card_id: '',
          description: '',
          transaction_date: getCurrentDate(),
          is_paid: false,
        });
        await loadData();
      } else if ('error' in result) {
        setError(result.error);
      }
    } catch (err) {
      setError('Ocurrió un error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta transacción?')) return;

    const result = await deleteTransaction(id);
    if (result.success) {
      await loadData();
    }
  };

  const togglePaidStatus = async (transaction: Transaction) => {
    const result = await updateTransaction(transaction.id, {
      is_paid: !transaction.is_paid
    });
    if (result.success) {
      await loadData();
    }
  };

  const filteredCategories = categories.filter(
    (cat) => cat.type === formData.transaction_type
  );

  // Calculate totals in COP
  const totalIncomeCOP = filteredTransactions
    .filter(t => t.transaction_type === 'income' && t.is_paid)
    .reduce((sum, t) => {
      const amount = Number(t.amount);
      const exchangeRate = t.currencies?.exchange_rate_to_preferred || 1;
      return sum + convertToCOP(amount, exchangeRate);
    }, 0);
  
  const totalExpenseCOP = filteredTransactions
    .filter(t => t.transaction_type === 'expense' && t.is_paid)
    .reduce((sum, t) => {
      const amount = Number(t.amount);
      const exchangeRate = t.currencies?.exchange_rate_to_preferred || 1;
      return sum + convertToCOP(amount, exchangeRate);
    }, 0);

  const netFlowCOP = totalIncomeCOP - totalExpenseCOP;

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
          <h1 className="text-4xl font-bold text-[#1A1A1A] mb-2">Transacciones</h1>
          <p className="text-[#6B6B6B] text-lg">Tu narrativa financiera, simplificada y organizada.</p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-[#D97757] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#C66647] transition-all shadow-sm hover:shadow-md flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Transacción
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col gap-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B6B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar transacciones..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#E5E3DE] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 transition-all bg-white text-[#1A1A1A]"
                />
              </div>
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 rounded-xl border border-[#E5E3DE] focus:outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/20 bg-white text-[#1A1A1A] font-medium transition-all"
            >
              <option value="">Todas las Categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterType('all')}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
              filterType === 'all'
                ? 'bg-[#D97757] text-white shadow-sm'
                : 'text-[#6B6B6B] hover:bg-[#F5F3EE]'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
              filterType === 'income'
                ? 'bg-[#4CAF50] text-white shadow-sm'
                : 'text-[#6B6B6B] hover:bg-[#F5F3EE]'
            }`}
          >
            Ingresos
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
              filterType === 'expense'
                ? 'bg-[#DC2626] text-white shadow-sm'
                : 'text-[#6B6B6B] hover:bg-[#F5F3EE]'
            }`}
          >
            Gastos
          </button>
          <button
            onClick={() => setFilterType('pending')}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
              filterType === 'pending'
                ? 'bg-[#F59E0B] text-white shadow-sm'
                : 'text-[#6B6B6B] hover:bg-[#F5F3EE]'
            }`}
          >
            Pendientes
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <p className="text-sm font-medium text-[#6B6B6B] uppercase tracking-wider mb-2">Total Ingresos</p>
          <h3 className="text-4xl font-bold text-[#4CAF50]">{formatCOP(totalIncomeCOP)}</h3>
          <p className="text-xs text-[#6B6B6B] mt-1">En pesos colombianos</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <p className="text-sm font-medium text-[#6B6B6B] uppercase tracking-wider mb-2">Total Gastos</p>
          <h3 className="text-4xl font-bold text-[#DC2626]">{formatCOP(totalExpenseCOP)}</h3>
          <p className="text-xs text-[#6B6B6B] mt-1">En pesos colombianos</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <p className="text-sm font-medium text-[#6B6B6B] uppercase tracking-wider mb-2">Flujo Neto</p>
          <h3 className={`text-4xl font-bold ${netFlowCOP >= 0 ? 'text-[#4CAF50]' : 'text-[#DC2626]'}`}>
            {netFlowCOP >= 0 ? '+' : ''}{formatCOP(netFlowCOP)}
          </h3>
          <p className="text-xs text-[#6B6B6B] mt-1">En pesos colombianos</p>
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 shadow-sm text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-[#F5F3EE] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#6B6B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-[#6B6B6B] mb-6 text-lg">Aún no hay transacciones</p>
            <button
              onClick={openNewModal}
              className="bg-[#D97757] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#C66647] transition-all shadow-sm"
            >
              Agregar tu primera transacción
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F5F3EE]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Descripción</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Cuenta/Tarjeta</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E3DE]">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#F5F3EE]/50 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-[#1A1A1A] font-medium">
                      {formatDate(tx.transaction_date, 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-5 text-sm text-[#1A1A1A]">
                      {tx.description || '—'}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm">
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${tx.categories.color}15`,
                          color: tx.categories.color || '#6B6B6B',
                        }}
                      >
                        {tx.categories.name}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-[#6B6B6B]">
                      {(() => {
                        const creditCard = (tx as any).credit_cards?.name;
                        const account = tx.bank_accounts?.name;
                        if (creditCard && account) {
                          return (
                            <div className="flex flex-col">
                              <span className="font-medium text-[#1A1A1A]">Pago TC: {creditCard}</span>
                              <span className="text-xs text-[#6B6B6B]">Desde: {account}</span>
                            </div>
                          );
                        }
                        if (creditCard) {
                          return <span className="text-[#DC2626]">TC: {creditCard}</span>;
                        }
                        return account || '—';
                      })()}
                    </td>
                    <td className={`px-6 py-5 whitespace-nowrap text-sm text-right font-bold ${
                      tx.transaction_type === 'income' ? 'text-[#4CAF50]' : 'text-[#DC2626]'
                    }`}>
                      {tx.transaction_type === 'income' ? '+' : '−'}
                      {formatCurrency(Number(tx.amount), tx.currencies.symbol)}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Mark as Paid/Pending */}
                        <button
                          onClick={() => togglePaidStatus(tx)}
                          className={`p-2 rounded-lg transition-all group relative ${
                            tx.is_paid 
                              ? 'bg-[#4CAF50]/10 text-[#4CAF50] hover:bg-[#4CAF50]/20' 
                              : 'bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20'
                          }`}
                          title={tx.is_paid ? 'Marcar como pendiente' : 'Marcar como pagado'}
                          aria-label={tx.is_paid ? 'Marcar como pendiente' : 'Marcar como pagado'}
                        >
                          {tx.is_paid ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-[#1A1A1A] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            {tx.is_paid ? 'Marcar como pendiente' : 'Marcar como pagado'}
                          </span>
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => openEditModal(tx)}
                          className="p-2 rounded-lg text-[#D97757] hover:bg-[#D97757]/10 transition-all group relative"
                          title="Editar transacción"
                          aria-label="Editar transacción"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-[#1A1A1A] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            Editar transacción
                          </span>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-2 rounded-lg text-[#DC2626] hover:bg-[#DC2626]/10 transition-all group relative"
                          title="Eliminar transacción"
                          aria-label="Eliminar transacción"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-[#1A1A1A] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            Eliminar transacción
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-[#1A1A1A]/20 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white border-b border-[#E5E3DE] px-8 py-6 rounded-t-3xl z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-[#1A1A1A]">
                  {editingTransaction ? 'Editar Transacción' : 'Nueva Transacción'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors p-2 hover:bg-[#F5F3EE] rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {error && (
                <div className="bg-[#DC2626]/10 text-[#DC2626] text-sm p-4 rounded-xl border border-[#DC2626]/20">
                  {error}
                </div>
              )}

              {/* Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] mb-4">Tipo de Transacción</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, transaction_type: 'expense', category_id: '' })}
                    className={`py-4 px-6 rounded-xl font-semibold transition-all ${
                      formData.transaction_type === 'expense'
                        ? 'bg-[#DC2626] text-white shadow-md'
                        : 'border-2 border-[#E5E3DE] text-[#6B6B6B] hover:border-[#D97757] hover:bg-[#F5F3EE]'
                    }`}
                  >
                    Gasto
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, transaction_type: 'income', category_id: '' })}
                    className={`py-4 px-6 rounded-xl font-semibold transition-all ${
                      formData.transaction_type === 'income'
                        ? 'bg-[#4CAF50] text-white shadow-md'
                        : 'border-2 border-[#E5E3DE] text-[#6B6B6B] hover:border-[#D97757] hover:bg-[#F5F3EE]'
                    }`}
                  >
                    Ingreso
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Monto</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#6B6B6B] text-lg font-medium">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount || ''}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-10 pr-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] text-lg font-medium transition-all"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Fecha</label>
                  <input
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                    className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Categoría</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    {filteredCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Account or Credit Card Payment */}
                {formData.transaction_type === 'expense' ? (
                  <>
                    {/* First: Is this a credit card payment? */}
                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">
                        ¿Es un pago de cuota de tarjeta de crédito?
                      </label>
                      <select
                        value={formData.credit_card_id}
                        onChange={(e) => {
                          const newCreditCardId = e.target.value;
                          setFormData({ 
                            ...formData, 
                            credit_card_id: newCreditCardId,
                            // If selecting a credit card, require account selection
                            account_id: newCreditCardId ? (formData.account_id || '') : formData.account_id
                          });
                        }}
                        className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                      >
                        <option value="">No, es un gasto normal</option>
                        {creditCards.map((card) => (
                          <option key={card.id} value={card.id}>
                            Sí, pago de cuota: {card.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-[#6B6B6B] mt-2">
                        {formData.credit_card_id 
                          ? 'Selecciona la cuenta desde la que pagaste la tarjeta de crédito abajo'
                          : 'Si es un gasto normal, selecciona la cuenta bancaria abajo (opcional)'}
                      </p>
                    </div>

                    {/* Second: Account selection */}
                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">
                        {formData.credit_card_id 
                          ? 'Cuenta desde la que pagaste la tarjeta' 
                          : 'Cuenta Bancaria (Opcional)'}
                      </label>
                      <select
                        value={formData.account_id}
                        onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                        className={`w-full px-4 py-4 rounded-xl border ${
                          formData.credit_card_id && !formData.account_id
                            ? 'border-[#DC2626] focus:ring-[#DC2626]'
                            : 'border-[#E5E3DE] focus:ring-[#D97757]'
                        } focus:outline-none focus:ring-2 focus:border-transparent bg-white text-[#1A1A1A] transition-all`}
                        required={!!formData.credit_card_id}
                      >
                        <option value="">{formData.credit_card_id ? 'Selecciona una cuenta' : 'Ninguna'}</option>
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.name}
                          </option>
                        ))}
                      </select>
                      {formData.credit_card_id && !formData.account_id && (
                        <p className="text-xs text-[#DC2626] mt-1">
                          Debes seleccionar una cuenta bancaria para pagar la tarjeta de crédito
                        </p>
                      )}
                      {!formData.credit_card_id && (
                        <p className="text-xs text-[#6B6B6B] mt-1">
                          Opcional: Selecciona si este gasto afecta una cuenta bancaria
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  /* For income, just show account selection */
                  <div>
                    <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">
                      Cuenta Bancaria (Opcional)
                    </label>
                    <select
                      value={formData.account_id}
                      onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                      className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                    >
                      <option value="">Ninguna</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-[#6B6B6B] mt-1">
                      Opcional: Selecciona si este ingreso afecta una cuenta bancaria
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all resize-none"
                  rows={3}
                  placeholder="¿Para qué fue esto?"
                />
              </div>

              {/* Mark as paid */}
              <div className="flex items-center bg-[#F5F3EE] rounded-xl p-4">
                <input
                  type="checkbox"
                  id="is_paid"
                  checked={formData.is_paid}
                  onChange={(e) => setFormData({ ...formData, is_paid: e.target.checked })}
                  className="w-5 h-5 rounded border-[#E5E3DE] text-[#D97757] focus:ring-[#D97757]"
                />
                <label htmlFor="is_paid" className="ml-3 text-sm font-medium text-[#1A1A1A]">
                  Marcar como pagado
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#D97757] text-white py-4 px-6 rounded-xl font-semibold hover:bg-[#C66647] transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (editingTransaction ? 'Actualizando...' : 'Creando...') : (editingTransaction ? 'Actualizar Transacción' : 'Guardar Transacción')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-8 py-4 rounded-xl font-semibold border-2 border-[#E5E3DE] text-[#6B6B6B] hover:bg-[#F5F3EE] transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
