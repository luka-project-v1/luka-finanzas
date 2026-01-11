'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function signUp(data: unknown): Promise<ActionResult<{ email: string }>> {
  try {
    const validated = signUpSchema.parse(data);
    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: { email: validated.email } };
  } catch (error) {
    console.error('Error signing up:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation error', details: error.errors };
    }

    return { success: false, error: 'Failed to sign up' };
  }
}

export async function signIn(data: unknown): Promise<ActionResult<void>> {
  try {
    const validated = signInSchema.parse(data);
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/', 'layout');
    redirect('/dashboard');
  } catch (error) {
    console.error('Error signing in:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation error', details: error.errors };
    }

    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }

    return { success: false, error: 'Failed to sign in' };
  }
}

export async function signOut(): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/', 'layout');
    redirect('/login');
  } catch (error) {
    console.error('Error signing out:', error);
    
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }

    return { success: false, error: 'Failed to sign out' };
  }
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  return user;
}
