'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };

const signUpSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

const signInSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
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
      return { success: false, error: 'Error de validación', details: error.errors };
    }

    return { success: false, error: 'Error al crear la cuenta' };
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
  } catch (error) {
    console.error('Error signing in:', error);

    if (error instanceof z.ZodError) {
      return { success: false, error: 'Error de validación', details: error.errors };
    }

    return { success: false, error: 'Error al iniciar sesión' };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signOut(): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }
  } catch (error) {
    console.error('Error signing out:', error);

    return { success: false, error: 'Error al cerrar sesión' };
  }

  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  return user;
}
