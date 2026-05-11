'use client';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import { UserProvider, useUser } from '@/contexts/UserContext';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <UserProvider>
        <ProtectedShell>{children}</ProtectedShell>
      </UserProvider>
    </AuthGuard>
  );
}

function ProtectedShell({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  return (
    <div className="flex min-h-screen bg-slate-200/40">
      <Sidebar role={user?.role || 'student'} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-gradient-to-b from-slate-100 via-white to-indigo-50/40">
        {children}
      </div>
    </div>
  );
}
