'use client';

import { Suspense, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AuthShell,
  authCardClass,
  authFieldClass,
  authLabelClass,
  authLinkClass,
  authPrimaryButtonClass,
} from '@/components/auth/AuthShell';

function LoginPageFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-100 via-white to-indigo-50/40 px-6">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"
        aria-hidden
      />
      <p className="mt-4 text-sm text-slate-600">Loading…</p>
    </div>
  );
}

function LoginContent() {
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

  if (checking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-100 via-white to-indigo-50/40 px-6">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"
          aria-hidden
        />
        <p className="mt-4 text-sm text-slate-600">Checking your session…</p>
      </div>
    );
  }

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
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600/90">
          Welcome back
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Sign in to continue
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Access your scholarship applications and uploaded documents in one place.
        </p>
      </div>

      <form onSubmit={handleLogin} className={authCardClass}>
        <h2 className="text-lg font-semibold text-slate-900">Sign in</h2>
        <p className="mt-1 text-sm text-slate-500">
          Students use the email provided during registration.
        </p>

        {justRegistered && (
          <div className="mt-5 rounded-xl border border-emerald-200/90 bg-emerald-50/90 px-4 py-3">
            <p className="text-sm font-medium text-emerald-900">
              Account created — you can sign in below.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-center text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="login-email" className={authLabelClass}>
              Email
            </label>
            <input
              id="login-email"
              type="email"
              className={authFieldClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="login-password" className={authLabelClass}>
              Password
            </label>
            <input
              id="login-password"
              type="password"
              className={authFieldClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`${authPrimaryButtonClass} mt-8`}
        >
          {loading ? (
            <>
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-hidden
              />
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </button>

        <p className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <a href="/register" className={authLinkClass}>
            Create a student account
          </a>
        </p>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginContent />
    </Suspense>
  );
}
