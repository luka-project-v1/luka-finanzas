'use server';

import { revalidatePath } from 'next/cache';
import { accountRepository } from '@/lib/repositories/account-repository';
import { createBankAccountSchema, updateBankAccountSchema } from '@/lib/validations/account-schema';
import { createClient } from '@/lib/supabase/server';
import { convertToBase } from '@/lib/utils/currency';
import { getBaseCurrency } from '@/lib/actions/preferences';
import type { AccountWithDetails } from '@/lib/repositories/account-repository';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getAllAccounts(endDate?: string): Promise<ActionResult<AccountWithDetails[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const accounts = await accountRepository.getAll(user.id);

    const accountsWithBalance = await Promise.all(
      accounts.map(async (account) => {
        const balance = await accountRepository.calculateBalance(account.id, endDate, user.id);
        return { ...account, balance };
      })
    );

    return { success: true, data: accountsWithBalance };
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return { success: false, error: 'Error al obtener las cuentas' };
  }
}

export async function getBankAccounts(endDate?: string): Promise<ActionResult<AccountWithDetails[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const accounts = await accountRepository.getAll(user.id);
    // Filter to only bank accounts
    const bankAccountType = await accountRepository.getAccountTypeByCode('BANK_ACCOUNT');
    if (!bankAccountType) {
      return { success: true, data: [] };
    }

    // Recalculate balances with endDate
    const accountsWithBalance = await Promise.all(
      accounts.map(async (account) => {
        // 🔐 Pass user.id to enforce IDOR protection inside calculateBalance
        const balance = await accountRepository.calculateBalance(account.id, endDate, user.id);
        return { ...account, balance };
      })
    );

    const bankAccounts = accountsWithBalance.filter(acc => acc.account_type_id === bankAccountType.id);
    return { success: true, data: bankAccounts };
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return { success: false, error: 'Error al obtener las cuentas' };
  }
}

export async function getBankAccount(id: string): Promise<ActionResult<AccountWithDetails>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const account = await accountRepository.getById(id, user.id);
    if (!account) {
      return { success: false, error: 'Cuenta no encontrada' };
    }

    // Verify it's a bank account
    const bankAccountType = await accountRepository.getAccountTypeByCode('BANK_ACCOUNT');
    if (!bankAccountType || account.account_type_id !== bankAccountType.id) {
      return { success: false, error: 'La cuenta no es una cuenta bancaria' };
    }

    return { success: true, data: account };
  } catch (error) {
    console.error('Error fetching account:', error);
    return { success: false, error: 'Error al obtener la cuenta' };
  }
}

export async function createBankAccount(data: unknown): Promise<ActionResult<AccountWithDetails>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    // Transform data format if needed
    const dataWithCurrency = data as any;

    // currency_code should come directly from the enum (USD or COP)
    // If currency_id is provided but currency_code is not, we can't convert
    if (dataWithCurrency.currency_id && !dataWithCurrency.currency_code) {
      return { success: false, error: 'El código de moneda es obligatorio (USD o COP)' };
    }

    // Map account_type to kind (SAVINGS/CHECKING)
    if (dataWithCurrency.account_type && !dataWithCurrency.kind) {
      dataWithCurrency.kind = dataWithCurrency.account_type.toUpperCase();
      delete dataWithCurrency.account_type;
    }

    const validated = createBankAccountSchema.parse(dataWithCurrency);

    // Get BANK_ACCOUNT account type
    const bankAccountType = await accountRepository.getAccountTypeByCode('BANK_ACCOUNT');
    if (!bankAccountType) {
      return { success: false, error: 'Tipo de cuenta bancaria no encontrado' };
    }

    // Extract bank account details
    const { kind, bank_name, masked_number, interest_rate_annual, monthly_fee, overdraft_limit, ...accountData } = validated;

    const account = await accountRepository.create(
      {
        ...accountData,
        user_id: user.id,
        account_type_id: bankAccountType.id,
      },
      {
        kind,
        bank_name,
        masked_number,
        interest_rate_annual,
        monthly_fee,
        overdraft_limit,
      }
    );

    revalidatePath('/dashboard');
    revalidatePath('/accounts');

    return { success: true, data: account };
  } catch (error: any) {
    console.error('Error creating account:', error);

    // Handle validation errors
    if (error && 'issues' in error) {
      const zodError = error as any;
      const errorMessages = zodError.issues?.map((issue: any) =>
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ') || 'Validation error';
      // Convert issues to plain objects to avoid Client Component serialization issues
      const plainIssues = zodError.issues?.map((issue: any) => ({
        path: issue.path,
        message: issue.message,
        code: issue.code,
      })) || [];
      return { success: false, error: errorMessages, details: plainIssues };
    }

    // Handle Supabase RLS/permission errors
    if (error?.code === '42501' || error?.message?.includes('permission denied')) {
      return {
        success: false,
        error: 'Permiso denegado. Verifica la configuración de seguridad en Supabase.'
      };
    }

    // Handle other Supabase errors
    if (error?.code) {
      return {
        success: false,
        error: error.message || `Database error: ${error.code}`
      };
    }

    return { success: false, error: error?.message || 'Error al crear la cuenta' };
  }
}

