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
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar role={user?.role || 'student'} />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
