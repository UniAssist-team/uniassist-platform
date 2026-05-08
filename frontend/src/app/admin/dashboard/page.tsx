'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
    totalUsers: 0,
    totalStaff: 0,
  });
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [topDiscounts, setTopDiscounts] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const [sessionData, allApps, allUsers] = await Promise.all([
          apiRequest('/session'),
          apiRequest('/admin/applications?perPage=100'),
          apiRequest('/admin/users?perPage=100'),
        ]);

        setUser(sessionData);

        // ── Application stats ──────────────────────────────────
        const pending  = allApps.filter((a: any) => a.status === 'pending').length;
        const approved = allApps.filter((a: any) => a.status === 'approved').length;
        const rejected = allApps.filter((a: any) => a.status === 'rejected').length;

        // ── User stats ─────────────────────────────────────────
        const totalStaff = allUsers.filter(
          (u: any) => u.role === 'staff' || u.role === 'admin'
        ).length;
        const totalStudents = allUsers.filter((u: any) => u.role === 'student').length;

        setStats({
          pending,
          approved,
          rejected,
          total: allApps.length,
          totalUsers: totalStudents,
          totalStaff,
        });

        // ── Recent 5 applications ──────────────────────────────
        const sorted = [...allApps].sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setRecentApplications(sorted.slice(0, 5));

        // ── Top discount categories ────────────────────────────
        const counts: Record<string, number> = {};
        allApps.forEach((a: any) => {
          counts[a.discountName] = (counts[a.discountName] || 0) + 1;
        });
        const sorted2 = Object.entries(counts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setTopDiscounts(sorted2);

      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statusStyle = (s: string) =>
    s === 'approved' ? 'bg-green-100 text-green-700' :
    s === 'rejected' ? 'bg-red-100 text-red-700' :
    'bg-yellow-100 text-yellow-700';

  const maxCount = topDiscounts[0]?.count || 1;

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-zinc-50">
        <Sidebar role={user?.role || 'admin'} />

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 bg-white border-b px-8 flex items-center justify-between">
            <h1 className="font-semibold text-zinc-800 text-lg">Admin Dashboard</h1>
            {user && (
              <span className="text-sm text-zinc-500">
                {user.email} ·{' '}
                <span className="font-medium text-zinc-700 capitalize">{user.role}</span>
              </span>
            )}
          </header>

          <main className="p-8 space-y-8">
            {loading ? (
              <p className="text-zinc-400">Loading...</p>
            ) : (
              <>
                {/* ── Greeting ──────────────────────────────────── */}
                <div>
                  <h2 className="text-xl font-semibold text-zinc-800">
                    Good {getTimeOfDay()},{' '}
                    {user?.name || user?.email?.split('@')[0]}
                  </h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    Here is what is happening on the platform today.
                  </p>
                </div>

                {/* ── Stat cards ────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    {
                      label: 'Pending',
                      value: stats.pending,
                      color: 'bg-yellow-50 border-yellow-200',
                      text: 'text-yellow-700',
                      note: 'needs review',
                      action: () => router.push('/admin/applications'),
                    },
                    {
                      label: 'Approved',
                      value: stats.approved,
                      color: 'bg-green-50 border-green-200',
                      text: 'text-green-700',
                      note: 'all time',
                    },
                    {
                      label: 'Rejected',
                      value: stats.rejected,
                      color: 'bg-red-50 border-red-200',
                      text: 'text-red-700',
                      note: 'all time',
                    },
                    {
                      label: 'Total Applications',
                      value: stats.total,
                      color: 'bg-blue-50 border-blue-200',
                      text: 'text-blue-700',
                      note: 'submitted',
                    },
                    {
                      label: 'Students',
                      value: stats.totalUsers,
                      color: 'bg-purple-50 border-purple-200',
                      text: 'text-purple-700',
                      note: 'registered',
                      action: () => router.push('/admin/users'),
                    },
                    {
                      label: 'Staff / Admin',
                      value: stats.totalStaff,
                      color: 'bg-zinc-50 border-zinc-200',
                      text: 'text-zinc-700',
                      note: 'accounts',
                      action: () => router.push('/admin/users'),
                    },
                  ].map((card) => (
                    <div
                      key={card.label}
                      onClick={card.action}
                      className={`border rounded-xl p-4 ${card.color} ${
                        card.action ? 'cursor-pointer hover:shadow-sm transition-shadow' : ''
                      }`}
                    >
                      <p className={`text-2xl font-bold ${card.text}`}>{card.value}</p>
                      <p className={`text-xs font-medium mt-0.5 ${card.text}`}>
                        {card.label}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">{card.note}</p>
                    </div>
                  ))}
                </div>

                {/* ── Bottom two columns ────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Recent applications */}
                  <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                      <h3 className="font-semibold text-zinc-800 text-sm">
                        Recent Applications
                      </h3>
                      <button
                        onClick={() => router.push('/admin/applications')}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View all →
                      </button>
                    </div>

                    {recentApplications.length === 0 ? (
                      <p className="px-6 py-8 text-sm text-zinc-400 text-center">
                        No applications yet.
                      </p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="bg-zinc-50 text-zinc-500 text-left">
                          <tr>
                            <th className="px-6 py-3 font-medium text-xs">Student</th>
                            <th className="px-6 py-3 font-medium text-xs">Discount</th>
                            <th className="px-6 py-3 font-medium text-xs">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {recentApplications.map((app) => (
                            <tr
                              key={app.id}
                              onClick={() => router.push('/admin/applications')}
                              className="cursor-pointer hover:bg-zinc-50 transition-colors"
                            >
                              <td className="px-6 py-3 text-zinc-600 text-xs">
                                {app.userEmail}
                              </td>
                              <td className="px-6 py-3 text-zinc-800 text-xs font-medium">
                                {app.discountName}
                              </td>
                              <td className="px-6 py-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyle(
                                    app.status
                                  )}`}
                                >
                                  {app.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Top discount categories */}
                  <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-100">
                      <h3 className="font-semibold text-zinc-800 text-sm">
                        Most Applied Discount Categories
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Based on all submitted applications
                      </p>
                    </div>

                    {topDiscounts.length === 0 ? (
                      <p className="px-6 py-8 text-sm text-zinc-400 text-center">
                        No applications yet.
                      </p>
                    ) : (
                      <div className="px-6 py-4 space-y-4">
                        {topDiscounts.map((item, i) => (
                          <div key={item.name}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-zinc-700 font-medium">
                                {item.name}
                              </span>
                              <span className="text-xs text-zinc-400">
                                {item.count} application{item.count !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="w-full bg-zinc-100 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-blue-500"
                                style={{
                                  width: `${Math.round((item.count / maxCount) * 100)}%`,
                                  opacity: 1 - i * 0.15,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                {/* ── Quick actions ──────────────────────────────── */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-700 mb-3">
                    Quick Actions
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {[
                      {
                        label: '📋  Review pending applications',
                        desc: `${stats.pending} waiting`,
                        href: '/admin/applications',
                        highlight: stats.pending > 0,
                      },
                      {
                        label: '👤  Manage users',
                        desc: `${stats.totalUsers} students`,
                        href: '/admin/users',
                        highlight: false,
                      },
                    ].map((action) => (
                      <button
                        key={action.label}
                        onClick={() => router.push(action.href)}
                        className={`flex items-center gap-3 px-5 py-3 rounded-xl border text-left transition-colors ${
                          action.highlight
                            ? 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100'
                            : 'border-zinc-200 bg-white hover:bg-zinc-50'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium text-zinc-800">
                            {action.label}
                          </p>
                          <p className="text-xs text-zinc-400 mt-0.5">{action.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

              </>
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}