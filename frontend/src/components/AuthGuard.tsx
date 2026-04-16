'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('AuthGuard - Token in localStorage:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
    
    if (!token) {
      console.log('AuthGuard - No token, redirecting to /login');
      router.replace('/login');
    } else {
      console.log('AuthGuard - Token found, rendering children');
      setChecked(true);
    }
  }, [router]);

  if (!checked) {
    console.log('AuthGuard - Waiting for check...');
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  return <>{children}</>;
}