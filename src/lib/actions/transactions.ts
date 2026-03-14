'use server';

import { z } from 'zod';
import Decimal from 'decimal.js';
import { revalidatePath } from 'next/cache';
import { transactionRepository } from '@/lib/repositories/transaction-repository';
import { accountRepository } from '@/lib/repositories/account-repository';
import { createTransactionSchema, updateTransactionSchema } from '@/lib/validations/transaction-schema';
import { createClient } from '@/lib/supabase/server';
import { convertToBase } from '@/lib/utils/currency';
import { syncSystemCategories } from '@/lib/actions/categories';
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

async function getCurrencyRateMap(userId: string): Promise<Map<string, number>> {
  const supabase = await createClient();
  type CurrencyRow = { code: string; exchange_rate_to_preferred: number | null };
  const { data: currencies, error } = await (supabase as any)
    .from('currencies')
    .select('code, exchange_rate_to_preferred')
    .eq('user_id', userId);
  if (error) throw error;
  const map = new Map<string, number>();
  for (const c of (currencies ?? []) as CurrencyRow[]) {
    map.set(c.code, c.exchange_rate_to_preferred === null ? 1 : c.exchange_rate_to_preferred);
  }
  return map;
}

export type TransferInfo = {
  fromAccount: { id: string; name: string };
  toAccount: { id: string; name: string };
};

export async function getTransactions(filters?: {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  accountId?: string;
  kind?: Database['public']['Enums']['transaction_kind'];
  status?: Database['public']['Enums']['transaction_status'];
  page?: number;
  limit?: number;
}): Promise<
  ActionResult<{
    data: TransactionWithRelations[];
    count: number;
    totalPages: number;
    transferInfo: Record<string, TransferInfo>;
  }>
