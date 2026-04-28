'use client';
import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useRouter } from 'next/navigation';

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
    } catch (err: any) {
      setError(err.message || 'Registration failed. Email may already be in use.');
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

        {/* Form card */}
        <form
          onSubmit={handleRegister}
          className="bg-white border border-zinc-200 rounded-xl p-8 shadow-sm"
        >

          {/* Back button */}
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-600 mb-5 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to login
          </button>

          <h2 className="text-lg font-semibold text-zinc-800 mb-1">
            Create student account
          </h2>
          <p className="text-xs text-zinc-400 mb-5">
            Student accounts only. Admin and staff accounts are created by administrators.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Full name <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              className="w-full p-2 border border-zinc-300 rounded-lg bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 text-black text-sm"
              placeholder="e.g. Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full p-2 border border-zinc-300 rounded-lg bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 text-black text-sm"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full p-2 border border-zinc-300 rounded-lg bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 text-black text-sm"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          {/* Confirm password */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Confirm password
            </label>
            <input
              type="password"
              className="w-full p-2 border border-zinc-300 rounded-lg bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 text-black text-sm"
              placeholder="Repeat your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full p-2.5 rounded-lg font-medium text-sm bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <p className="mt-4 text-center text-sm text-zinc-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-blue-600 hover:underline"
            >
              Sign in
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}