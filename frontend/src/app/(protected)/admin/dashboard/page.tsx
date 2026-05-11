'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import PageHeader from '@/components/layout/PageHeader';
import {
  dataTableHeadClass,
  dataTableWrapClass,
  statCardBaseClass,
} from '@/components/layout/appChrome';

type Stats = {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  totalUsers: number | null;
  totalStaff: number | null;
};

export default function AdminDashboardPage() {
  const { user } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
    totalUsers: null,
    totalStaff: null,
  });
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [topDiscounts, setTopDiscounts] = useState<{ name: string; count: number }[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const sessionUser = user;

    async function load() {
      try {
        const isAdmin = sessionUser.role === 'admin';
        const appsQuery =
          sessionUser.role === 'staff'
            ? '/admin/applications?perPage=100&assignedTo=all'
            : '/admin/applications?perPage=100';

        const requests: Promise<any>[] = [
          apiRequest('/admin/stats'),
          apiRequest(appsQuery),
        ];
        if (isAdmin) {
          requests.push(apiRequest('/admin/users?perPage=100'));
        }

        const results = await Promise.all(requests);
        const statsData = results[0] as {
          pending: number;
          approved: number;
          rejected: number;
        };
        const allApps = results[1] as any[];
        const allUsers = isAdmin ? (results[2] as any[]) : [];

        const totalStaff = isAdmin
          ? allUsers.filter((u: any) => u.role === 'staff' || u.role === 'admin')
              .length
          : null;
        const totalStudents = isAdmin
          ? allUsers.filter((u: any) => u.role === 'student').length
          : null;

        setStats({
          pending: statsData.pending,
          approved: statsData.approved,
          rejected: statsData.rejected,
          total: statsData.pending + statsData.approved + statsData.rejected,
          totalUsers: totalStudents,
          totalStaff,
        });

        const sorted = [...allApps].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setRecentApplications(sorted.slice(0, 5));

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
  }, [user]);

  const statusStyle = (s: string) =>
    s === 'approved'
      ? 'bg-emerald-100 text-emerald-800'
      : s === 'rejected'
        ? 'bg-red-100 text-red-800'
        : 'bg-amber-100 text-amber-900';

  const maxCount = topDiscounts[0]?.count || 1;

  const isAdmin = user?.role === 'admin';

  const commonStatCards: {
    label: string;
    value: number | null;
    note: string;
    border: string;
    onNavigate?: () => void;
  }[] = [
    {
      label: 'Pending',
      value: stats.pending,
      note: 'Needs review',
      border: 'border-l-amber-400',
      onNavigate: () => router.push('/admin/applications'),
    },
    {
      label: 'Approved',
      value: stats.approved,
      note: 'All time',
      border: 'border-l-emerald-500',
    },
    {
      label: 'Rejected',
      value: stats.rejected,
      note: 'All time',
      border: 'border-l-rose-500',
    },
    {
      label: 'Total applications',
      value: stats.total,
      note: 'All statuses',
      border: 'border-l-indigo-500',
    },
  ];

  const adminStatCards: typeof commonStatCards = [
    {
      label: 'Students',
      value: stats.totalUsers ?? 0,
      note: 'Registered',
      border: 'border-l-violet-500',
      onNavigate: () => router.push('/admin/users'),
    },
    {
      label: 'Staff / admin',
      value: stats.totalStaff ?? 0,
      note: 'Accounts',
      border: 'border-l-slate-500',
      onNavigate: () => router.push('/admin/users'),
    },
  ];

  const statCards = isAdmin ? [...commonStatCards, ...adminStatCards] : commonStatCards;

  const statsGridClass = isAdmin
    ? 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6'
    : 'grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-4';

  return (
    <>
      <PageHeader
        title="Admin dashboard"
        description={
          user?.role === 'staff'
            ? 'Review applications and track scholarship activity — user accounts are managed by an administrator.'
            : 'Overview of applications, scholarships, and user accounts.'
        }
        actions={
          user ? (
            <span className="text-sm text-slate-500">
              {user.email}
              <span className="text-slate-400"> · </span>
              <span className="capitalize">{user.role}</span>
            </span>
          ) : null
        }
      />
      <main className="flex-1 space-y-8 p-6 sm:p-8">
        {loading || !user ? (
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span
              className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"
              aria-hidden
            />
            Loading dashboard…
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Good {getTimeOfDay()},{' '}
                {user?.name || user?.email?.split('@')[0]}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Here is what is happening on the platform today.
              </p>
            </div>

            <div className={statsGridClass}>
              {statCards.map((card) => {
                const interactive = Boolean(card.onNavigate);
                const className = `${statCardBaseClass} border border-slate-200/90 border-l-4 text-left ${card.border} ${
                  interactive
                    ? 'cursor-pointer transition hover:shadow-md'
                    : 'cursor-default'
                }`;
                const body = (
                  <>
                    <p className="text-2xl font-bold tabular-nums text-slate-900">
                      {card.value === null ? '—' : card.value}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-slate-700">
                      {card.label}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">{card.note}</p>
                  </>
                );
                return interactive ? (
                  <button
                    key={card.label}
                    type="button"
                    onClick={card.onNavigate}
                    className={className}
                  >
                    {body}
                  </button>
                ) : (
                  <div key={card.label} className={className}>
                    {body}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className={dataTableWrapClass}>
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Recent applications
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Latest submissions across the platform
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push('/admin/applications')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    View all →
                  </button>
                </div>
                {recentApplications.length === 0 ? (
                  <p className="px-6 py-10 text-center text-sm text-slate-500">
                    No applications yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className={dataTableHeadClass}>
                        <tr>
                          <th className="px-6 py-3 font-medium">Student</th>
                          <th className="px-6 py-3 font-medium">Scholarship</th>
                          <th className="px-6 py-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recentApplications.map((app) => (
                          <tr
                            key={app.id}
                            className="cursor-pointer bg-white/80 hover:bg-slate-50/80"
                            onClick={() => router.push('/admin/applications')}
                          >
                            <td className="px-6 py-3 text-xs text-slate-600">
                              {app.userEmail}
                            </td>
                            <td className="px-6 py-3 text-xs font-medium text-slate-900">
                              {app.discountName}
                            </td>
                            <td className="px-6 py-3">
                              <span
                                className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-semibold ${statusStyle(app.status)}`}
                              >
                                {app.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className={dataTableWrapClass}>
                <div className="border-b border-slate-100 px-6 py-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Most applied scholarships
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Based on submitted applications
                  </p>
                </div>
                {topDiscounts.length === 0 ? (
                  <p className="px-6 py-10 text-center text-sm text-slate-500">
                    No applications yet.
                  </p>
                ) : (
                  <div className="space-y-4 px-6 py-4">
                    {topDiscounts.map((item, i) => (
                      <div key={item.name}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-800">
                            {item.name}
                          </span>
                          <span className="text-xs text-slate-500 tabular-nums">
                            {item.count} application{item.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-indigo-500"
                            style={{
                              width: `${Math.round((item.count / maxCount) * 100)}%`,
                              opacity: 1 - i * 0.12,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-800">
                Quick actions
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/admin/applications')}
                  className={`flex max-w-md flex-col gap-0.5 rounded-2xl border px-5 py-3 text-left transition ${
                    stats.pending > 0
                      ? 'border-amber-200 bg-amber-50/80 hover:bg-amber-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm font-medium text-slate-900">
                    Review pending applications
                  </span>
                  <span className="text-xs text-slate-500">
                    {stats.pending} waiting
                  </span>
                </button>
                {user.role === 'admin' ? (
                  <button
                    type="button"
                    onClick={() => router.push('/admin/users')}
                    className="flex max-w-md flex-col gap-0.5 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-left transition hover:bg-slate-50"
                  >
                    <span className="text-sm font-medium text-slate-900">
                      Manage users
                    </span>
                    <span className="text-xs text-slate-500">
                      {(stats.totalUsers ?? 0) + (stats.totalStaff ?? 0)} accounts
                    </span>
                  </button>
                ) : null}
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
