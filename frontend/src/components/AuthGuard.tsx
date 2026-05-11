'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.replace('/login');
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) {
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

  return <>{children}</>;
}
