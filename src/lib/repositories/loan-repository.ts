import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/types/database.types';

type LoanGiven = Database['public']['Tables']['loans_given']['Row'];
type LoanGivenInsert = Database['public']['Tables']['loans_given']['Insert'];
type LoanGivenUpdate = Database['public']['Tables']['loans_given']['Update'];

type LoanReceived = Database['public']['Tables']['loans_received']['Row'];
type LoanReceivedInsert = Database['public']['Tables']['loans_received']['Insert'];
type LoanReceivedUpdate = Database['public']['Tables']['loans_received']['Update'];

type LoanGivenPayment = Database['public']['Tables']['loan_given_payments']['Row'];
type LoanGivenPaymentInsert = Database['public']['Tables']['loan_given_payments']['Insert'];

type LoanReceivedPayment = Database['public']['Tables']['loan_received_payments']['Row'];
type LoanReceivedPaymentInsert = Database['public']['Tables']['loan_received_payments']['Insert'];

export const loanRepository = {
  // Loans Given
  async createGiven(data: LoanGivenInsert): Promise<LoanGiven> {
    const supabase = await createClient();
    const { data: loan, error } = await supabase
      .from('loans_given')
      .insert(data as any)
      .select()
      .single();

    if (error) throw error;
    return loan;
  },

  async getGivenById(id: string, userId: string): Promise<LoanGiven | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('loans_given')
      .select(`
        *,
        currencies (*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as any;
  },

  async getAllGiven(userId: string): Promise<LoanGiven[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('loans_given')
      .select(`
        *,
        currencies (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as any;
  },

  async updateGiven(id: string, userId: string, updates: LoanGivenUpdate): Promise<LoanGiven> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('loans_given')
      .update(updates as any)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteGiven(id: string, userId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from('loans_given')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Loans Received
  async createReceived(data: LoanReceivedInsert): Promise<LoanReceived> {
    const supabase = await createClient();
    const { data: loan, error } = await supabase
      .from('loans_received')
      .insert(data as any)
      .select()
      .single();

    if (error) throw error;
    return loan;
  },

  async getReceivedById(id: string, userId: string): Promise<LoanReceived | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('loans_received')
      .select(`
        *,
        currencies (*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as any;
  },

  async getAllReceived(userId: string): Promise<LoanReceived[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('loans_received')
      .select(`
        *,
        currencies (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as any;
  },

  async updateReceived(id: string, userId: string, updates: LoanReceivedUpdate): Promise<LoanReceived> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('loans_received')
      .update(updates as any)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteReceived(id: string, userId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from('loans_received')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Payments for Loans Given
  async addGivenPayment(data: LoanGivenPaymentInsert): Promise<LoanGivenPayment> {
    const supabase = await createClient();
    const { data: payment, error } = await supabase
      .from('loan_given_payments')
      .insert(data as any)
      .select()
      .single();

    if (error) throw error;

    // Update loan amount_paid
    const loan = await this.getGivenById(payment.loan_id, '');
    if (loan) {
      const newAmountPaid = Number(loan.amount_paid) + Number(payment.amount);
      const isFullyPaid = newAmountPaid >= Number(loan.amount);
      await supabase
        .from('loans_given')
        .update({ 
          amount_paid: newAmountPaid,
          is_fully_paid: isFullyPaid
        } as any)
        .eq('id', payment.loan_id);
    }

    return payment;
  },

  async getGivenPayments(loanId: string): Promise<LoanGivenPayment[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('loan_given_payments')
      .select('*')
      .eq('loan_id', loanId)
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return (data || []) as any;
  },

  // Payments for Loans Received
  async addReceivedPayment(data: LoanReceivedPaymentInsert): Promise<LoanReceivedPayment> {
    const supabase = await createClient();
    const { data: payment, error } = await supabase
      .from('loan_received_payments')
      .insert(data as any)
      .select()
      .single();

    if (error) throw error;

    // Update loan amount_paid
    const loan = await this.getReceivedById(payment.loan_id, '');
    if (loan) {
      const newAmountPaid = Number(loan.amount_paid) + Number(payment.amount);
      const isFullyPaid = newAmountPaid >= Number(loan.amount);
      await supabase
        .from('loans_received')
        .update({ 
          amount_paid: newAmountPaid,
          is_fully_paid: isFullyPaid
        } as any)
        .eq('id', payment.loan_id);
    }

    return payment;
  },

  async getReceivedPayments(loanId: string): Promise<LoanReceivedPayment[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('loan_received_payments')
      .select('*')
      .eq('loan_id', loanId)
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return (data || []) as any;
  },
};
