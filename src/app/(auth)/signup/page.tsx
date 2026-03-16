'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { signUp } from '@/lib/actions/auth';
import { LukaBrand } from '@/components/shared/luka-logo';

type SignUpState =
  | { status: 'idle' }
  | { status: 'success'; email: string }
  | { status: 'error'; message: string };

export default function SignUpPage() {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<SignUpState>({ status: 'idle' });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ status: 'idle' });

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirm = formData.get('confirm') as string;

    if (password !== confirm) {
      setState({ status: 'error', message: 'Las contraseñas no coinciden.' });
      return;
    }

    const data = {
      email: formData.get('email') as string,
      password,
    };

    startTransition(async () => {
      const result = await signUp(data);
      if (result.success) {
        setState({ status: 'success', email: result.data.email });
      } else {
        setState({ status: 'error', message: result.error });
      }
    });
  }

  if (state.status === 'success') {
    return (
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 flex flex-col items-center">
          <LukaBrand className="text-4xl font-bold tracking-tight text-neu-accent" />
          <p className="mt-1 text-sm text-neu-muted">Control de Finanzas Personales</p>
        </div>

        <div className="neu-card p-8 text-center space-y-4">
          {/* Ícono de verificación */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full shadow-soft-out">
            <svg
              className="h-7 w-7 text-luka-income"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">Revisa tu correo</h2>
            <p className="mt-2 text-sm text-neu-muted">
              Enviamos un enlace de confirmación a{' '}
              <span className="text-foreground font-medium">{state.email}</span>.
              Haz clic en el enlace para activar tu cuenta.
            </p>
          </div>

          <Link
            href="/login"
            className="neu-btn neu-btn-primary inline-flex w-full justify-center mt-2"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      {/* Marca */}
      <div className="text-center mb-8 flex flex-col items-center">
        <LukaBrand />
        <p className="mt-1 text-sm text-neu-muted">Control de Finanzas Personales</p>
      </div>

      {/* Tarjeta */}
      <div className="neu-card p-8">
        <h1 className="text-lg font-semibold text-foreground mb-1">
          Crear cuenta
        </h1>
        <p className="text-sm text-neu-muted mb-6">
          Empieza a gestionar tus finanzas hoy.
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Correo */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-medium text-neu-muted uppercase tracking-wider"
            >
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="tu@correo.com"
              className="neu-input"
              disabled={isPending}
            />
          </div>

          {/* Contraseña */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-medium text-neu-muted uppercase tracking-wider"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Mín. 8 caracteres"
              className="neu-input"
              disabled={isPending}
            />
          </div>

          {/* Confirmar contraseña */}
          <div className="space-y-1.5">
            <label
              htmlFor="confirm"
              className="block text-xs font-medium text-neu-muted uppercase tracking-wider"
            >
              Confirmar contraseña
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Repite tu contraseña"
              className="neu-input"
              disabled={isPending}
            />
          </div>

          {/* Error */}
          {state.status === 'error' && (
            <div
              role="alert"
              className="rounded-neu-sm border border-[#2a1414] bg-[#1a0e0e] px-4 py-3 text-sm text-luka-expense"
            >
              {state.message}
            </div>
          )}

          {/* Enviar */}
          <button
            type="submit"
            disabled={isPending}
            className="neu-btn neu-btn-primary w-full mt-2"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Creando cuenta…
              </span>
            ) : (
              'Crear cuenta'
            )}
          </button>
        </form>

        {/* Divisor */}
        <hr className="neu-divider" />

        <p className="text-center text-sm text-neu-muted">
          ¿Ya tienes una cuenta?{' '}
          <Link
            href="/login"
            className="text-neu-accent hover:underline transition-colors"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
