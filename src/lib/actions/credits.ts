'use server';

import { revalidatePath } from 'next/cache';
import { creditCardRepository } from '@/lib/repositories/credit-card-repository';
import { transactionRepository } from '@/lib/repositories/transaction-repository';
import { createCreditCardSchema, updateCreditCardSchema } from '@/lib/validations/credit-card-schema';
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
