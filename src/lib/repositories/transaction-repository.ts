import { createClient } from '@/lib/supabase/server';
import Decimal from 'decimal.js';
import { convertToBase } from '@/lib/utils/currency';
import type { Database } from '@/lib/types/database.types';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

// Extended type with related data
export type TransactionWithRelations = Transaction & {
  accounts?: Database['public']['Tables']['accounts']['Row'] | null;
  categories?: Database['public']['Tables']['categories']['Row'] | null;
  account_types?: Database['public']['Tables']['account_types']['Row'] | null;
};

export const transactionRepository = {
  async getAll(
    userId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      categoryId?: string;
      accountId?: string;
      kind?: Database['public']['Enums']['TransactionKind'];
      status?: Database['public']['Enums']['TransactionStatus'];
      limit?: number;
      offset?: number;
    }
  ): Promise<{ data: TransactionWithRelations[]; count: number }> {
    const supabase = await createClient();

    let query = supabase
      .from('transactions')
      .select(`
        *,
        accounts (
          *,
          account_types (*)
        ),
        categories (*)
      `, { count: 'exact' })
      .eq('user_id', userId);

    if (filters?.startDate) {
      const startStr = filters.startDate.includes('T') ? filters.startDate : `${filters.startDate} 00:00:00`;
      query = query.gte('occurred_at', startStr);
    }
    if (filters?.endDate) {
      const endStr = filters.endDate.includes('T') ? filters.endDate : `${filters.endDate} 23:59:59`;
      query = query.lte('occurred_at', endStr);
    }
    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters?.accountId) {
      query = query.eq('account_id', filters.accountId);
    }
    if (filters?.kind) {
      query = query.eq('kind', filters.kind);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    query = query.order('occurred_at', { ascending: false });

    if (filters?.limit) {
      query = query.range(
        filters.offset || 0,
        (filters.offset || 0) + filters.limit - 1
      );
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: (data || []) as TransactionWithRelations[], count: count || 0 };
  },

  /**
   * Fetches transfer info (from/to accounts) for the given transfer IDs.
   * Returns a map: transferId -> { fromAccount: { id, name }, toAccount: { id, name } }
   */
  async getTransfersWithAccounts(
    userId: string,
    transferIds: string[]
  ): Promise<Map<string, { fromAccount: { id: string; name: string }; toAccount: { id: string; name: string } }>> {
    if (transferIds.length === 0) return new Map();

    const supabase = await createClient();

    const { data: transfers, error: tError } = await supabase
      .from('transfers')
      .select('id, from_account_id, to_account_id')
      .eq('user_id', userId)
      .in('id', transferIds);

    if (tError) throw tError;
    if (!transfers?.length) return new Map();

    const accountIds = Array.from(new Set(transfers.flatMap((t) => [t.from_account_id, t.to_account_id])));
    const { data: accounts, error: aError } = await supabase
      .from('accounts')
      .select('id, name')
      .in('id', accountIds);

    if (aError) throw aError;
    const accountMap = new Map((accounts ?? []).map((a) => [a.id, a]));

    const result = new Map<string, { fromAccount: { id: string; name: string }; toAccount: { id: string; name: string } }>();
    for (const t of transfers) {
      const fromAcc = accountMap.get(t.from_account_id);
      const toAcc = accountMap.get(t.to_account_id);
      if (fromAcc && toAcc) {
        result.set(t.id, {
          fromAccount: { id: fromAcc.id, name: fromAcc.name },
          toAccount: { id: toAcc.id, name: toAcc.name },
        });
      }
    }
    return result;
  },

  async getById(id: string, userId: string): Promise<TransactionWithRelations | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        accounts (
          *,
          account_types (*)
        ),
        categories (*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as TransactionWithRelations;
  },

  async create(transaction: TransactionInsert): Promise<TransactionWithRelations> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select(`
        *,
        accounts (
          *,
          account_types (*)
        ),
        categories (*)
      `)
      .single();

    if (error) throw error;
    return data as TransactionWithRelations;
  },

  async update(id: string, userId: string, updates: TransactionUpdate): Promise<TransactionWithRelations> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        accounts (
          *,
          account_types (*)
        ),
        categories (*)
      `)
      .single();

    if (error) throw error;
    return data as TransactionWithRelations;
  },

  /**
   * Updates both legs of a transfer when account/amount changes.
   * Returns the updated transaction that was passed in (debit or credit).
   */
  async updateTransferLegs(
    userId: string,
    transactionId: string,
    updates: {
      fromAccountId: string;
      toAccountId: string;
      amount: number;
      occurred_at?: string;
      description?: string | null;
      status?: Database['public']['Enums']['TransactionStatus'];
    }
  ): Promise<TransactionWithRelations> {
    const supabase = await createClient();
    const tx = await this.getById(transactionId, userId);
    if (!tx?.transfer_id) throw new Error('Transaction is not part of a transfer');

    const { data: transfer, error: tErr } = await supabase
      .from('transfers')
      .select('from_transaction_id, to_transaction_id')
      .eq('id', tx.transfer_id)
      .eq('user_id', userId)
      .single();

    if (tErr || !transfer) throw new Error('Transfer not found');

    const debitId = transfer.from_transaction_id;
    const creditId = transfer.to_transaction_id;
    if (!debitId || !creditId) throw new Error('Transfer legs incomplete');

    const now = new Date().toISOString();
    const amount = Math.abs(updates.amount);

    const baseUpdate = {
      occurred_at: updates.occurred_at,
      description: updates.description,
      status: updates.status,
      updated_at: now,
    };

    const { error: debitErr } = await supabase
      .from('transactions')
      .update({
        account_id: updates.fromAccountId,
        signed_amount: -amount,
        ...baseUpdate,
      })
      .eq('id', debitId)
      .eq('user_id', userId);

    if (debitErr) throw debitErr;

    const { error: creditErr } = await supabase
      .from('transactions')
      .update({
        account_id: updates.toAccountId,
        signed_amount: amount,
        ...baseUpdate,
      })
      .eq('id', creditId)
      .eq('user_id', userId);

    if (creditErr) throw creditErr;

    const { error: transferErr } = await supabase
      .from('transfers')
      .update({
        from_account_id: updates.fromAccountId,
        to_account_id: updates.toAccountId,
        amount,
        occurred_at: updates.occurred_at,
        status: updates.status,
        updated_at: now,
      })
      .eq('id', tx.transfer_id)
      .eq('user_id', userId);

    if (transferErr) throw transferErr;

    const updated = await this.getById(transactionId, userId);
    if (!updated) throw new Error('Failed to fetch updated transaction');
    return updated;
  },

  async delete(id: string, userId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * Deletes both legs of a transfer and the transfer record itself.
   * Scoped to userId to prevent cross-user deletion.
   */
  async deleteTransferLegs(transferId: string, userId: string): Promise<void> {
    const supabase = await createClient();

    const { error: txError } = await supabase
      .from('transactions')
      .delete()
      .eq('transfer_id', transferId)
      .eq('user_id', userId);

    if (txError) throw txError;

    const { error: trError } = await supabase
      .from('transfers')
      .delete()
      .eq('id', transferId)
      .eq('user_id', userId);

    if (trError) throw trError;
  },

  /**
   * Creates a transfer between two accounts atomically.
   * Uses explicit id (crypto.randomUUID()) to avoid 23502 NOT NULL on transfers.id.
   * Rollback on any failure to prevent orphaned data.
   */
  async createTransferWithTransactions(params: {
    userId: string;
    fromAccountId: string;
    toAccountId: string;
    amountInSourceCurrency: number;
    amountInDestCurrency: number;
    sourceCurrencyCode: string;
    description: string | null;
    occurredAt: string;
    status: Database['public']['Enums']['TransactionStatus'];
  }): Promise<{ debitTx: TransactionWithRelations; creditTx: TransactionWithRelations }> {
    const supabase = await createClient();
    const {
      userId,
      fromAccountId,
      toAccountId,
      amountInSourceCurrency,
      amountInDestCurrency,
      sourceCurrencyCode,
      description,
      occurredAt,
      status,
    } = params;

    const now = new Date().toISOString();
    const transferId = crypto.randomUUID();

    // 1. Create transfer record with explicit id (avoids 23502 NOT NULL)
    const { data: transfer, error: transferError } = await supabase
      .from('transfers')
      .insert({
        id: transferId,
        user_id: userId,
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount: amountInSourceCurrency,
        currency_code: sourceCurrencyCode,
        status,
        occurred_at: occurredAt,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (transferError) throw transferError;
    if (!transfer) throw new Error('Failed to create transfer');

    // 2. Create debit transaction (source account, negative amount)
    const { data: debitTx, error: debitError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        account_id: fromAccountId,
        signed_amount: -Math.abs(amountInSourceCurrency),
        kind: 'TRANSFER',
        status,
        description,
        occurred_at: occurredAt,
        transfer_id: transferId,
        source: 'MANUAL',
        created_at: now,
        updated_at: now,
      })
      .select(`*, accounts (*, account_types (*)), categories (*)`)
      .single();

    if (debitError) {
      await supabase.from('transfers').delete().eq('id', transferId);
      throw debitError;
    }

    // 3. Create credit transaction (destination account, positive amount)
    const { data: creditTx, error: creditError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        account_id: toAccountId,
        signed_amount: Math.abs(amountInDestCurrency),
        kind: 'TRANSFER',
        status,
        description,
        occurred_at: occurredAt,
        transfer_id: transferId,
        source: 'MANUAL',
        created_at: now,
        updated_at: now,
      })
      .select(`*, accounts (*, account_types (*)), categories (*)`)
      .single();

    if (creditError) {
      await supabase.from('transactions').delete().eq('id', debitTx.id);
      await supabase.from('transfers').delete().eq('id', transferId);
      throw creditError;
    }

    // 4. Update transfer with transaction IDs
    const { error: updateError } = await supabase
      .from('transfers')
      .update({
        from_transaction_id: debitTx.id,
        to_transaction_id: creditTx.id,
        updated_at: now,
      })
      .eq('id', transferId);

    if (updateError) {
      await supabase.from('transactions').delete().eq('id', creditTx.id);
      await supabase.from('transactions').delete().eq('id', debitTx.id);
      await supabase.from('transfers').delete().eq('id', transferId);
      throw updateError;
    }

    return {
      debitTx: debitTx as TransactionWithRelations,
      creditTx: creditTx as TransactionWithRelations,
    };
  },

  // Returns a map of accountId → { date: ISO occurred_at, id: UUID } for the most recent
  // POSTED ADJUSTMENT per account. The id is needed to visually distinguish the active
  // adjustment from older (historical) adjustment rows in the UI.
  async getLastAdjustmentPerAccount(
    userId: string,
    accountIds: string[]
  ): Promise<Map<string, { date: string; id: string }>> {
    if (accountIds.length === 0) return new Map();

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('transactions')
      .select('id, account_id, occurred_at')
      .eq('user_id', userId)
      .eq('kind', 'ADJUSTMENT')
      .eq('status', 'POSTED')
      .in('account_id', accountIds)
      .order('occurred_at', { ascending: false });

    if (error) throw error;

    const map = new Map<string, { date: string; id: string }>();
    for (const t of data || []) {
      if (t.account_id && !map.has(t.account_id)) {
        map.set(t.account_id, { date: t.occurred_at, id: t.id });
      }
    }
    return map;
  },

  /**
   * Aggregates all active loan transactions (loan_type != 'NONE') for a user.
   * Returns the total outstanding debt = sum(|signed_amount|) - sum(repaid_amount),
   * broken down per loan entry for display purposes.
   * Only POSTED transactions are included; VOID ones are ignored.
   */
  async getLoanSummary(userId: string): Promise<{
    totalPending: number;
    items: Array<{
      id: string;
      loan_type: string;
      lender_name: string | null;
      original_amount: number;
      repaid_amount: number;
      pending: number;
      occurred_at: string;
      description: string | null;
    }>;
  }> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('transactions')
      .select('id, loan_type, lender_name, signed_amount, repaid_amount, occurred_at, description')
      .eq('user_id', userId)
      .eq('status', 'POSTED')
      .neq('loan_type', 'NONE')
      .order('occurred_at', { ascending: false });

    if (error) throw error;

    let totalPending = new Decimal(0);
    const items = (data ?? []).map((t) => {
      const original = Math.abs(Number(t.signed_amount));
      const repaid = Number(t.repaid_amount ?? 0);
      const pending = new Decimal(original).minus(repaid).toDecimalPlaces(2).toNumber();
      if (pending > 0) totalPending = totalPending.plus(pending);
      return {
        id: t.id,
        loan_type: t.loan_type,
        lender_name: t.lender_name,
        original_amount: original,
        repaid_amount: repaid,
        pending,
        occurred_at: t.occurred_at,
        description: t.description,
      };
    });

    return {
      totalPending: totalPending.toDecimalPlaces(2).toNumber(),
      items,
    };
  },

  async getSummary(
    userId: string,
    startDate: string,
    endDate: string,
    rateByCode?: Map<string, number>,
    preferredCode?: string
  ): Promise<{ totalIncome: number; totalExpense: number; balance: number }> {
    const supabase = await createClient();

    // Fetch the most recent POSTED ADJUSTMENT per account so we can filter out
    // historical (pre-adjustment) transactions from the income/expense totals.
    const { data: adjData } = await supabase
      .from('transactions')
      .select('account_id, occurred_at')
      .eq('user_id', userId)
      .eq('kind', 'ADJUSTMENT')
      .eq('status', 'POSTED')
      .order('occurred_at', { ascending: false });

    const lastAdjMap = new Map<string, string>();
    for (const adj of adjData || []) {
      if (adj.account_id && !lastAdjMap.has(adj.account_id)) {
        lastAdjMap.set(adj.account_id, adj.occurred_at);
      }
    }

    // Fetch transactions with account currency code for conversion.
    // Exclude TRANSFER and ADJUSTMENT from income/expense calculations.
    const startStr = startDate.includes('T') ? startDate : `${startDate} 00:00:00`;
    const endStr = endDate.includes('T') ? endDate : `${endDate} 23:59:59`;

    const { data, error } = await supabase
      .from('transactions')
      .select('signed_amount, kind, account_id, occurred_at, accounts!inner(currency_code, account_types!inner(balance_nature)), categories(name)')
      .eq('user_id', userId)
      .eq('status', 'POSTED')
      .gte('occurred_at', startStr)
      .lte('occurred_at', endStr)
      .not('kind', 'in', '(TRANSFER,ADJUSTMENT)');

    if (error) throw error;

    let totalIncome = new Decimal(0);
    let totalExpense = new Decimal(0);

    (data || []).forEach((t) => {
      // Skip transactions that are "historical" — occurred at or before the
      // most recent POSTED ADJUSTMENT for their account. The ADJUSTMENT amount
      // already captures everything up to that point; earlier transactions
      // would double-count.
      const lastAdj = t.account_id ? lastAdjMap.get(t.account_id) : undefined;
      if (lastAdj && t.occurred_at && t.occurred_at <= lastAdj) return;

      const rawAmount = Number(t.signed_amount);
      const account = t.accounts as any;
      const balanceNature = account?.account_types?.balance_nature;
      const currencyCode: string = account?.currency_code ?? '';
      const categoryName = (t as any).categories?.name;

      // Convert to preferred currency: amount × (rateDest / rateOrigin)
      let amount = rawAmount;
      if (rateByCode && preferredCode) {
        if (!rateByCode.has(currencyCode)) {
          console.warn(
            `[getSummary] No exchange rate found for currency "${currencyCode}" — using raw amount as fallback`
          );
        } else {
          amount = convertToBase(rawAmount, currencyCode, preferredCode, rateByCode);
        }
      }

      // Sign convention for all account types:
      // ASSET:     positive = income,  negative = expense
      // LIABILITY: negative = charge/expense (increases debt, balance goes more negative)
      //            positive = payment/income  (reduces debt, balance moves toward 0)
      if (balanceNature === 'ASSET') {
        if (amount > 0) {
          totalIncome = totalIncome.plus(amount);
        } else {
          totalExpense = totalExpense.plus(Math.abs(amount));
        }
      } else if (balanceNature === 'LIABILITY') {
        // Skip credit card payment receipts (to avoid double-counting).
        // The payment is already captured as an expense in the ASSET (savings) account.
        if (categoryName === 'Pagos Tarjeta') return;

        if (amount < 0) {
          totalExpense = totalExpense.plus(Math.abs(amount));
        }
      }
    });

    const income = totalIncome.toDecimalPlaces(2).toNumber();
    const expense = totalExpense.toDecimalPlaces(2).toNumber();
    const balance = totalIncome.minus(totalExpense).toDecimalPlaces(2).toNumber();

    return {
      totalIncome: income,
      totalExpense: expense,
      balance,
    };
  },
};
