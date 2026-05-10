'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';
import {
  dataTableHeadClass,
  dataTableWrapClass,
  primaryButtonAutoClass,
  primaryButtonClass,
} from '@/components/layout/appChrome';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    apiRequest('/applications')
      .then(setApplications)
      .finally(() => setLoading(false));
  }, []);

  const statusStyle = (s: string) =>
    s === 'approved'
      ? 'bg-emerald-100 text-emerald-800'
      : s === 'rejected'
        ? 'bg-red-100 text-red-800'
        : 'bg-amber-100 text-amber-900';

  return (
    <>
      <PageHeader
        title="My applications"
        description="Every scholarship you have applied for, with status and reviewer notes."
        actions={
          <button
            type="button"
            onClick={() => router.push('/discounts')}
            className={primaryButtonAutoClass}
          >
            New application
          </button>
        }
      />
      <main className="flex-1 p-6 sm:p-8">
        {loading ? (
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span
              className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"
              aria-hidden
            />
            Loading applications…
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300/90 bg-white/60 px-6 py-14 text-center">
            <p className="text-sm font-medium text-slate-700">
              No applications yet
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Explore scholarships and start your first application.
            </p>
            <button
              type="button"
              onClick={() => router.push('/discounts')}
              className={`${primaryButtonClass} mt-6 max-w-xs`}
            >
              Browse scholarships
            </button>
          </div>
        ) : (
          <div className={dataTableWrapClass}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className={dataTableHeadClass}>
                  <tr>
                    <th className="px-6 py-3 font-medium">Scholarship</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Submitted</th>
                    <th className="px-6 py-3 font-medium">Review note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr key={app.id} className="bg-white/80">
                      <td className="px-6 py-3 font-medium text-slate-900">
                        {app.discountName}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${statusStyle(app.status)}`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-500 tabular-nums">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-600">
                        {app.reviewNote || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
