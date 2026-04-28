'use client';
import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [mode, setMode] = useState<'student' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get('registered') === 'true';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setChecking(false);
      return;
    }

    apiRequest('/session')
      .then((user) => {
        if (user.role === 'admin' || user.role === 'staff') {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/dashboard');
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        setChecking(false);
      });
  }, [router]);

  if (checking) return null;

  const switchMode = (m: 'student' | 'admin') => {
    setMode(m);
    setError('');
    setEmail('');
    setPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiRequest('/session/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem('token', data.token);

      if (data.user.role === 'admin' || data.user.role === 'staff') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50">
      <div className="w-96">

        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-zinc-900">UniAssist</h1>
          <p className="text-sm text-zinc-500 mt-1">
            University Discount Management Platform
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-zinc-200 rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => switchMode('student')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === 'student'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => switchMode('admin')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === 'admin'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Admin / Staff
          </button>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleLogin}
          className="bg-white border border-zinc-200 rounded-xl p-8 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-zinc-800 mb-5">
            {mode === 'admin' ? 'Admin & Staff Sign In' : 'Student Sign In'}
          </h2>

          {/* Success banner from registration */}
          {justRegistered && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-5">
              <p className="text-green-700 text-sm font-medium">
                Account created! You can now sign in.
              </p>
            </div>
          )}

          {mode === 'admin' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-5">
              <p className="text-xs text-blue-700 font-medium">
                Admin and staff accounts are created by the system administrator.
                Contact your admin if you need access.
              </p>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full p-2 border border-zinc-300 rounded-lg bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 text-black text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full p-2 border border-zinc-300 rounded-lg bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 text-black text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full p-2.5 rounded-lg font-medium text-sm transition-colors ${
              mode === 'admin'
                ? 'bg-zinc-800 hover:bg-zinc-900 text-white disabled:opacity-50'
                : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
            }`}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {mode === 'student' && (
            <p className="mt-4 text-center text-sm text-zinc-600">
              Don't have an account?{' '}
              <a href="/register" className="text-blue-600 hover:underline">
                Register here
              </a>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}