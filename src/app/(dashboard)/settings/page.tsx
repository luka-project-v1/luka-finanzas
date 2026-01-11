'use client';

import { useState, useEffect } from 'react';
import { getBankAccounts, createBankAccount, updateBankAccount, deleteBankAccount } from '@/lib/actions/accounts';
import { getCreditCards, createCreditCard, updateCreditCard, deleteCreditCard } from '@/lib/actions/credits';
import { getLoansGiven, createLoanGiven, updateLoanGiven, deleteLoanGiven } from '@/lib/actions/credits';
import { getLoansReceived, createLoanReceived, updateLoanReceived, deleteLoanReceived } from '@/lib/actions/credits';
import { getOrCreateDefaultCurrencies } from '@/lib/actions/currencies';
import { formatCurrency } from '@/lib/utils/currency';

interface Account {
  id: string;
  name: string;
  bank_name: string | null;
  account_type: 'savings' | 'checking';
  currency_id: string;
  initial_balance: number;
  start_month: number | null;
  end_month: number | null;
  is_active: boolean;
  currencies?: {
    symbol: string;
    code: string;
  };
}

interface CreditCard {
  id: string;
  name: string;
  bank_name: string | null;
  credit_limit: number;
  currency_id: string;
  annual_interest_rate: number | null;
  maintenance_fee: number;
  maintenance_fee_frequency: string | null;
  closing_day: number | null;
  payment_due_day: number | null;
  start_month: number | null;
  end_month: number | null;
  is_active: boolean;
  currencies?: {
    symbol: string;
    code: string;
  };
}

interface LoanGiven {
  id: string;
  debtor_name: string;
  amount: number;
  currency_id: string;
  loan_date: string;
  due_date: string | null;
  interest_rate: number;
  start_month: number | null;
  end_month: number | null;
  currencies?: {
    symbol: string;
    code: string;
  };
}

interface LoanReceived {
  id: string;
  creditor_name: string;
  amount: number;
  currency_id: string;
  loan_date: string;
  due_date: string | null;
  interest_rate: number;
  start_month: number | null;
  end_month: number | null;
  currencies?: {
    symbol: string;
    code: string;
  };
}

