'use client';

import { useState, useEffect } from 'react';
import { 
  getCreditCards, 
  createCreditCard, 
  updateCreditCard, 
  deleteCreditCard,
  getLoansGiven,
  createLoanGiven,
  updateLoanGiven,
  deleteLoanGiven,
  getLoansReceived,
  createLoanReceived,
  updateLoanReceived,
  deleteLoanReceived,
  setCreditCardMonthlyInitialBalance,
  getCreditCardTransactions,
} from '@/lib/actions/credits';
import { getOrCreateDefaultCurrencies } from '@/lib/actions/currencies';
import { formatCurrency, formatCOP, convertToCOP, addAmounts, subtractAmounts } from '@/lib/utils/currency';
import { getCurrentDate, formatDate } from '@/lib/utils/date';
import { useMonthYear } from '@/lib/contexts/MonthYearContext';

type TabType = 'credit_cards' | 'loans_given' | 'loans_received';

export default function CreditsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('credit_cards');
  const [creditCards, setCreditCards] = useState<any[]>([]);
  const [loansGiven, setLoansGiven] = useState<any[]>([]);
  const [loansReceived, setLoansReceived] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedCreditCard, setSelectedCreditCard] = useState<any | null>(null);
  const [creditCardTransactions, setCreditCardTransactions] = useState<any[]>([]);
  const { selectedMonth, selectedYear } = useMonthYear();
  const [monthlyBalance, setMonthlyBalance] = useState(0);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCreditCard && showBalanceModal) {
      const loadData = async () => {
        const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
        const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
        const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        const result = await getCreditCardTransactions(selectedCreditCard.id, startDate, endDate);
        if (result.success && 'data' in result) {
          const txs = result.data || [];
          setCreditCardTransactions(txs);
          calculateMonthlyBalance(selectedCreditCard, txs);
        }
      };
      loadData();
    }
  }, [selectedCreditCard, selectedMonth, selectedYear, showBalanceModal]);

  const loadData = async () => {
    setLoading(true);
    const [cardsResult, loansGivenResult, loansReceivedResult, currResult] = await Promise.all([
      getCreditCards(),
      getLoansGiven(),
      getLoansReceived(),
      getOrCreateDefaultCurrencies(),
    ]);

    if (cardsResult.success && 'data' in cardsResult) setCreditCards(cardsResult.data || []);
    if (loansGivenResult.success && 'data' in loansGivenResult) setLoansGiven(loansGivenResult.data || []);
    if (loansReceivedResult.success && 'data' in loansReceivedResult) setLoansReceived(loansReceivedResult.data || []);
    if (currResult.success && 'data' in currResult) {
      setCurrencies(currResult.data as any[]);
      if (currResult.data && (currResult.data as any[]).length > 0 && !formData.currency_id) {
        setFormData((prev: any) => ({ ...prev, currency_id: (currResult.data as any[])[0].id }));
      }
    }
    setLoading(false);
  };

  const openBalanceModal = (creditCard: any) => {
    setSelectedCreditCard(creditCard);
    setShowBalanceModal(true);
  };

  const calculateMonthlyBalance = (creditCard: any, transactions: any[]) => {
    // Use monthly_initial_balance if set, otherwise use current_balance as starting point
    const startingBalance = creditCard.monthly_initial_balance 
      ? Number(creditCard.monthly_initial_balance) 
      : Number(creditCard.current_balance);

    let balance = startingBalance;
    
    // Apply all paid transactions for this credit card in the selected month
    // For credit cards: payments reduce balance (paying off debt), charges increase balance
    transactions.forEach((tx: any) => {
      if (tx.is_paid && tx.credit_card_id === creditCard.id) {
        if (tx.account_id) {
          // Payment to credit card: reduce balance
          balance = subtractAmounts(balance, Number(tx.amount));
        } else {
          // Charge to credit card: increase balance (shouldn't happen with new logic, but keep for backwards compatibility)
          balance = addAmounts(balance, Number(tx.amount));
        }
      }
    });

    setMonthlyBalance(balance);
  };

  const handleSetInitialBalance = async (balance: number) => {
    if (!selectedCreditCard) return;

    const date = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const result = await setCreditCardMonthlyInitialBalance(selectedCreditCard.id, balance, date);
    
    if (result.success) {
      await loadData();
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const txResult = await getCreditCardTransactions(selectedCreditCard.id, startDate, endDate);
      if (txResult.success && 'data' in txResult) {
        const txs = txResult.data || [];
        setCreditCardTransactions(txs);
        const updatedCard = creditCards.find(c => c.id === selectedCreditCard.id) || selectedCreditCard;
        calculateMonthlyBalance(updatedCard, txs);
      }
    } else if ('error' in result) {
      setError(result.error || 'Error al establecer balance inicial');
    }
  };

  const calculatePreviousMonthBalance = async (creditCard: any): Promise<number | null> => {
    // Calculate previous month
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;

    // Get previous month's date range
    const prevMonthStartDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
    const prevMonthLastDay = new Date(prevYear, prevMonth, 0).getDate();
    const prevMonthEndDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevMonthLastDay).padStart(2, '0')}`;

    // Get transactions from previous month
    const result = await getCreditCardTransactions(creditCard.id, prevMonthStartDate, prevMonthEndDate);
    if (!result.success || !('data' in result)) return null;

    const prevTransactions = result.data || [];
    
    // Get previous month's initial balance (if set) or use current balance as fallback
    const prevInitialBalance = creditCard.monthly_initial_balance 
      ? Number(creditCard.monthly_initial_balance) 
      : Number(creditCard.current_balance);

    // Calculate final balance of previous month
    // For credit cards: payments reduce balance, charges increase balance
    let finalBalance = prevInitialBalance;
    prevTransactions.forEach((tx: any) => {
      if (tx.is_paid && tx.credit_card_id === creditCard.id) {
        if (tx.account_id) {
          // Payment to credit card: reduce balance
          finalBalance = subtractAmounts(finalBalance, Number(tx.amount));
        }
      }
    });

    return finalBalance;
  };

  const openNewModal = () => {
    setEditingItem(null);
    if (activeTab === 'credit_cards') {
      setFormData({
        name: '',
        bank_name: '',
        credit_limit: 0,
        current_balance: 0,
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
        loan_date: getCurrentDate(),
        due_date: null,
        interest_rate: 0,
        notes: '',
        start_month: null,
        end_month: null,
      });
    } else {
      setFormData({
        creditor_name: '',
        amount: 0,
        currency_id: currencies[0]?.id || '',
        loan_date: getCurrentDate(),
        due_date: null,
        interest_rate: 0,
        notes: '',
        start_month: null,
        end_month: null,
      });
    }
    setShowModal(true);
    setError('');
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      let result;
      if (activeTab === 'credit_cards') {
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
      } else {
        if (editingItem) {
          result = await updateLoanReceived(editingItem.id, formData);
        } else {
          result = await createLoanReceived(formData);
        }
      }

      if (result.success) {
        setShowModal(false);
        await loadData();
      } else {
        setError(result.error || 'Error al guardar');
      }
    } catch (err) {
      setError('Error inesperado');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este elemento?')) return;

    let result;
    if (activeTab === 'credit_cards') {
      result = await deleteCreditCard(id);
    } else if (activeTab === 'loans_given') {
      result = await deleteLoanGiven(id);
    } else {
      result = await deleteLoanReceived(id);
    }

    if (result.success) {
      await loadData();
    } else {
      alert(result.error || 'Error al eliminar');
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
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#1A1A1A] mb-2">Créditos y Deudas</h1>
          <p className="text-[#6B6B6B] text-lg">Gestiona tus tarjetas de crédito y préstamos.</p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-[#D97757] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#C66647] transition-all shadow-sm hover:shadow-md flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {activeTab === 'credit_cards' && 'Nueva Tarjeta'}
          {activeTab === 'loans_given' && 'Nuevo Préstamo Dado'}
          {activeTab === 'loans_received' && 'Nuevo Préstamo Recibido'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#E5E3DE]">
        <button
          onClick={() => setActiveTab('credit_cards')}
          className={`px-6 py-3 font-semibold transition-all border-b-2 ${
            activeTab === 'credit_cards'
              ? 'text-[#D97757] border-[#D97757]'
              : 'text-[#6B6B6B] border-transparent hover:text-[#1A1A1A]'
          }`}
        >
          Tarjetas de Crédito ({creditCards.length})
        </button>
        <button
          onClick={() => setActiveTab('loans_given')}
          className={`px-6 py-3 font-semibold transition-all border-b-2 ${
            activeTab === 'loans_given'
              ? 'text-[#D97757] border-[#D97757]'
              : 'text-[#6B6B6B] border-transparent hover:text-[#1A1A1A]'
          }`}
        >
          Préstamos Dados ({loansGiven.length})
        </button>
        <button
          onClick={() => setActiveTab('loans_received')}
          className={`px-6 py-3 font-semibold transition-all border-b-2 ${
            activeTab === 'loans_received'
              ? 'text-[#D97757] border-[#D97757]'
              : 'text-[#6B6B6B] border-transparent hover:text-[#1A1A1A]'
          }`}
        >
          Préstamos Recibidos ({loansReceived.length})
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm p-8">
        {activeTab === 'credit_cards' && (
          <CreditCardsList 
            creditCards={creditCards} 
            onEdit={openEditModal}
            onDelete={handleDelete}
            onViewHistory={openBalanceModal}
          />
        )}
        {activeTab === 'loans_given' && (
          <LoansGivenList 
            loans={loansGiven} 
            onEdit={openEditModal}
            onDelete={handleDelete}
          />
        )}
        {activeTab === 'loans_received' && (
          <LoansReceivedList 
            loans={loansReceived} 
            onEdit={openEditModal}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <CreditsModal
          activeTab={activeTab}
          editingItem={editingItem}
          formData={formData}
          setFormData={setFormData}
          currencies={currencies}
          error={error}
          submitting={submitting}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Balance History Modal */}
      {showBalanceModal && selectedCreditCard && (
        <CreditCardBalanceModal
          creditCard={creditCards.find(c => c.id === selectedCreditCard.id) || selectedCreditCard}
          transactions={creditCardTransactions}
          monthlyBalance={monthlyBalance}
          onSetInitialBalance={handleSetInitialBalance}
          onClose={() => {
            setShowBalanceModal(false);
            setSelectedCreditCard(null);
            setCreditCardTransactions([]);
          }}
        />
      )}
    </div>
  );
}

// Credit Cards List Component
function CreditCardsList({ creditCards, onEdit, onDelete, onViewHistory }: any) {
  if (creditCards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#6B6B6B] mb-6">Aún no hay tarjetas de crédito</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {creditCards.map((card: any) => {
        const availableCredit = Number(card.credit_limit) - Number(card.current_balance);
        const usagePercentage = (Number(card.current_balance) / Number(card.credit_limit)) * 100;
        const balanceCOP = card.currencies?.code !== 'COP' && card.currencies?.exchange_rate_to_preferred
          ? convertToCOP(Number(card.current_balance), card.currencies.exchange_rate_to_preferred)
          : Number(card.current_balance);

        return (
          <div key={card.id} className="bg-[#F5F3EE] rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-xl text-[#1A1A1A] mb-1">{card.name}</h3>
                {card.bank_name && (
                  <p className="text-sm text-[#6B6B6B]">{card.bank_name}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onViewHistory(card)}
                  className="p-2 text-[#D97757] hover:bg-[#D97757]/10 rounded-lg transition-all border border-[#D97757]"
                  title="Ver historial"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </button>
                <button
                  onClick={() => onEdit(card)}
                  className="p-2 text-[#D97757] hover:bg-[#D97757]/10 rounded-lg transition-all"
                  title="Editar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(card.id)}
                  className="p-2 text-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg transition-all"
                  title="Eliminar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-[#6B6B6B] mb-1">Balance Actual</p>
                <p className="text-2xl font-bold text-[#DC2626]">
                  {formatCurrency(Number(card.current_balance), card.currencies?.symbol || '$')}
                </p>
                {card.currencies?.code !== 'COP' && (
                  <p className="text-xs text-[#6B6B6B]">≈ {formatCOP(balanceCOP)} COP</p>
                )}
              </div>
              
              <div>
                <p className="text-xs text-[#6B6B6B] mb-1">Límite de Crédito</p>
                <p className="text-lg font-semibold text-[#1A1A1A]">
                  {formatCurrency(Number(card.credit_limit), card.currencies?.symbol || '$')}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#6B6B6B] mb-1">Crédito Disponible</p>
                <p className={`text-lg font-semibold ${availableCredit >= 0 ? 'text-[#4CAF50]' : 'text-[#DC2626]'}`}>
                  {formatCurrency(availableCredit, card.currencies?.symbol || '$')}
                </p>
              </div>

              <div>
                <div className="flex justify-between text-xs text-[#6B6B6B] mb-1">
                  <span>Uso de crédito</span>
                  <span>{usagePercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[#E5E3DE] rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      usagePercentage > 80 ? 'bg-[#DC2626]' : usagePercentage > 50 ? 'bg-[#F59E0B]' : 'bg-[#4CAF50]'
                    }`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  ></div>
                </div>
              </div>

              {card.closing_day && (
                <p className="text-xs text-[#6B6B6B]">Cierre: día {card.closing_day}</p>
              )}
              {card.payment_due_day && (
                <p className="text-xs text-[#6B6B6B]">Vencimiento: día {card.payment_due_day}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Loans Given List Component
function LoansGivenList({ loans, onEdit, onDelete }: any) {
  if (loans.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#6B6B6B] mb-6">Aún no hay préstamos dados</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loans.map((loan: any) => {
        const amountPaid = Number(loan.amount_paid);
        const totalAmount = Number(loan.amount);
        const remaining = totalAmount - amountPaid;
        const progressPercentage = (amountPaid / totalAmount) * 100;

        return (
          <div key={loan.id} className="border border-[#E5E3DE] rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-xl text-[#1A1A1A] mb-1">{loan.debtor_name}</h3>
                <p className="text-sm text-[#6B6B6B]">
                  Prestado: {formatCurrency(totalAmount, loan.currencies?.symbol || '$')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(loan)}
                  className="p-2 text-[#D97757] hover:bg-[#D97757]/10 rounded-lg transition-all"
                  title="Editar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(loan.id)}
                  className="p-2 text-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg transition-all"
                  title="Eliminar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[#6B6B6B]">Pagado:</span>
                <span className="font-semibold text-[#4CAF50]">
                  {formatCurrency(amountPaid, loan.currencies?.symbol || '$')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#6B6B6B]">Pendiente:</span>
                <span className="font-semibold text-[#DC2626]">
                  {formatCurrency(remaining, loan.currencies?.symbol || '$')}
                </span>
              </div>
              <div className="w-full bg-[#E5E3DE] rounded-full h-2">
                <div
                  className="bg-[#4CAF50] h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                ></div>
              </div>
              {loan.due_date && (
                <p className="text-xs text-[#6B6B6B]">
                  Vencimiento: {new Date(loan.due_date).toLocaleDateString('es-CO')}
                </p>
              )}
              {loan.is_fully_paid && (
                <span className="inline-block px-3 py-1 bg-[#4CAF50]/10 text-[#4CAF50] rounded-full text-xs font-medium">
                  Pagado completamente
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Loans Received List Component
function LoansReceivedList({ loans, onEdit, onDelete }: any) {
  if (loans.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#6B6B6B] mb-6">Aún no hay préstamos recibidos</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loans.map((loan: any) => {
        const amountPaid = Number(loan.amount_paid);
        const totalAmount = Number(loan.amount);
        const remaining = totalAmount - amountPaid;
        const progressPercentage = (amountPaid / totalAmount) * 100;

        return (
          <div key={loan.id} className="border border-[#E5E3DE] rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-xl text-[#1A1A1A] mb-1">{loan.creditor_name}</h3>
                <p className="text-sm text-[#6B6B6B]">
                  Deuda: {formatCurrency(totalAmount, loan.currencies?.symbol || '$')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(loan)}
                  className="p-2 text-[#D97757] hover:bg-[#D97757]/10 rounded-lg transition-all"
                  title="Editar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(loan.id)}
                  className="p-2 text-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg transition-all"
                  title="Eliminar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[#6B6B6B]">Pagado:</span>
                <span className="font-semibold text-[#4CAF50]">
                  {formatCurrency(amountPaid, loan.currencies?.symbol || '$')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#6B6B6B]">Pendiente:</span>
                <span className="font-semibold text-[#DC2626]">
                  {formatCurrency(remaining, loan.currencies?.symbol || '$')}
                </span>
              </div>
              <div className="w-full bg-[#E5E3DE] rounded-full h-2">
                <div
                  className="bg-[#4CAF50] h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                ></div>
              </div>
              {loan.due_date && (
                <p className="text-xs text-[#6B6B6B]">
                  Vencimiento: {new Date(loan.due_date).toLocaleDateString('es-CO')}
                </p>
              )}
              {loan.is_fully_paid && (
                <span className="inline-block px-3 py-1 bg-[#4CAF50]/10 text-[#4CAF50] rounded-full text-xs font-medium">
                  Pagado completamente
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Modal Component
function CreditsModal({ activeTab, editingItem, formData, setFormData, currencies, error, submitting, onSubmit, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-[#1A1A1A]/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="sticky top-0 bg-white border-b border-[#E5E3DE] px-8 py-6 rounded-t-3xl z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-[#1A1A1A]">
              {editingItem ? 'Editar' : 'Nueva'}{' '}
              {activeTab === 'credit_cards' && 'Tarjeta de Crédito'}
              {activeTab === 'loans_given' && 'Préstamo Dado'}
              {activeTab === 'loans_received' && 'Préstamo Recibido'}
            </h2>
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

        <form onSubmit={onSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-[#DC2626]/10 text-[#DC2626] text-sm p-4 rounded-xl border border-[#DC2626]/20">
              {error}
            </div>
          )}

          {activeTab === 'credit_cards' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Nombre de la Tarjeta</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                  placeholder="e.g., Visa Personal"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Banco (Opcional)</label>
                <input
                  type="text"
                  value={formData.bank_name || ''}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                  placeholder="e.g., Banco de Bogotá"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Límite de Crédito</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.credit_limit || 0}
                    onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Balance Actual</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.current_balance || 0}
                    onChange={(e) => setFormData({ ...formData, current_balance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Moneda</label>
                  <select
                    value={formData.currency_id || ''}
                    onChange={(e) => setFormData({ ...formData, currency_id: e.target.value })}
                    className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                    required
                  >
                    <option value="">Seleccionar moneda</option>
                    {currencies.map((currency: any) => (
                      <option key={currency.id} value={currency.id}>
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Tasa de Interés Anual (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.annual_interest_rate || ''}
                    onChange={(e) => setFormData({ ...formData, annual_interest_rate: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Día de Cierre (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.closing_day || ''}
                    onChange={(e) => setFormData({ ...formData, closing_day: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                    placeholder="15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Día de Vencimiento (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.payment_due_day || ''}
                    onChange={(e) => setFormData({ ...formData, payment_due_day: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                    placeholder="20"
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
                    <option value="1">Enero</option>
                    <option value="2">Febrero</option>
                    <option value="3">Marzo</option>
                    <option value="4">Abril</option>
                    <option value="5">Mayo</option>
                    <option value="6">Junio</option>
                    <option value="7">Julio</option>
                    <option value="8">Agosto</option>
                    <option value="9">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
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
                    <option value="1">Enero</option>
                    <option value="2">Febrero</option>
                    <option value="3">Marzo</option>
                    <option value="4">Abril</option>
                    <option value="5">Mayo</option>
                    <option value="6">Junio</option>
                    <option value="7">Julio</option>
                    <option value="8">Agosto</option>
                    <option value="9">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {(activeTab === 'loans_given' || activeTab === 'loans_received') && (
            <>
              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">
                  {activeTab === 'loans_given' ? 'Nombre del Deudor' : 'Nombre del Acreedor'}
                </label>
                <input
                  type="text"
                  value={formData[activeTab === 'loans_given' ? 'debtor_name' : 'creditor_name'] || ''}
                  onChange={(e) => setFormData({ ...formData, [activeTab === 'loans_given' ? 'debtor_name' : 'creditor_name']: e.target.value })}
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
                    value={formData.amount || 0}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Moneda</label>
                  <select
                    value={formData.currency_id || ''}
                    onChange={(e) => setFormData({ ...formData, currency_id: e.target.value })}
                    className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                    required
                  >
                    <option value="">Seleccionar moneda</option>
                    {currencies.map((currency: any) => (
                      <option key={currency.id} value={currency.id}>
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Fecha del Préstamo</label>
                  <input
                    type="date"
                    value={formData.loan_date || ''}
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
                <div>
                  <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Tasa de Interés (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.interest_rate || 0}
                    onChange={(e) => setFormData({ ...formData, interest_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] mb-3">Notas (Opcional)</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-4 rounded-xl border border-[#E5E3DE] focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all resize-none"
                  rows={3}
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
                    <option value="1">Enero</option>
                    <option value="2">Febrero</option>
                    <option value="3">Marzo</option>
                    <option value="4">Abril</option>
                    <option value="5">Mayo</option>
                    <option value="6">Junio</option>
                    <option value="7">Julio</option>
                    <option value="8">Agosto</option>
                    <option value="9">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
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
                    <option value="1">Enero</option>
                    <option value="2">Febrero</option>
                    <option value="3">Marzo</option>
                    <option value="4">Abril</option>
                    <option value="5">Mayo</option>
                    <option value="6">Junio</option>
                    <option value="7">Julio</option>
                    <option value="8">Agosto</option>
                    <option value="9">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
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
              {submitting ? 'Guardando...' : (editingItem ? 'Actualizar' : 'Guardar')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-4 rounded-xl font-semibold border-2 border-[#E5E3DE] text-[#6B6B6B] hover:bg-[#F5F3EE] transition-all"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Credit Card Balance Modal Component
function CreditCardBalanceModal({
  creditCard,
  transactions,
  monthlyBalance,
  onSetInitialBalance,
  onClose,
  onCalculatePreviousMonthBalance,
}: any) {
  const { selectedMonth, selectedYear } = useMonthYear();
  const initialBalance = creditCard.monthly_initial_balance 
    ? Number(creditCard.monthly_initial_balance) 
    : Number(creditCard.current_balance);
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

  // Calculate balance: Balance Inicial - Pagos (payments reduce debt)
  const calculatedBalance = (() => {
    const startBalance = creditCard.monthly_initial_balance 
      ? Number(creditCard.monthly_initial_balance) 
      : Number(creditCard.current_balance);
    
    let balance = startBalance;
    transactions.forEach((tx: any) => {
      if (tx.is_paid && tx.credit_card_id === creditCard.id) {
        if (tx.account_id) {
          // Payment to credit card: reduce balance (paying off debt)
          balance = subtractAmounts(balance, Number(tx.amount));
        }
      }
    });
    return balance;
  })();

  const totalPayments = transactions
    .filter((tx: any) => tx.is_paid && tx.credit_card_id === creditCard.id && tx.account_id)
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
              <h2 className="text-3xl font-bold text-[#1A1A1A] mb-2">{creditCard.name}</h2>
              <p className="text-[#6B6B6B]">Historial de pagos y balance del mes</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#F5F3EE] rounded-xl p-6">
              <p className="text-sm text-[#6B6B6B] mb-2">Balance Inicial del Mes</p>
              <p className="text-2xl font-bold text-[#1A1A1A]">
                {formatCurrency(initialBalance, creditCard.currencies?.symbol || '$')}
              </p>
              {creditCard.monthly_initial_balance && (
                <button
                  onClick={() => {
                    setNewBalance(Number(creditCard.monthly_initial_balance));
                    setShowSetBalance(true);
                  }}
                  className="mt-2 text-xs text-[#D97757] hover:underline"
                >
                  Editar balance inicial
                </button>
              )}
              {!creditCard.monthly_initial_balance && (
                <button
                  onClick={() => setShowSetBalance(true)}
                  className="mt-2 text-xs text-[#D97757] hover:underline"
                >
                  Establecer balance inicial
                </button>
              )}
            </div>
            <div className="bg-[#F5F3EE] rounded-xl p-6">
              <p className="text-sm text-[#6B6B6B] mb-2">Total Pagos del Mes</p>
              <p className="text-2xl font-bold text-[#4CAF50]">
                -{formatCurrency(totalPayments, creditCard.currencies?.symbol || '$')}
              </p>
            </div>
          </div>

          {/* Calculated Balance */}
          <div className="bg-gradient-to-br from-[#D97757] to-[#C66647] rounded-xl p-6 text-white">
            <p className="text-sm opacity-90 mb-2">Balance Calculado del Mes</p>
            <p className="text-4xl font-bold">
              {formatCurrency(calculatedBalance, creditCard.currencies?.symbol || '$')}
            </p>
            <p className="text-xs opacity-80 mt-2">
              Balance Inicial - Pagos
            </p>
          </div>

          {/* Transactions List */}
          <div>
            <h3 className="text-xl font-semibold text-[#1A1A1A] mb-4">
              Pagos de {MONTHS[selectedMonth - 1]} {selectedYear}
            </h3>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-[#6B6B6B]">
                No hay pagos en este mes
              </div>
            ) : (
              <div className="space-y-2">
                {transactions
                  .filter((tx: any) => tx.is_paid && tx.credit_card_id === creditCard.id && tx.account_id)
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
                            {tx.description || 'Pago de cuota'}
                          </p>
                          <p className="text-sm text-[#6B6B6B]">
                            {formatDate(tx.transaction_date, 'd MMM yyyy')} • Desde: {tx.bank_accounts?.name || 'Cuenta bancaria'}
                          </p>
                        </div>
                        <div className="text-lg font-bold text-[#4CAF50]">
                          -{formatCurrency(amount, creditCard.currencies?.symbol || '$')}
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
                  {creditCard.currencies?.symbol || '$'}
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
