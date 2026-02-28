'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { transactionRepository } from '@/lib/repositories/transaction-repository';
import { accountRepository } from '@/lib/repositories/account-repository';
import { createTransactionSchema, updateTransactionSchema } from '@/lib/validations/transaction-schema';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/types/database.types';
import type { TransactionWithRelations } from '@/lib/repositories/transaction-repository';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getTransactions(filters?: {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  accountId?: string;
  kind?: Database['public']['Enums']['transaction_kind'];
  status?: Database['public']['Enums']['transaction_status'];
  page?: number;
  limit?: number;
}): Promise<ActionResult<{ data: TransactionWithRelations[]; count: number; totalPages: number }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const limit = filters?.limit || 20;
    const page = filters?.page || 1;
    const offset = (page - 1) * limit;

    const result = await transactionRepository.getAll(user.id, {
      ...filters,
      limit,
      offset,
    });

    return {
      success: true,
      data: {
        ...result,
        totalPages: Math.ceil(result.count / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return { success: false, error: 'Error al obtener las transacciones' };
  }
}

export async function getTransaction(id: string): Promise<ActionResult<TransactionWithRelations>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const transaction = await transactionRepository.getById(id, user.id);
    if (!transaction) {
      return { success: false, error: 'Transacción no encontrada' };
    }

    return { success: true, data: transaction };
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return { success: false, error: 'Error al obtener la transacción' };
  }
}

export async function createTransaction(data: unknown): Promise<ActionResult<TransactionWithRelations>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const validated = createTransactionSchema.parse(data);

    // Create transaction
    const transaction = await transactionRepository.create({
      ...validated,
      user_id: user.id,
    });

    revalidatePath('/dashboard');
    revalidatePath('/transactions');

    return { success: true, data: transaction };
  } catch (error) {
    console.error('Error creating transaction:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Error de validación',
        details: { issues: error.issues },
      };
    }

    return { success: false, error: 'Error al crear la transacción' };
  }
}

export async function updateTransaction(
  id: string,
  data: unknown
): Promise<ActionResult<TransactionWithRelations>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const validated = updateTransactionSchema.parse(data);

    // Update transaction
    const transaction = await transactionRepository.update(id, user.id, validated);

    revalidatePath('/dashboard');
    revalidatePath('/transactions');

    return { success: true, data: transaction };
  } catch (error) {
    console.error('Error updating transaction:', error);
    
    if (error instanceof Error && 'issues' in error) {
      return { success: false, error: 'Error de validación', details: error };
    }

    return { success: false, error: 'Error al actualizar la transacción' };
  }
}

export async function deleteTransaction(id: string): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    await transactionRepository.delete(id, user.id);

    revalidatePath('/dashboard');
    revalidatePath('/transactions');

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return { success: false, error: 'Error al eliminar la transacción' };
  }
}

export async function getTransactionsSummary(
  startDate: string,
  endDate: string
): Promise<
  ActionResult<{
    totalIncome: number;
    totalExpense: number;
    balance: number;
    preferredCode: string;
    preferredSymbol: string;
  }>
> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    // Fetch user currencies to build the exchange-rate map.
    // Cast to `any` because the `currencies` table is not part of the generated
    // Supabase database types (it lives in a separate schema migration).
    const supabase = await createClient();
    type CurrencyRow = {
      code: string;
      symbol: string;
      exchange_rate_to_preferred: number | null;
    };
    const { data: currenciesRaw, error: currError } = await (supabase as any)
      .from('currencies')
      .select('code, symbol, exchange_rate_to_preferred')
      .eq('user_id', user.id);

    if (currError) throw currError;

    const currencies = (currenciesRaw ?? []) as CurrencyRow[];

    // Determine the preferred currency (rate === 1 wins, then null fallback, then first)
    const preferredCurrency =
      currencies.find((c) => c.exchange_rate_to_preferred === 1) ??
      currencies.find((c) => c.exchange_rate_to_preferred === null) ??
      currencies[0];

    const preferredCode = preferredCurrency?.code ?? 'COP';
    const preferredSymbol = preferredCurrency?.symbol ?? '$';

    // Build a map: currencyCode → rate_to_preferred
    const rateByCode = new Map<string, number>();
    for (const c of currencies) {
      const rate = c.exchange_rate_to_preferred;
      if (rate === null) {
        console.warn(
          `[getTransactionsSummary] Currency "${c.code}" has no exchange_rate_to_preferred — using 1.0`
        );
      }
      rateByCode.set(c.code, rate === null ? 1.0 : rate);
    }

    const summary = await transactionRepository.getSummary(user.id, startDate, endDate, rateByCode, preferredCode);

    return {
      success: true,
      data: { ...summary, preferredCode, preferredSymbol },
    };
  } catch (error) {
    console.error('Error fetching summary:', error);
    return { success: false, error: 'Error al obtener el resumen' };
  }
}

// Returns { accountId: { date: ISO-datetime, id: UUID } } for the most recent POSTED
// ADJUSTMENT per account. Used by the transaction list to visually mark historical rows.
export async function getLastAdjustmentDates(
  accountIds: string[]
): Promise<ActionResult<Record<string, { date: string; id: string }>>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const map = await transactionRepository.getLastAdjustmentPerAccount(user.id, accountIds);
    return { success: true, data: Object.fromEntries(map) };
  } catch (error) {
    console.error('Error fetching last adjustment dates:', error);
    return { success: false, error: 'Error al obtener fechas de ajuste' };
  }
}

export async function getAccountTransactions(
  accountId: string,
  startDate?: string,
  endDate?: string
): Promise<ActionResult<TransactionWithRelations[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    // Verify account belongs to user
    const account = await accountRepository.getById(accountId, user.id);
    if (!account) {
      return { success: false, error: 'Cuenta no encontrada' };
    }

    const result = await transactionRepository.getAll(user.id, {
      accountId,
      startDate,
      endDate,
      limit: 1000,
    });

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error fetching account transactions:', error);
    return { success: false, error: 'Error al obtener las transacciones de la cuenta' };
  }
}
