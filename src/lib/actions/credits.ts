'use server';

import { revalidatePath } from 'next/cache';
import { creditCardRepository } from '@/lib/repositories/credit-card-repository';
import { loanRepository } from '@/lib/repositories/loan-repository';
import { transactionRepository } from '@/lib/repositories/transaction-repository';
import { createCreditCardSchema, updateCreditCardSchema } from '@/lib/validations/credit-card-schema';
import { 
  createLoanGivenSchema, 
  updateLoanGivenSchema,
  createLoanReceivedSchema,
  updateLoanReceivedSchema,
  createLoanPaymentSchema
} from '@/lib/validations/loan-schema';
import { createClient } from '@/lib/supabase/server';
import type { CreditCard } from '@/lib/repositories/credit-card-repository';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

// Credit Cards
export async function createCreditCard(data: unknown): Promise<ActionResult<CreditCard>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const validated = createCreditCardSchema.parse(data);
    
    // Separate account data from credit card details
    const { issuer, bank_name, last4, credit_limit, management_fee, management_fee_period,
            interest_rate_annual, interest_rate_monthly, billing_cycle_day, payment_due_day,
            last_statement_date, ...accountData } = validated;

    const creditCard = await creditCardRepository.create({
      account: {
        ...accountData,
        user_id: user.id,
      },
      details: {
        issuer,
        bank_name,
        last4,
        credit_limit,
        management_fee,
        management_fee_period,
        interest_rate_annual,
        interest_rate_monthly,
        billing_cycle_day,
        payment_due_day,
        last_statement_date,
      },
    });

    revalidatePath('/credits');
    return { success: true, data: creditCard };
  } catch (error) {
    console.error('Error creating credit card:', error);
    if (error instanceof Error && 'issues' in error) {
      return { success: false, error: 'Error de validación', details: error };
    }
    return { success: false, error: 'Error al crear tarjeta de crédito' };
  }
}

export async function updateCreditCard(
  id: string,
  data: unknown
): Promise<ActionResult<CreditCard>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const validated = updateCreditCardSchema.parse(data);
    
    // Separate account updates from details updates
    const { issuer, bank_name, last4, credit_limit, management_fee, management_fee_period,
            interest_rate_annual, interest_rate_monthly, billing_cycle_day, payment_due_day,
            last_statement_date, ...accountUpdates } = validated;

    const creditCard = await creditCardRepository.update(id, user.id, {
      account: accountUpdates,
      details: {
        issuer,
        bank_name,
        last4,
        credit_limit,
        management_fee,
        management_fee_period,
        interest_rate_annual,
        interest_rate_monthly,
        billing_cycle_day,
        payment_due_day,
        last_statement_date,
      },
    });

    revalidatePath('/credits');
    return { success: true, data: creditCard };
  } catch (error) {
    console.error('Error updating credit card:', error);
    if (error instanceof Error && 'issues' in error) {
      return { success: false, error: 'Error de validación', details: error };
    }
    return { success: false, error: 'Error al actualizar tarjeta de crédito' };
  }
}

export async function deleteCreditCard(id: string): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    await creditCardRepository.delete(id, user.id);
    revalidatePath('/credits');
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error deleting credit card:', error);
    return { success: false, error: 'Error al eliminar tarjeta de crédito' };
  }
}

export async function getCreditCards(): Promise<ActionResult<CreditCard[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const creditCards = await creditCardRepository.getAll(user.id);
    return { success: true, data: creditCards };
  } catch (error) {
    console.error('Error fetching credit cards:', error);
    return { success: false, error: 'Error al obtener tarjetas de crédito' };
  }
}

// Loans Given
export async function createLoanGiven(data: unknown): Promise<ActionResult<any>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const validated = createLoanGivenSchema.parse(data);
    const loan = await loanRepository.createGiven({
      ...validated,
      user_id: user.id,
    });

    revalidatePath('/credits');
    return { success: true, data: loan };
  } catch (error) {
    console.error('Error creating loan given:', error);
    if (error instanceof Error && 'issues' in error) {
      return { success: false, error: 'Error de validación', details: error };
    }
    return { success: false, error: 'Error al crear préstamo dado' };
  }
}

