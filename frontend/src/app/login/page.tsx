'use client';
import { useState } from 'react';
import { apiRequest } from '@/lib/api'; 
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const data = await apiRequest('/session/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      // DEBUG: See what the API actually returns
      console.log('🔍 API Response:', data);
      console.log('🔍 Token from response:', data.token);
      console.log('🔍 Full response keys:', Object.keys(data));
      
      // Try different possible token field names
      const token = data.token || data.accessToken || data.access_token || data.jwt;
      
      if (!token) {
        console.error('❌ No token found in response!');
        setError('Authentication failed: No token received');
        return;
      }
      
      // Save the JWT token
      localStorage.setItem('token', token);
      console.log('✅ Token saved to localStorage');
      
      // Verify it was saved
      const savedToken = localStorage.getItem('token');
      console.log('Verified token in localStorage:', savedToken ? 'Yes' : 'No');
      
      // Redirect to the dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50">
      <form onSubmit={handleLogin} className="p-8 bg-white shadow-md border border-zinc-200 rounded-xl w-96">
        <h1 className="text-2xl font-bold mb-6 text-center text-zinc-900">Login</h1>
        
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
          <input 
            type="email" 
            className="w-full p-2 border rounded bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 text-black"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
          <input 
            type="password" 
            className="w-full p-2 border rounded bg-zinc-50 outline-none focus:ring-2 focus:ring-blue-500 text-black"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 font-medium transition-colors">
          Sign In
        </button>

        <p className="mt-4 text-center text-sm text-zinc-600">
          Don't have an account? <a href="/register" className="text-blue-600 hover:underline">Register here</a>
        </p>
      </form>
    </div>
  );
}