'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { useUser } from '@/contexts/UserContext';

export default function ApplicationsPage() {
  const { user } = useUser();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    apiRequest('/applications')
      .then(setApplications)
      .finally(() => setLoading(false));
  }, []);

  const statusStyle = (s: string) =>
    s === 'approved' ? 'bg-green-100 text-green-700' :
    s === 'rejected' ? 'bg-red-100 text-red-700' :
    'bg-yellow-100 text-yellow-700';

  return (
    <div className="flex min-h-screen bg-zinc-50">
        <Sidebar role={user?.role || 'student'} />
        <div className="flex-1 flex flex-col">
          <header className="h-16 bg-white border-b px-8 flex items-center justify-between">
            <h1 className="font-semibold text-zinc-800 text-lg">My Applications</h1>
            <button
              onClick={() => router.push('/discounts')}
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + New application
            </button>
          </header>
          <main className="p-8">
            {loading ? (
              <p className="text-zinc-400">Loading...</p>
            ) : applications.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-zinc-400 mb-4">No applications yet.</p>
                <button
                  onClick={() => router.push('/discounts')}
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Browse discounts to apply
                </button>
              </div>
            ) : (
              <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-zinc-500 text-left">
                    <tr>
                      <th className="px-6 py-3 font-medium">Discount</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Submitted</th>
                      <th className="px-6 py-3 font-medium">Review note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {applications.map(app => (
                      <tr key={app.id}>
                        <td className="px-6 py-3 font-medium text-zinc-800">{app.discountName}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${statusStyle(app.status)}`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-zinc-400">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 text-zinc-500 text-xs">
                          {app.reviewNote || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        </div>
    </div>
  );
}