export async function updateBankAccount(
  id: string,
  data: unknown
): Promise<ActionResult<AccountWithDetails>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    // Transform data format if needed
    const dataWithCurrency = data as any;

    // currency_code should come directly from the enum (USD or COP)
    // If currency_id is provided but currency_code is not, we can't convert
    if (dataWithCurrency.currency_id && !dataWithCurrency.currency_code) {
      return { success: false, error: 'El código de moneda es obligatorio (USD o COP)' };
    }

    // Map account_type to kind (SAVINGS/CHECKING) if needed
    if (dataWithCurrency.account_type && !dataWithCurrency.kind) {
      dataWithCurrency.kind = dataWithCurrency.account_type.toUpperCase();
      delete dataWithCurrency.account_type;
    }

    const validated = updateBankAccountSchema.parse(dataWithCurrency);

    // Separate account updates from details updates
    const { kind, bank_name, masked_number, interest_rate_annual, monthly_fee, overdraft_limit, ...accountUpdates } = validated;

    // Update account
    const account = await accountRepository.update(id, user.id, accountUpdates);

    // Update bank account details if any detail fields provided
    if (kind !== undefined || bank_name !== undefined || masked_number !== undefined ||
      interest_rate_annual !== undefined || monthly_fee !== undefined || overdraft_limit !== undefined) {
      const supabase = await createClient();
      const detailsUpdate: any = {};

      if (kind !== undefined) detailsUpdate.kind = kind;
      if (bank_name !== undefined) detailsUpdate.bank_name = bank_name;
      if (masked_number !== undefined) detailsUpdate.masked_number = masked_number;
      if (interest_rate_annual !== undefined) detailsUpdate.interest_rate_annual = interest_rate_annual;
      if (monthly_fee !== undefined) detailsUpdate.monthly_fee = monthly_fee;
      if (overdraft_limit !== undefined) detailsUpdate.overdraft_limit = overdraft_limit;

      const { error } = await supabase
        .from('bank_account_details')
        .update(detailsUpdate)
        .eq('account_id', id);

      if (error) throw error;
    }

    // Fetch updated account
    const updatedAccount = await accountRepository.getById(id, user.id);
    if (!updatedAccount) {
      return { success: false, error: 'Cuenta no encontrada tras la actualización' };
    }

    revalidatePath('/dashboard');
    revalidatePath('/accounts');

    return { success: true, data: updatedAccount };
  } catch (error) {
    console.error('Error updating account:', error);

    if (error instanceof Error && 'issues' in error) {
      return { success: false, error: 'Error de validación', details: error };
    }

    return { success: false, error: 'Error al actualizar la cuenta' };
  }
}

export async function getTotalBalanceInPreferredCurrency(endDate?: string): Promise<
  ActionResult<{ total: number; preferredCode: string; preferredSymbol: string }>
> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const supabase = await createClient();

    const baseCurrency = await getBaseCurrency(user.id);
    const preferredCode = baseCurrency.code;
    const preferredSymbol = baseCurrency.symbol;

    type CurrencyRow = { code: string; exchange_rate_to_preferred: number | null };
    const { data: currenciesRaw, error: currError } = await (supabase as any)
      .from('currencies')
      .select('code, exchange_rate_to_preferred')
      .eq('user_id', user.id);

    if (currError) throw currError;
    const currencies = (currenciesRaw ?? []) as CurrencyRow[];

    const bankAccountType = await accountRepository.getAccountTypeByCode('BANK_ACCOUNT');
    if (!bankAccountType) {
      return { success: true, data: { total: 0, preferredCode, preferredSymbol } };
    }

    const accounts = await accountRepository.getAll(user.id);

    // Recalculate balances with endDate
    const accountsWithBalance = await Promise.all(
      accounts.map(async (account) => {
        // 🔐 Pass user.id to enforce IDOR protection inside calculateBalance
        const balance = await accountRepository.calculateBalance(account.id, endDate, user.id);
        return { ...account, balance };
      })
    );

    const bankAccounts = accountsWithBalance.filter((a) => a.account_type_id === bankAccountType.id && a.status === 'ACTIVE');

    const rateByCode = new Map<string, number>();
    for (const c of currencies) {
      const rate = c.exchange_rate_to_preferred;
      rateByCode.set(c.code, rate === null ? 1 : rate);
    }

    let total = 0;
    for (const acc of bankAccounts) {
      const balance = acc.balance ?? 0;
      total += convertToBase(balance, acc.currency_code, preferredCode, rateByCode);
    }

    return {
      success: true,
      data: {
        total: Math.round(total * 100) / 100,
        preferredCode,
        preferredSymbol,
      },
    };
  } catch (error) {
    console.error('Error fetching total balance:', error);
    return { success: false, error: 'Error al obtener el balance total' };
  }
}

export async function deleteBankAccount(id: string): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    await accountRepository.delete(id, user.id);

    revalidatePath('/dashboard');
    revalidatePath('/accounts');

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { success: false, error: 'Error al eliminar la cuenta' };
  }
}
