'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import PdfViewer, { type PdfDoc } from '@/components/PdfViewer';
import PageHeader from '@/components/layout/PageHeader';
import {
  cardClass,
  dataTableHeadClass,
  dataTableWrapClass,
  ghostButtonClass,
  inputClass,
  secondaryButtonClass,
} from '@/components/layout/appChrome';

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [reviewId, setReviewId] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>(
    'approved',
  );
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingDocs, setViewingDocs] = useState<PdfDoc[] | null>(null);

  useEffect(() => {
    apiRequest('/discounts').then(setDiscounts);
  }, []);

  const openViewer = async (appId: string) => {
    setViewerOpen(true);
    setViewingDocs(null);
    const docs = await apiRequest(`/admin/applications/${appId}/documents`);
    setViewingDocs(
      docs.map(
        (d: {
          id: string;
          filename: string;
          matches?: { discountId: string; confidence: number; reason: string }[];
        }) => ({
          filename: d.filename,
          fileUrl: `/api/admin/documents/${d.id}/file`,
          matches: (d.matches ?? []).map((m) => ({
            discountName:
              discounts.find((x) => x.id === m.discountId)?.name ?? m.discountId,
            confidence: m.confidence,
            reason: m.reason,
          })),
        }),
      ),
    );
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setViewingDocs(null);
  };

  const load = (status: string) => {
    setLoading(true);
    apiRequest(
      `/admin/applications?status=${status}&perPage=50&assignedTo=all`,
    )
      .then(setApplications)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(filter);
  }, [filter]);

  const openReview = (id: string, status: 'approved' | 'rejected') => {
    setReviewId(id);
    setReviewStatus(status);
    setReviewNote('');
  };

  const submitReview = async () => {
    await apiRequest(`/admin/applications/${reviewId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: reviewStatus, reviewNote }),
    });
    setReviewId('');
    load(filter);
  };

  const statusStyle = (s: string) =>
    s === 'approved'
      ? 'bg-emerald-100 text-emerald-800'
      : s === 'rejected'
        ? 'bg-red-100 text-red-800'
        : 'bg-amber-100 text-amber-900';

  return (
    <>
      <PageHeader
        title="Application queue"
        description="Review student scholarship applications, open attached documents, and approve or reject."
        actions={
          <div className="flex flex-wrap gap-2">
            {['pending', 'approved', 'rejected'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === s
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
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
          <p className="text-sm text-slate-500">
            No {filter} applications.
          </p>
        ) : (
          <div className={dataTableWrapClass}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className={dataTableHeadClass}>
                  <tr>
                    <th className="px-6 py-3 font-medium">Student</th>
                    <th className="px-6 py-3 font-medium">Scholarship</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Submitted</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr key={app.id} className="bg-white/80">
                      <td className="px-6 py-3 text-slate-700">
                        {app.userEmail}
                      </td>
                      <td className="px-6 py-3 font-medium text-slate-900">
                        {app.discountName}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex rounded-lg px-2 py-1 text-xs font-semibold ${statusStyle(app.status)}`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-500 tabular-nums">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openViewer(app.id)}
                            className={`${ghostButtonClass} bg-slate-100 text-slate-800 hover:bg-slate-200`}
                          >
                            View
                          </button>
                          {app.status === 'pending' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => openReview(app.id, 'approved')}
                                className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-200"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => openReview(app.id, 'rejected')}
                                className="rounded-lg bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 hover:bg-red-200"
                              >
                                Reject
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reviewId ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]">
            <div className={`${cardClass} w-full max-w-md p-6 shadow-2xl`}>
              <h2 className="font-semibold text-slate-900">
                {reviewStatus === 'approved' ? 'Approve' : 'Reject'} application
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Optional note for the student (shown with the decision).
              </p>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Review note (optional)"
                className={`${inputClass} mt-4 h-24 resize-none`}
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={submitReview}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
                    reviewStatus === 'approved'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-red-600 hover:bg-red-500'
                  }`}
                >
                  Confirm {reviewStatus}
                </button>
                <button
                  type="button"
                  onClick={() => setReviewId('')}
                  className={secondaryButtonClass}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {viewerOpen ? (
        <PdfViewer
          documents={viewingDocs}
          title="Application documents"
          onClose={closeViewer}
        />
      ) : null}
    </>
  );
}