> {
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

    const transferIds = Array.from(new Set((result.data ?? []).map((t) => t.transfer_id).filter(Boolean) as string[]));
    const transferMap = await transactionRepository.getTransfersWithAccounts(user.id, transferIds);
    const transferInfo = Object.fromEntries(transferMap);

    return {
      success: true,
      data: {
        ...result,
        totalPages: Math.ceil(result.count / limit),
        transferInfo,
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

/** Extended transfer info with currency codes for conversion display */
export type TransferDetailInfo = {
  fromAccount: { id: string; name: string; currencyCode: string };
  toAccount: { id: string; name: string; currencyCode: string };
};

export async function getTransactionDetail(id: string): Promise<
  ActionResult<{
    transaction: TransactionWithRelations;
    transferInfo?: TransferDetailInfo;
    rateByCode: Record<string, number>;
    preferredCode: string;
  }>
> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const transaction = await transactionRepository.getById(id, user.id);
    if (!transaction) {
      return { success: false, error: 'Transacción no encontrada' };
    }

    const rateByCode = await getCurrencyRateMap(user.id);
    const rateRecord: Record<string, number> = Object.fromEntries(rateByCode);

    const supabase = await createClient();
    type CurrencyRow = { code: string; exchange_rate_to_preferred: number | null };
    const { data: currencies } = await (supabase as any)
      .from('currencies')
      .select('code, exchange_rate_to_preferred')
      .eq('user_id', user.id);

    const preferredCurrency =
      (currencies as CurrencyRow[] | null)?.find((c) => c.exchange_rate_to_preferred === 1) ??
      (currencies as CurrencyRow[] | null)?.find((c) => c.exchange_rate_to_preferred === null) ??
      (currencies as CurrencyRow[] | null)?.[0];
    const preferredCode = preferredCurrency?.code ?? 'COP';

    let transferInfo: TransferDetailInfo | undefined;
    if (transaction.transfer_id) {
      const transferMap = await transactionRepository.getTransfersWithAccounts(user.id, [transaction.transfer_id]);
      const info = transferMap.get(transaction.transfer_id);
      if (info) {
        const { data: accounts } = await (supabase as any)
          .from('accounts')
          .select('id, name, currency_code')
          .in('id', [info.fromAccount.id, info.toAccount.id]);
        type AccEntry = { id: string; name: string; currency_code: string };
        const accMap = new Map<string, AccEntry>((accounts ?? []).map((a: AccEntry) => [a.id, a]));
        const fromAcc = accMap.get(info.fromAccount.id);
        const toAcc = accMap.get(info.toAccount.id);
        if (fromAcc && toAcc) {
          transferInfo = {
            fromAccount: { id: fromAcc.id, name: fromAcc.name, currencyCode: fromAcc.currency_code ?? 'COP' },
            toAccount: { id: toAcc.id, name: toAcc.name, currencyCode: toAcc.currency_code ?? 'COP' },
          };
        }
      }
    }

    return {
      success: true,
      data: {
        transaction,
        transferInfo,
        rateByCode: rateRecord,
        preferredCode,
      },
    };
  } catch (error) {
    console.error('Error fetching transaction detail:', error);
    return { success: false, error: 'Error al obtener el detalle de la transacción' };
  }
}

export async function createTransaction(data: unknown): Promise<ActionResult<TransactionWithRelations>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const validated = createTransactionSchema.parse(data);

    // Transfer: create both debit and credit transactions atomically
    if (validated.kind === 'TRANSFER' && validated.destination_account_id) {
      const fromAccount = await accountRepository.getById(validated.account_id, user.id);
      const toAccount = await accountRepository.getById(validated.destination_account_id, user.id);

      if (!fromAccount || !toAccount) {
        return { success: false, error: 'Cuenta de origen o destino no encontrada' };
      }

      const amountInSource = Math.abs(validated.signed_amount);
      const sourceCurrency = fromAccount.currency_code;
      const destCurrency = toAccount.currency_code;

      const rateByCode = await getCurrencyRateMap(user.id);
      const amountInDest =
        sourceCurrency === destCurrency
          ? amountInSource
          : convertToBase(amountInSource, sourceCurrency, destCurrency, rateByCode);

      const occurredAt = validated.occurred_at;

      const { debitTx } = await transactionRepository.createTransferWithTransactions({
        userId: user.id,
        fromAccountId: validated.account_id,
        toAccountId: validated.destination_account_id,
        amountInSourceCurrency: amountInSource,
        amountInDestCurrency: amountInDest,
        sourceCurrencyCode: sourceCurrency,
        description: validated.description ?? null,
        occurredAt,
        status: validated.status ?? 'POSTED',
      });

      revalidatePath('/dashboard');
      revalidatePath('/transactions');

      return { success: true, data: debitTx };
    }

    // Normal transaction: single insert
    const { destination_account_id: _, ...rest } = validated;
    const occurredAt = rest.occurred_at;

    const transaction = await transactionRepository.create({
      account_id: rest.account_id,
      signed_amount: rest.signed_amount,
      occurred_at: occurredAt,
      user_id: user.id,
      kind: rest.kind ?? 'NORMAL',
      status: rest.status ?? 'POSTED',
      category_id: rest.category_id ?? null,
      description: rest.description ?? null,
      posted_at: rest.posted_at ?? null,
      source: rest.source ?? 'MANUAL',
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

    // Task 1: Retrieve snapshot BEFORE validation — we need it to merge and for anchor guard
    const snapshot = await transactionRepository.getById(id, user.id);
    if (!snapshot) {
      return { success: false, error: 'Transacción no encontrada' };
    }

    const validated = updateTransactionSchema.parse(data);

    // Task 2: Anchor Guard — get last adjustment dates for affected account(s)
    const accountIdsToCheck: string[] = [snapshot.account_id].filter(Boolean) as string[];
    let transferInfo: { fromAccount: { id: string }; toAccount: { id: string } } | undefined;
    if (snapshot.transfer_id && snapshot.account_id) {
      const transferMap = await transactionRepository.getTransfersWithAccounts(user.id, [snapshot.transfer_id]);
      transferInfo = transferMap.get(snapshot.transfer_id);
      if (transferInfo) {
        accountIdsToCheck.push(transferInfo.fromAccount.id, transferInfo.toAccount.id);
      }
    }
    const lastAdjMap = await transactionRepository.getLastAdjustmentPerAccount(user.id, Array.from(new Set(accountIdsToCheck)));

    const snapshotOccurredAt = snapshot.occurred_at ?? '';
    const isHistoric = accountIdsToCheck.some((accId) => {
      const adj = lastAdjMap.get(accId);
      return adj && snapshotOccurredAt && snapshotOccurredAt <= adj.date;
    });

    // If historic: only allow description and category_id
    if (isHistoric) {
      const hasNumericOrStructuralChange =
        validated.signed_amount != null ||
        validated.occurred_at != null ||
        validated.status != null ||
        validated.account_id != null ||
        validated.destination_account_id != null;
      if (hasNumericOrStructuralChange) {
        return {
          success: false,
          error:
            'No puedes modificar una transacción histórica (anterior a un ajuste). Solo puedes editar la descripción o categoría.',
        };
      }
    } else {
      // Active transaction: if user is changing occurred_at, validate it's not before last adjustment
      const newOccurredAt = validated.occurred_at ?? snapshotOccurredAt;
      if (newOccurredAt) {
        for (const accId of accountIdsToCheck) {
          const adj = lastAdjMap.get(accId);
          if (adj && newOccurredAt < adj.date) {
            return {
              success: false,
              error: 'No puedes mover una transacción a un periodo ya cerrado por un ajuste',
            };
          }
        }
      }
    }

    // Task 1: Merge validated with snapshot — preserve original values for omitted fields
    // For historic transactions, only description and category_id are allowed
    const finalAccountId = isHistoric ? snapshot.account_id : (validated.account_id ?? snapshot.account_id ?? undefined);
    const finalFromAccountId = snapshot.transfer_id
      ? (validated.account_id ?? transferInfo?.fromAccount.id)
      : finalAccountId;
    const finalToAccountId = snapshot.transfer_id
      ? (validated.destination_account_id ?? transferInfo?.toAccount.id)
      : undefined;
    const finalOccurredAt = isHistoric ? snapshotOccurredAt : (validated.occurred_at ?? snapshotOccurredAt);
    const finalStatus = isHistoric ? snapshot.status : (validated.status ?? snapshot.status ?? 'POSTED');
    const finalAmount = isHistoric
      ? (snapshot.signed_amount != null ? Number(snapshot.signed_amount) : undefined)
      : (validated.signed_amount != null
          ? new Decimal(validated.signed_amount).toDecimalPlaces(2).toNumber()
          : (snapshot.signed_amount != null ? Number(snapshot.signed_amount) : undefined));

    let transaction: TransactionWithRelations;

    if (
      snapshot.transfer_id &&
      !isHistoric &&
      finalFromAccountId != null &&
      finalToAccountId != null &&
      finalAmount != null &&
      transferInfo
    ) {
      transaction = await transactionRepository.updateTransferLegs(user.id, id, {
        fromAccountId: finalFromAccountId,
        toAccountId: finalToAccountId,
        amount: Math.abs(finalAmount),
        occurred_at: finalOccurredAt,
        description: validated.description ?? snapshot.description ?? undefined,
        status: finalStatus,
      });
    } else {
      const updates: Record<string, unknown> = isHistoric
        ? {
            description: validated.description ?? snapshot.description ?? null,
            category_id: validated.category_id !== undefined ? validated.category_id : snapshot.category_id,
          }
        : {
            account_id: finalAccountId ?? snapshot.account_id,
            occurred_at: finalOccurredAt,
            status: finalStatus,
            description: validated.description ?? snapshot.description ?? null,
            category_id: validated.category_id !== undefined ? validated.category_id : snapshot.category_id,
          };
      if (!isHistoric && finalAmount != null) {
        updates.signed_amount = finalAmount;
      }
      transaction = await transactionRepository.update(id, user.id, updates as Parameters<typeof transactionRepository.update>[2]);
    }

    // Task 3: Revalidate so balance is recalculated on next fetch (calculateBalance runs from last adjustment)
    revalidatePath('/dashboard');
    revalidatePath('/transactions');
    revalidatePath('/accounts');

    return { success: true, data: transaction };
  } catch (error) {
    console.error('Error updating transaction:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Error de validación',
        details: { issues: error.issues },
      };
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

/**
 * Registers a credit card payment as an expense:
 * 1. Creates a NORMAL negative transaction on the savings account (expense).
 * 2. Optionally creates a NORMAL positive transaction on the credit card (debt reduction).
 *
 * These are intentionally NOT linked as a Transfer so the savings-account leg
 * appears as a true expense in the monthly summary. The CC leg is excluded from
 * getSummary via the 'Pagos Tarjeta' category guard in the repository.
 */
export async function createCreditCardPayment(data: {
  savingsAccountId: string;
  creditCardAccountId?: string | null;
  amount: number;
  description?: string | null;
  occurredAt: string;
  status?: Database['public']['Enums']['transaction_status'];
}): Promise<ActionResult<TransactionWithRelations>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const { savingsAccountId, creditCardAccountId, amount, description, occurredAt, status = 'POSTED' } = data;

    // Ensure system categories exist, then look up 'Pagos Tarjeta' id
    await syncSystemCategories(user.id);
    const supabase = await createClient();
    const { data: paymentCat } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', 'Pagos Tarjeta')
      .single();
    const categoryId = paymentCat?.id ?? null;

    // 1. Create expense on savings account (negative signed_amount)
    const savingsTx = await transactionRepository.create({
      user_id: user.id,
      account_id: savingsAccountId,
      signed_amount: -Math.abs(amount),
      category_id: categoryId,
      description: description ?? 'Pago Tarjeta de Crédito',
      occurred_at: occurredAt,
      kind: 'NORMAL',
      status,
      source: 'MANUAL',
    });

    // 2. Optionally create debt-reduction transaction on the credit card
    if (creditCardAccountId) {
      await transactionRepository.create({
        user_id: user.id,
        account_id: creditCardAccountId,
        signed_amount: Math.abs(amount),
        category_id: categoryId, // same 'Pagos Tarjeta' category — getSummary will skip it for LIABILITY accounts
        description: description ?? 'Abono Tarjeta de Crédito',
        occurred_at: occurredAt,
        kind: 'NORMAL',
        status,
        source: 'MANUAL',
      });
    }

    revalidatePath('/dashboard');
    revalidatePath('/transactions');

    return { success: true, data: savingsTx };
  } catch (error) {
    console.error('Error creating credit card payment:', error);
    return { success: false, error: 'Error al registrar el pago de tarjeta' };
  }
}
