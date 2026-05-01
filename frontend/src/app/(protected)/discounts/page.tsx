'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import Sidebar from '@/components/Sidebar';

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    Promise.all([apiRequest('/session'), apiRequest('/discounts')])
      .then(([u, d]) => { setUser(u); setDiscounts(d); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen bg-zinc-50">
        <Sidebar role={user?.role || 'student'} />
        <div className="flex-1 flex flex-col">
          <header className="h-16 bg-white border-b px-8 flex items-center">
            <h1 className="font-semibold text-zinc-800 text-lg">Available Discounts</h1>
          </header>
          <main className="p-8">
            {loading ? (
              <p className="text-zinc-400">Loading...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {discounts.map(d => (
                  <div key={d.id} className="bg-white border border-zinc-200 rounded-xl p-6">
                    <h2 className="font-semibold text-zinc-800 text-base mb-1">{d.name}</h2>
                    <p className="text-sm text-zinc-500 mb-3">{d.description}</p>
                    <div className="text-xs space-y-1">
                      <p><span className="font-medium text-zinc-600">Required documents: </span>
                        <span className="text-zinc-500">{d.requiredDocuments}</span>
                      </p>
                      <p><span className="font-medium text-zinc-600">Benefits: </span>
                        <span className="text-zinc-500">{d.benefits}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => router.push('/applications/new?discountId=' + d.id + '&discountName=' + encodeURIComponent(d.name))}
                      className="mt-4 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Apply for this discount
                    </button>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
    </div>
  );
}