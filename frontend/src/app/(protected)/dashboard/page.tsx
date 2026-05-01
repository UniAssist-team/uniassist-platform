'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

type Stats = { pending: number; approved: number; rejected: number };

export default function DashboardPage() {
  const { user } = useUser();
  const isStaff = user?.role === 'admin' || user?.role === 'staff';

  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (isStaff) {
      Promise.all([apiRequest('/admin/stats'), apiRequest('/discounts')])
        .then(([s, d]) => { setStats(s); setDiscounts(d); })
        .finally(() => setLoading(false));
    } else {
      apiRequest('/applications')
        .then(setApplications)
        .finally(() => setLoading(false));
    }
  }, [user, isStaff]);

  const studentCounts = {
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };
  const counts = isStaff ? (stats ?? { pending: 0, approved: 0, rejected: 0 }) : studentCounts;

  return (
    <>
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
              {isStaff
                ? 'Overview of all applications and the discounts available in the system.'
                : `Welcome back${user?.name ? `, ${user.name}` : ''}. Here is a summary of your activity.`}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Pending', count: counts.pending, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
                { label: 'Approved', count: counts.approved, color: 'bg-green-50 border-green-200 text-green-700' },
                { label: 'Rejected', count: counts.rejected, color: 'bg-red-50 border-red-200 text-red-700' },
              ].map(card => (
                <div key={card.label} className={`border rounded-xl p-6 ${card.color}`}>
                  <p className="text-sm font-medium">{card.label} Applications</p>
                  <p className="text-3xl font-bold mt-1">{card.count}</p>
                </div>
              ))}
            </div>

            {isStaff ? (
              <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-100">
                  <h2 className="font-semibold text-zinc-800">Available Discounts</h2>
                </div>
                {discounts.length === 0 ? (
                  <p className="px-6 py-4 text-zinc-400 text-sm">No discounts configured.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50 text-zinc-500 text-left">
                      <tr>
                        <th className="px-6 py-3 font-medium">Name</th>
                        <th className="px-6 py-3 font-medium">Description</th>
                        <th className="px-6 py-3 font-medium">Required documents</th>
                        <th className="px-6 py-3 font-medium">Benefits</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {discounts.map(d => (
                        <tr key={d.id}>
                          <td className="px-6 py-3 text-zinc-800 font-medium">{d.name}</td>
                          <td className="px-6 py-3 text-zinc-500">{d.description}</td>
                          <td className="px-6 py-3 text-zinc-500">{d.requiredDocuments}</td>
                          <td className="px-6 py-3 text-zinc-500">{d.benefits}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : applications.length > 0 ? (
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
            ) : null}
          </>
        )}
      </main>
    </>
  );
}
