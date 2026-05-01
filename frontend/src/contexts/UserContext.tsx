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
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <div className="bg-white border border-red-200 rounded-xl p-6 max-w-sm shadow-sm">
          <h2 className="font-semibold text-red-700 mb-2">Couldn&apos;t load your session</h2>
          <p className="text-sm text-zinc-600 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
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
