'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
  AuthShell,
  authCardClass,
  authFieldClass,
  authLabelClass,
  authLinkClass,
  authPrimaryButtonClass,
} from '@/components/auth/AuthShell';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

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
      });
  }, [router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await apiRequest('/session/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });

      router.push('/login?registered=true');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Registration failed.';
      setError(message || 'Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600/90">
          New student
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Create your account
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Apply for scholarships, upload documents, and track status from one profile.
        </p>
      </div>

      <form onSubmit={handleRegister} className={authCardClass}>
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-800"
        >
          <svg
            className="h-4 w-4 transition group-hover:-translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to sign in
        </button>

        <h2 className="text-lg font-semibold text-slate-900">
          Student registration
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Student accounts only. Staff and admin accounts are created by
          administrators.
        </p>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="register-name" className={authLabelClass}>
              Full name{' '}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="register-name"
              type="text"
              className={authFieldClass}
              placeholder="e.g. Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="register-email" className={authLabelClass}>
              Email
            </label>
            <input
              id="register-email"
              type="email"
              className={authFieldClass}
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="register-password" className={authLabelClass}>
              Password
            </label>
            <input
              id="register-password"
              type="password"
              className={authFieldClass}
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div>
            <label htmlFor="register-confirm" className={authLabelClass}>
              Confirm password
            </label>
            <input
              id="register-confirm"
              type="password"
              className={authFieldClass}
              placeholder="Repeat your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
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
              Creating account…
            </>
          ) : (
            'Create account'
          )}
        </button>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already registered?{' '}
          <button
            type="button"
            onClick={() => router.push('/login')}
            className={`${authLinkClass} bg-transparent`}
          >
            Sign in instead
          </button>
        </p>
      </form>
    </AuthShell>
  );
}
