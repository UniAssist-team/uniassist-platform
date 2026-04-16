'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest('/session'),
      apiRequest('/applications'),
    ]).then(([u, apps]) => {
      setUser(u);
      setApplications(apps);
    }).finally(() => setLoading(false));
  }, []);

  const pending = applications.filter(a => a.status === 'pending').length;
  const approved = applications.filter(a => a.status === 'approved').length;
  const rejected = applications.filter(a => a.status === 'rejected').length;

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-zinc-50">
        <Sidebar role={user?.role || 'student'} />
        <div className="flex-1 flex flex-col">
          <header className="h-16 bg-white border-b px-8 flex items-center justify-between">
            <h1 className="font-semibold text-zinc-800 text-lg">Dashboard</h1>
            {user && (
              <span className="text-sm text-zinc-500">{user.email} · {user.role}</span>
            )}
          </header>
          <main className="p-8">
            {loading ? (
              <p className="text-zinc-400">Loading...</p>
            ) : (
              <>
                <p className="text-zinc-600 mb-6">
                  Welcome back{user?.name ? `, ${user.name}` : ''}. Here is a summary of your activity.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {[
                    { label: 'Pending', count: pending, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
                    { label: 'Approved', count: approved, color: 'bg-green-50 border-green-200 text-green-700' },
                    { label: 'Rejected', count: rejected, color: 'bg-red-50 border-red-200 text-red-700' },
                  ].map(card => (
                    <div key={card.label} className={`border rounded-xl p-6 ${card.color}`}>
                      <p className="text-sm font-medium">{card.label} Applications</p>
                      <p className="text-3xl font-bold mt-1">{card.count}</p>
                    </div>
                  ))}
                </div>
                {applications.length > 0 && (
                  <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-100">
                      <h2 className="font-semibold text-zinc-800">Recent Applications</h2>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-50 text-zinc-500 text-left">
                        <tr>
                          <th className="px-6 py-3 font-medium">Discount</th>
                          <th className="px-6 py-3 font-medium">Status</th>
                          <th className="px-6 py-3 font-medium">Submitted</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {applications.slice(0, 5).map(app => (
                          <tr key={app.id}>
                            <td className="px-6 py-3 text-zinc-800">{app.discountName}</td>
                            <td className="px-6 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                app.status === 'approved' ? 'bg-green-100 text-green-700' :
                                app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>{app.status}</span>
                            </td>
                            <td className="px-6 py-3 text-zinc-400">
                              {new Date(app.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}