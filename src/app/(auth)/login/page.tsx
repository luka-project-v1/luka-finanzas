'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { signIn } from '@/lib/actions/auth';

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    startTransition(async () => {
      const result = await signIn(data);
      if (result && !result.success) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="w-full max-w-sm">
      {/* Marca */}
      <div className="text-center mb-8">
        <span className="text-4xl font-bold tracking-tight text-neu-accent">
          Luka
        </span>
        <p className="mt-1 text-sm text-neu-muted">Control de Finanzas Personales</p>
      </div>

      {/* Tarjeta */}
      <div className="neu-card p-8">
        <h1 className="text-lg font-semibold text-foreground mb-1">
          Bienvenido de nuevo
        </h1>
        <p className="text-sm text-neu-muted mb-6">
          Inicia sesión en tu cuenta para continuar.
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
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="neu-input"
              disabled={isPending}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="rounded-neu-sm border border-[#2a1414] bg-[#1a0e0e] px-4 py-3 text-sm text-luka-expense"
            >
              {error}
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
                Iniciando sesión…
              </span>
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </form>

        {/* Divisor */}
        <hr className="neu-divider" />

        <p className="text-center text-sm text-neu-muted">
          ¿No tienes una cuenta?{' '}
          <Link
            href="/signup"
            className="text-neu-accent hover:underline transition-colors"
          >
            Crear una
          </Link>
        </p>
      </div>
    </div>
  );
}