export async function updateLoanGiven(
  id: string,
  data: unknown
): Promise<ActionResult<any>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const validated = updateLoanGivenSchema.parse(data);
    const loan = await loanRepository.updateGiven(id, user.id, validated);

    revalidatePath('/credits');
    return { success: true, data: loan };
  } catch (error) {
    console.error('Error updating loan given:', error);
    return { success: false, error: 'Error al actualizar préstamo dado' };
  }
}

export async function deleteLoanGiven(id: string): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    await loanRepository.deleteGiven(id, user.id);
    revalidatePath('/credits');
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error deleting loan given:', error);
    return { success: false, error: 'Error al eliminar préstamo dado' };
  }
}

export async function getLoansGiven(): Promise<ActionResult<any[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const loans = await loanRepository.getAllGiven(user.id);
    return { success: true, data: loans };
  } catch (error) {
    console.error('Error fetching loans given:', error);
    return { success: false, error: 'Error al obtener préstamos dados' };
  }
}

// Loans Received
export async function createLoanReceived(data: unknown): Promise<ActionResult<any>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const validated = createLoanReceivedSchema.parse(data);
    const loan = await loanRepository.createReceived({
      ...validated,
      user_id: user.id,
    });

    revalidatePath('/credits');
    return { success: true, data: loan };
  } catch (error) {
    console.error('Error creating loan received:', error);
    if (error instanceof Error && 'issues' in error) {
      return { success: false, error: 'Error de validación', details: error };
    }
    return { success: false, error: 'Error al crear préstamo recibido' };
  }
}

export async function updateLoanReceived(
  id: string,
  data: unknown
): Promise<ActionResult<any>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const validated = updateLoanReceivedSchema.parse(data);
    const loan = await loanRepository.updateReceived(id, user.id, validated);

    revalidatePath('/credits');
    return { success: true, data: loan };
  } catch (error) {
    console.error('Error updating loan received:', error);
    return { success: false, error: 'Error al actualizar préstamo recibido' };
  }
}

export async function deleteLoanReceived(id: string): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    await loanRepository.deleteReceived(id, user.id);
    revalidatePath('/credits');
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error deleting loan received:', error);
    return { success: false, error: 'Error al eliminar préstamo recibido' };
  }
}

export async function getLoansReceived(): Promise<ActionResult<any[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const loans = await loanRepository.getAllReceived(user.id);
    return { success: true, data: loans };
  } catch (error) {
    console.error('Error fetching loans received:', error);
    return { success: false, error: 'Error al obtener préstamos recibidos' };
  }
}

// Loan Payments
export async function addLoanGivenPayment(
  loanId: string,
  data: unknown
): Promise<ActionResult<any>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const validated = createLoanPaymentSchema.parse(data);
    const payment = await loanRepository.addGivenPayment({
      ...validated,
      loan_id: loanId,
    });

    revalidatePath('/credits');
    return { success: true, data: payment };
  } catch (error) {
    console.error('Error adding loan given payment:', error);
    return { success: false, error: 'Error al agregar pago' };
  }
}

export async function addLoanReceivedPayment(
  loanId: string,
  data: unknown
): Promise<ActionResult<any>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const validated = createLoanPaymentSchema.parse(data);
    const payment = await loanRepository.addReceivedPayment({
      ...validated,
      loan_id: loanId,
    });

    revalidatePath('/credits');
    return { success: true, data: payment };
  } catch (error) {
    console.error('Error adding loan received payment:', error);
    return { success: false, error: 'Error al agregar pago' };
  }
}

// Get transactions related to credits
export async function getCreditCardTransactions(
  creditCardId: string,
  startDate?: string,
  endDate?: string
): Promise<ActionResult<any[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    // Verify credit card belongs to user
    const creditCard = await creditCardRepository.getById(creditCardId, user.id);
    if (!creditCard) {
      return { success: false, error: 'Tarjeta de crédito no encontrada' };
    }

    const result = await transactionRepository.getAll(user.id, {
      accountId: creditCardId,
      startDate,
      endDate,
      limit: 1000,
    });

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error fetching credit card transactions:', error);
    return { success: false, error: 'Error al obtener transacciones de la tarjeta' };
  }
}
