'use client';
import { useState } from 'react';
import { apiRequest } from '@/lib/api'; 
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Calls your backend on http://localhost:3001
      const data = await apiRequest('/session/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // Saves the token so you stay logged in
      localStorage.setItem('token', data.token);
      
      // Success! Move to the dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50">
      <form onSubmit={handleSubmit} className="p-8 bg-white shadow-md border border-zinc-200 rounded-xl w-96">
        <h1 className="text-2xl font-bold mb-6 text-center text-zinc-900">Create Account</h1>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        <input 
          type="email" placeholder="Email" 
          className="w-full p-2 mb-4 border rounded bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 text-black"
          value={email} onChange={(e) => setEmail(e.target.value)} required
        />
        <input 
          type="password" placeholder="Password" 
          className="w-full p-2 mb-6 border rounded bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 text-black"
          value={password} onChange={(e) => setPassword(e.target.value)} required
        />
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 font-medium">
          Sign Up
        </button>
      </form>
    </div>
  );
}