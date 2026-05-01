'use client';
import AuthGuard from '@/components/AuthGuard';
import { UserProvider } from '@/contexts/UserContext';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <UserProvider>{children}</UserProvider>
    </AuthGuard>
  );
}
