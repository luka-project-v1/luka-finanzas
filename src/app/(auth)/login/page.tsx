'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn({ email, password });
      
      if (result && 'error' in result) {
        setError(result.error);
      }
    } catch (err) {
      // Handle redirect
      if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
        throw err;
      }
      setError('Ocurrió un error. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#D97757] rounded-2xl mb-6">
            <span className="text-white font-bold text-3xl">L</span>
          </div>
          <h1 className="text-4xl font-bold text-[#1A1A1A] mb-3">Luka</h1>
          <p className="text-[#6B6B6B] text-lg">Inicia sesión en tu cuenta</p>
        </div>

        <div className="bg-white rounded-3xl p-10 card-shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1A1A1A] mb-3">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 border border-[#E5E3DE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1A1A1A] mb-3">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 border border-[#E5E3DE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent bg-white text-[#1A1A1A] transition-all"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D97757] text-white py-4 px-6 rounded-xl font-semibold hover:bg-[#C66647] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-lg mt-8"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[#6B6B6B]">
              ¿No tienes una cuenta?{' '}
              <Link href="/signup" className="text-[#D97757] hover:text-[#C66647] font-semibold transition-colors">
                Regístrate
              </Link>
            </p>
          </div>

          {/* Demo credentials hint */}
          <div className="mt-6 p-4 bg-[#F5F3EE] rounded-xl">
            <p className="text-xs text-[#6B6B6B] text-center">
              <strong>Demo:</strong> luca@test.com / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
