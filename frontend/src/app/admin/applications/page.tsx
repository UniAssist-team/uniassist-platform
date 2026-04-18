'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [reviewId, setReviewId] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');

  const load = (status: string) => {
    setLoading(true);
    Promise.all([
      apiRequest('/session'),
      apiRequest(`/admin/applications?status=${status}&perPage=50`),
    ]).then(([u, apps]) => { setUser(u); setApplications(apps); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(filter); }, [filter]);

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
    s === 'approved' ? 'bg-green-100 text-green-700' :
    s === 'rejected' ? 'bg-red-100 text-red-700' :
    'bg-yellow-100 text-yellow-700';

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-zinc-50">
        <Sidebar role={user?.role || 'staff'} />
        <div className="flex-1 flex flex-col">
          <header className="h-16 bg-white border-b px-8 flex items-center justify-between">
            <h1 className="font-semibold text-zinc-800 text-lg">Application Queue</h1>
            <div className="flex gap-2">
              {['pending', 'approved', 'rejected'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    filter === s ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </header>
          <main className="p-8">
            {loading ? <p className="text-zinc-400">Loading...</p> : (
              applications.length === 0 ? (
                <p className="text-zinc-400">No {filter} applications.</p>
              ) : (
                <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50 text-zinc-500 text-left">
                      <tr>
                        <th className="px-6 py-3 font-medium">Student</th>
                        <th className="px-6 py-3 font-medium">Discount</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium">Submitted</th>
                        <th className="px-6 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {applications.map(app => (
                        <tr key={app.id}>
                          <td className="px-6 py-3 text-zinc-700">{app.userEmail}</td>
                          <td className="px-6 py-3 text-zinc-800 font-medium">{app.discountName}</td>
                          <td className="px-6 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${statusStyle(app.status)}`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-zinc-400">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3 flex gap-2">
                            {app.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => openReview(app.id, 'approved')}
                                  className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => openReview(app.id, 'rejected')}
                                  className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {reviewId && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
                  <h2 className="font-semibold text-zinc-800 mb-1">
                    {reviewStatus === 'approved' ? 'Approve' : 'Reject'} Application
                  </h2>
                  <p className="text-sm text-zinc-500 mb-4">Add an optional review note for the student.</p>
                  <textarea
                    value={reviewNote}
                    onChange={e => setReviewNote(e.target.value)}
                    placeholder="Review note (optional)"
                    className="w-full border border-zinc-300 rounded-lg p-3 text-sm mb-4 resize-none h-24"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={submitReview}
                      className={`text-sm px-4 py-2 rounded-lg text-white ${
                        reviewStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      Confirm {reviewStatus}
                    </button>
                    <button
                      onClick={() => setReviewId('')}
                      className="text-sm px-4 py-2 rounded-lg border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}