type TabType = 'accounts' | 'credit_cards' | 'loans_given' | 'loans_received';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('accounts');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loansGiven, setLoansGiven] = useState<LoanGiven[]>([]);
  const [loansReceived, setLoansReceived] = useState<LoanReceived[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [accountsResult, cardsResult, loansGivenResult, loansReceivedResult, currenciesResult] = await Promise.all([
      getBankAccounts(),
      getCreditCards(),
      getLoansGiven(),
      getLoansReceived(),
      getOrCreateDefaultCurrencies(),
    ]);

    if (accountsResult.success && 'data' in accountsResult) {
      setAccounts(accountsResult.data as any);
    }
    if (cardsResult.success && 'data' in cardsResult) {
      setCreditCards(cardsResult.data as any);
    }
    if (loansGivenResult.success && 'data' in loansGivenResult) {
      setLoansGiven(loansGivenResult.data as any);
    }
    if (loansReceivedResult.success && 'data' in loansReceivedResult) {
      setLoansReceived(loansReceivedResult.data as any);
    }
    if (currenciesResult.success && 'data' in currenciesResult) {
      setCurrencies(currenciesResult.data as any);
    }
    setLoading(false);
  };

  const openNewModal = () => {
    setEditingItem(null);
    setError('');
    if (activeTab === 'accounts') {
      setFormData({
        name: '',
        bank_name: '',
        account_type: 'savings',
        currency_id: currencies[0]?.id || '',
        initial_balance: 0,
        start_month: null,
        end_month: null,
      });
    } else if (activeTab === 'credit_cards') {
      setFormData({
        name: '',
        bank_name: '',
        credit_limit: 0,
        currency_id: currencies[0]?.id || '',
        annual_interest_rate: null,
        maintenance_fee: 0,
        maintenance_fee_frequency: null,
        closing_day: null,
        payment_due_day: null,
        start_month: null,
        end_month: null,
      });
    } else if (activeTab === 'loans_given') {
      setFormData({
        debtor_name: '',
        amount: 0,
        currency_id: currencies[0]?.id || '',
        loan_date: new Date().toISOString().split('T')[0],
        due_date: null,
        interest_rate: 0,
        start_month: null,
        end_month: null,
      });
    } else if (activeTab === 'loans_received') {
      setFormData({
        creditor_name: '',
        amount: 0,
        currency_id: currencies[0]?.id || '',
        loan_date: new Date().toISOString().split('T')[0],
        due_date: null,
        interest_rate: 0,
        start_month: null,
        end_month: null,
      });
    }
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setError('');
    if (activeTab === 'accounts') {
      setFormData({
        name: item.name,
        bank_name: item.bank_name || '',
        account_type: item.account_type,
        currency_id: item.currency_id,
        initial_balance: Number(item.initial_balance),
        start_month: item.start_month,
        end_month: item.end_month,
      });
    } else if (activeTab === 'credit_cards') {
      setFormData({
        name: item.name,
        bank_name: item.bank_name || '',
        credit_limit: Number(item.credit_limit),
        currency_id: item.currency_id,
        annual_interest_rate: item.annual_interest_rate,
        maintenance_fee: Number(item.maintenance_fee),
        maintenance_fee_frequency: item.maintenance_fee_frequency,
        closing_day: item.closing_day,
        payment_due_day: item.payment_due_day,
        start_month: item.start_month,
        end_month: item.end_month,
      });
    } else if (activeTab === 'loans_given') {
      setFormData({
        debtor_name: item.debtor_name,
        amount: Number(item.amount),
        currency_id: item.currency_id,
        loan_date: item.loan_date,
        due_date: item.due_date || '',
        interest_rate: Number(item.interest_rate),
        start_month: item.start_month,
        end_month: item.end_month,
      });
    } else if (activeTab === 'loans_received') {
      setFormData({
        creditor_name: item.creditor_name,
        amount: Number(item.amount),
        currency_id: item.currency_id,
        loan_date: item.loan_date,
        due_date: item.due_date || '',
        interest_rate: Number(item.interest_rate),
        start_month: item.start_month,
        end_month: item.end_month,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      let result;
      if (activeTab === 'accounts') {
        if (editingItem) {
          result = await updateBankAccount(editingItem.id, formData);
        } else {
          result = await createBankAccount(formData);
        }
      } else if (activeTab === 'credit_cards') {
        if (editingItem) {
          result = await updateCreditCard(editingItem.id, formData);
        } else {
          result = await createCreditCard(formData);
        }
      } else if (activeTab === 'loans_given') {
        if (editingItem) {
          result = await updateLoanGiven(editingItem.id, formData);
        } else {
          result = await createLoanGiven(formData);
        }
      } else if (activeTab === 'loans_received') {
        if (editingItem) {
          result = await updateLoanReceived(editingItem.id, formData);
        } else {
          result = await createLoanReceived(formData);
        }
      }

      if (result && result.success) {
        setShowModal(false);
        setEditingItem(null);
        await loadData();
      } else if (result && 'error' in result) {
        setError(result.error);
      }
    } catch (err) {
      setError('Ocurrió un error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const itemName = activeTab === 'accounts' ? 'cuenta' : 
                     activeTab === 'credit_cards' ? 'tarjeta de crédito' :
                     activeTab === 'loans_given' ? 'préstamo dado' : 'préstamo recibido';
    
    if (!confirm(`¿Estás seguro de que quieres eliminar esta ${itemName}?`)) return;

    let result;
    if (activeTab === 'accounts') {
      result = await deleteBankAccount(id);
    } else if (activeTab === 'credit_cards') {
      result = await deleteCreditCard(id);
    } else if (activeTab === 'loans_given') {
      result = await deleteLoanGiven(id);
    } else if (activeTab === 'loans_received') {
      result = await deleteLoanReceived(id);
    }

    if (result && result.success) {
      await loadData();
    }
  };

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
      <div>
        <h1 className="text-4xl font-bold text-[#1A1A1A] mb-2">Configuración</h1>
        <p className="text-[#6B6B6B] text-lg">Gestiona tus cuentas, tarjetas de crédito y préstamos.</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-2 shadow-sm">
        <div className="flex gap-2">
          {[
            { id: 'accounts', name: 'Cuentas Bancarias' },
            { id: 'credit_cards', name: 'Tarjetas de Crédito' },
            { id: 'loans_given', name: 'Préstamos Dados' },
            { id: 'loans_received', name: 'Préstamos Recibidos' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#D97757] text-white shadow-sm'
                  : 'text-[#6B6B6B] hover:bg-[#F5F3EE]'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#1A1A1A]">
            {activeTab === 'accounts' && 'Cuentas Bancarias'}
            {activeTab === 'credit_cards' && 'Tarjetas de Crédito'}
            {activeTab === 'loans_given' && 'Préstamos Dados'}
            {activeTab === 'loans_received' && 'Préstamos Recibidos'}
          </h2>
          <button
            onClick={openNewModal}
            className="bg-[#D97757] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#C66647] transition-all shadow-sm hover:shadow-md flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar
          </button>
        </div>

        {/* List */}
        {activeTab === 'accounts' && (
          <div className="space-y-4">
            {accounts.length === 0 ? (
              <p className="text-[#6B6B6B] text-center py-8">No hay cuentas bancarias</p>
            ) : (
              accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 border border-[#E5E3DE] rounded-xl hover:bg-[#F5F3EE] transition-colors">
                  <div>
                    <h3 className="font-semibold text-[#1A1A1A]">{account.name}</h3>
                    <p className="text-sm text-[#6B6B6B]">
                      {account.bank_name && `${account.bank_name} • `}
                      {account.account_type === 'savings' ? 'Ahorros' : 'Corriente'} • {account.currencies?.code}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(account)}
                      className="p-2 text-[#6B6B6B] hover:text-[#D97757] transition-colors"
                      title="Editar cuenta"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="p-2 text-[#6B6B6B] hover:text-[#DC2626] transition-colors"
                      title="Eliminar cuenta"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'credit_cards' && (
          <div className="space-y-4">
            {creditCards.length === 0 ? (
              <p className="text-[#6B6B6B] text-center py-8">No hay tarjetas de crédito</p>
            ) : (
              creditCards.map((card) => (
                <div key={card.id} className="flex items-center justify-between p-4 border border-[#E5E3DE] rounded-xl hover:bg-[#F5F3EE] transition-colors">
                  <div>
                    <h3 className="font-semibold text-[#1A1A1A]">{card.name}</h3>
                    <p className="text-sm text-[#6B6B6B]">
                      {card.bank_name && `${card.bank_name} • `}
                      Límite: {formatCurrency(Number(card.credit_limit), card.currencies?.symbol || '$')} • {card.currencies?.code}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(card)}
                      className="p-2 text-[#6B6B6B] hover:text-[#D97757] transition-colors"
                      title="Editar tarjeta"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(card.id)}
                      className="p-2 text-[#6B6B6B] hover:text-[#DC2626] transition-colors"
                      title="Eliminar tarjeta"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'loans_given' && (
          <div className="space-y-4">
            {loansGiven.length === 0 ? (
              <p className="text-[#6B6B6B] text-center py-8">No hay préstamos dados</p>
            ) : (
              loansGiven.map((loan) => (
                <div key={loan.id} className="flex items-center justify-between p-4 border border-[#E5E3DE] rounded-xl hover:bg-[#F5F3EE] transition-colors">
                  <div>
                    <h3 className="font-semibold text-[#1A1A1A]">{loan.debtor_name}</h3>
                    <p className="text-sm text-[#6B6B6B]">
                      {formatCurrency(Number(loan.amount), loan.currencies?.symbol || '$')} • {loan.currencies?.code}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(loan)}
                      className="p-2 text-[#6B6B6B] hover:text-[#D97757] transition-colors"
                      title="Editar préstamo"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(loan.id)}
                      className="p-2 text-[#6B6B6B] hover:text-[#DC2626] transition-colors"
                      title="Eliminar préstamo"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'loans_received' && (
          <div className="space-y-4">
            {loansReceived.length === 0 ? (
              <p className="text-[#6B6B6B] text-center py-8">No hay préstamos recibidos</p>
            ) : (
              loansReceived.map((loan) => (
                <div key={loan.id} className="flex items-center justify-between p-4 border border-[#E5E3DE] rounded-xl hover:bg-[#F5F3EE] transition-colors">
                  <div>
                    <h3 className="font-semibold text-[#1A1A1A]">{loan.creditor_name}</h3>
                    <p className="text-sm text-[#6B6B6B]">
                      {formatCurrency(Number(loan.amount), loan.currencies?.symbol || '$')} • {loan.currencies?.code}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(loan)}
                      className="p-2 text-[#6B6B6B] hover:text-[#D97757] transition-colors"
                      title="Editar préstamo"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(loan.id)}
                      className="p-2 text-[#6B6B6B] hover:text-[#DC2626] transition-colors"
                      title="Eliminar préstamo"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-[#1A1A1A]/20 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white border-b border-[#E5E3DE] px-8 py-6 rounded-t-3xl z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-[#1A1A1A]">
                  {editingItem ? 'Editar' : 'Nueva'} {
                    activeTab === 'accounts' && 'Cuenta Bancaria'
                  }
                  {activeTab === 'credit_cards' && 'Tarjeta de Crédito'}
                  {activeTab === 'loans_given' && 'Préstamo Dado'}
                  {activeTab === 'loans_received' && 'Préstamo Recibido'}
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

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {error && (
                <div className="bg-[#DC2626]/10 text-[#DC2626] text-sm p-4 rounded-xl border border-[#DC2626]/20">
                  {error}
                </div>
              )}

              {/* Account Form */}
              {activeTab === 'accounts' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Nombre de la Cuenta</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Nombre del Banco (Opcional)</label>
                    <input
                      type="text"
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Tipo de Cuenta</label>
                      <select
                        value={formData.account_type}
                        onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                        className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                        required
                      >
                        <option value="savings">Ahorros</option>
                        <option value="checking">Corriente</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Moneda</label>
                      <select
                        value={formData.currency_id}
                        onChange={(e) => setFormData({ ...formData, currency_id: e.target.value })}
                        className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                        required
                      >
                        <option value="">Seleccionar moneda</option>
                        {currencies.map((currency) => (
                          <option key={currency.id} value={currency.id}>
                            {currency.code} - {currency.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Balance Inicial</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.initial_balance}
                      onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Mes de Inicio (Opcional)</label>
                      <select
                        value={formData.start_month || ''}
                        onChange={(e) => setFormData({ ...formData, start_month: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                      >
                        <option value="">Seleccionar mes</option>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                          <option key={m} value={m}>{['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][m-1]}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Mes de Fin (Opcional)</label>
                      <select
                        value={formData.end_month || ''}
                        onChange={(e) => setFormData({ ...formData, end_month: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                      >
                        <option value="">Seleccionar mes</option>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                          <option key={m} value={m}>{['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][m-1]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Credit Card Form */}
              {activeTab === 'credit_cards' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Nombre de la Tarjeta</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Banco (Opcional)</label>
                    <input
                      type="text"
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Límite de Crédito</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.credit_limit}
                        onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Moneda</label>
                      <select
                        value={formData.currency_id}
                        onChange={(e) => setFormData({ ...formData, currency_id: e.target.value })}
                        className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                        required
                      >
                        <option value="">Seleccionar moneda</option>
                        {currencies.map((currency) => (
                          <option key={currency.id} value={currency.id}>
                            {currency.code} - {currency.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Tasa de Interés Anual % (Opcional)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.annual_interest_rate || ''}
                        onChange={(e) => setFormData({ ...formData, annual_interest_rate: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Cuota de Mantenimiento</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.maintenance_fee}
                        onChange={(e) => setFormData({ ...formData, maintenance_fee: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Frecuencia Cuota Mantenimiento</label>
                      <select
                        value={formData.maintenance_fee_frequency || ''}
                        onChange={(e) => setFormData({ ...formData, maintenance_fee_frequency: e.target.value || null })}
                        className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                      >
                        <option value="">Ninguna</option>
                        <option value="monthly">Mensual</option>
                        <option value="annual">Anual</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Día de Cierre</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formData.closing_day || ''}
                        onChange={(e) => setFormData({ ...formData, closing_day: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Día de Pago</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formData.payment_due_day || ''}
                        onChange={(e) => setFormData({ ...formData, payment_due_day: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Mes de Inicio (Opcional)</label>
                      <select
                        value={formData.start_month || ''}
                        onChange={(e) => setFormData({ ...formData, start_month: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                      >
                        <option value="">Seleccionar mes</option>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                          <option key={m} value={m}>{['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][m-1]}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Mes de Fin (Opcional)</label>
                      <select
                        value={formData.end_month || ''}
                        onChange={(e) => setFormData({ ...formData, end_month: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                      >
                        <option value="">Seleccionar mes</option>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                          <option key={m} value={m}>{['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][m-1]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Loan Given Form */}
              {activeTab === 'loans_given' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Nombre del Deudor</label>
                    <input
                      type="text"
                      value={formData.debtor_name}
                      onChange={(e) => setFormData({ ...formData, debtor_name: e.target.value })}
                      className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Monto</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Moneda</label>
                      <select
                        value={formData.currency_id}
                        onChange={(e) => setFormData({ ...formData, currency_id: e.target.value })}
                        className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                        required
                      >
                        <option value="">Seleccionar moneda</option>
                        {currencies.map((currency) => (
                          <option key={currency.id} value={currency.id}>
                            {currency.code} - {currency.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Fecha del Préstamo</label>
                      <input
                        type="date"
                        value={formData.loan_date}
                        onChange={(e) => setFormData({ ...formData, loan_date: e.target.value })}
                        className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Fecha de Vencimiento (Opcional)</label>
                      <input
                        type="date"
                        value={formData.due_date || ''}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value || null })}
                        className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Tasa de Interés %</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.interest_rate}
                      onChange={(e) => setFormData({ ...formData, interest_rate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Mes de Inicio (Opcional)</label>
                      <select
                        value={formData.start_month || ''}
                        onChange={(e) => setFormData({ ...formData, start_month: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                      >
                        <option value="">Seleccionar mes</option>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                          <option key={m} value={m}>{['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][m-1]}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Mes de Fin (Opcional)</label>
                      <select
                        value={formData.end_month || ''}
                        onChange={(e) => setFormData({ ...formData, end_month: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                      >
                        <option value="">Seleccionar mes</option>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                          <option key={m} value={m}>{['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][m-1]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Loan Received Form */}
              {activeTab === 'loans_received' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Nombre del Acreedor</label>
                    <input
                      type="text"
                      value={formData.creditor_name}
                      onChange={(e) => setFormData({ ...formData, creditor_name: e.target.value })}
                      className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Monto</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Moneda</label>
                      <select
                        value={formData.currency_id}
                        onChange={(e) => setFormData({ ...formData, currency_id: e.target.value })}
                        className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                        required
                      >
                        <option value="">Seleccionar moneda</option>
                        {currencies.map((currency) => (
                          <option key={currency.id} value={currency.id}>
                            {currency.code} - {currency.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Fecha del Préstamo</label>
                      <input
                        type="date"
                        value={formData.loan_date}
                        onChange={(e) => setFormData({ ...formData, loan_date: e.target.value })}
                        className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Fecha de Vencimiento (Opcional)</label>
                      <input
                        type="date"
                        value={formData.due_date || ''}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value || null })}
                        className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Tasa de Interés %</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.interest_rate}
                      onChange={(e) => setFormData({ ...formData, interest_rate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Mes de Inicio (Opcional)</label>
                      <select
                        value={formData.start_month || ''}
                        onChange={(e) => setFormData({ ...formData, start_month: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                      >
                        <option value="">Seleccionar mes</option>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                          <option key={m} value={m}>{['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][m-1]}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Mes de Fin (Opcional)</label>
                      <select
                        value={formData.end_month || ''}
                        onChange={(e) => setFormData({ ...formData, end_month: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                      >
                        <option value="">Seleccionar mes</option>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                          <option key={m} value={m}>{['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][m-1]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#D97757] text-white py-4 px-6 rounded-xl font-semibold hover:bg-[#C66647] transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Guardando...' : editingItem ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-4 rounded-xl font-semibold text-[#6B6B6B] hover:bg-[#F5F3EE] transition-all"
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
