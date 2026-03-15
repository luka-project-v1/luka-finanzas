'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { signIn, signInWithOAuth, type OAuthProvider } from '@/lib/actions/auth';

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleOAuthSignIn(provider: OAuthProvider) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await signInWithOAuth(provider);
        if (result?.success === false) {
          setError(result.error);
        }
      } catch (err) {
        setError('Ocurrió un error inesperado al conectar con el proveedor.');
      }
    });
  }



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
      if (result?.success === false) {
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
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-neu-divider"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#121212] px-2 text-neu-muted">O continúa con</span>
          </div>
        </div>

        {/* Botones Sociales */}
        <div className="space-y-3">
          <button
            onClick={() => handleOAuthSignIn('google')}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-[#747775] bg-white px-4 py-2.5 text-sm font-medium text-[#1f1f1f] transition hover:bg-[#f8f9fa] disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 12-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>

          {/*
          <button
            onClick={() => handleOAuthSignIn('apple')}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1a1a1a] disabled:opacity-50"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.11.78 1.12-.1 2.22-.83 3.45-.78 1.5.07 2.62.61 3.35 1.64-3.1 1.83-2.6 6-.08 7.21-.6 1.53-1.41 3.03-2.83 4.12zM12.03 7.25c-.02-2.23 1.8-4.07 3.95-4.25.26 2.41-1.92 4.49-3.95 4.25z" />
            </svg>
            Sign in with Apple
          </button>
          */}
        </div>


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
