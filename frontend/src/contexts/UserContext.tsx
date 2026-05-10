'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

export type User = {
  id: string;
  email: string;
  role: 'student' | 'staff' | 'admin';
  name?: string | null;
};

type UserContextValue = {
  user: User | null;
  loading: boolean;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    apiRequest('/session')
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-100 via-white to-indigo-50/40 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-red-200/90 bg-white/95 p-6 shadow-xl shadow-slate-900/10">
          <h2 className="mb-2 font-semibold text-red-700">
            Couldn&apos;t load your session
          </h2>
          <p className="mb-4 text-sm text-slate-600">{error.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  return ctx;
}
