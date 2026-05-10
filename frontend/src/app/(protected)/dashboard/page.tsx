'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import PageHeader from '@/components/layout/PageHeader';
import {
  dataTableHeadClass,
  dataTableWrapClass,
  statCardBaseClass,
} from '@/components/layout/appChrome';

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
        .then(([s, d]) => {
          setStats(s);
          setDiscounts(d);
        })
        .finally(() => setLoading(false));
    } else {
      apiRequest('/applications')
        .then(setApplications)
        .finally(() => setLoading(false));
    }
  }, [user, isStaff]);

  const studentCounts = {
    pending: applications.filter((a) => a.status === 'pending').length,
    approved: applications.filter((a) => a.status === 'approved').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };
  const counts = isStaff
    ? (stats ?? { pending: 0, approved: 0, rejected: 0 })
    : studentCounts;

  const statCards = [
    {
      label: 'Pending',
      sub: isStaff ? 'All applications' : 'Your applications',
      count: counts.pending,
      border: 'border-l-amber-400',
    },
    {
      label: 'Approved',
      sub: isStaff ? 'All applications' : 'Your applications',
      count: counts.approved,
      border: 'border-l-emerald-500',
    },
    {
      label: 'Rejected',
      sub: isStaff ? 'All applications' : 'Your applications',
      count: counts.rejected,
      border: 'border-l-rose-500',
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          isStaff
            ? 'Overview of applications and scholarships configured for students.'
            : `Welcome back${user?.name ? `, ${user.name}` : ''}. Track scholarship applications and uploads from here.`
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
      <main className="flex-1 p-6 sm:p-8">
        {loading ? (
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span
              className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"
              aria-hidden
            />
            Loading your dashboard…
          </div>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className={`${statCardBaseClass} border border-slate-200/90 border-l-4 ${card.border}`}
                >
                  <p className="text-sm font-medium text-slate-600">
                    {card.label}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{card.sub}</p>
                  <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-slate-900">
                    {card.count}
                  </p>
                </div>
              ))}
            </div>

            {isStaff ? (
              <div className={dataTableWrapClass}>
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="font-semibold text-slate-900">
                    Scholarships in the system
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Students see these when browsing and applying.
                  </p>
                </div>
                {discounts.length === 0 ? (
                  <p className="px-6 py-8 text-center text-sm text-slate-500">
                    No scholarships configured yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead className={dataTableHeadClass}>
                        <tr>
                          <th className="px-6 py-3 font-medium">Name</th>
                          <th className="px-6 py-3 font-medium">Description</th>
                          <th className="px-6 py-3 font-medium">
                            Required documents
                          </th>
                          <th className="px-6 py-3 font-medium">Benefits</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {discounts.map((d) => (
                          <tr key={d.id} className="bg-white/80">
                            <td className="px-6 py-3 font-medium text-slate-900">
                              {d.name}
                            </td>
                            <td className="px-6 py-3 text-slate-600">
                              {d.description}
                            </td>
                            <td className="px-6 py-3 text-slate-600">
                              {d.requiredDocuments}
                            </td>
                            <td className="px-6 py-3 text-slate-600">
                              {d.benefits}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : applications.length > 0 ? (
              <div className={dataTableWrapClass}>
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="font-semibold text-slate-900">
                    Recent applications
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Last five submissions — visit{" "}
                    <span className="font-medium text-slate-700">
                      My applications
                    </span>{" "}
                    for the full list.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className={dataTableHeadClass}>
                      <tr>
                        <th className="px-6 py-3 font-medium">Scholarship</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium">Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {applications.slice(0, 5).map((app) => (
                        <tr key={app.id} className="bg-white/80">
                          <td className="px-6 py-3 font-medium text-slate-900">
                            {app.discountName}
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                app.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : app.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {app.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-slate-500 tabular-nums">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300/90 bg-white/60 px-6 py-12 text-center">
                <p className="text-sm font-medium text-slate-700">
                  No applications yet
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Browse available scholarships and submit your first application.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
