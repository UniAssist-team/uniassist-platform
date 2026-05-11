'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, apiUpload } from '@/lib/api';
import PdfViewer, { type PdfDoc } from '@/components/PdfViewer';
import PageHeader from '@/components/layout/PageHeader';
import {
  cardClass,
  dataTableHeadClass,
  dataTableWrapClass,
  ghostButtonClass,
  primaryButtonAutoClass,
  secondaryButtonClass,
} from '@/components/layout/appChrome';

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [matches, setMatches] = useState<{
    documentId: string;
    matches: { discountId: string; confidence: number; reason: string }[];
  } | null>(null);
  const [viewingDoc, setViewingDoc] = useState<PdfDoc | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () =>
    Promise.all([apiRequest('/documents'), apiRequest('/discounts')]).then(
      ([docs, ds]) => {
        setDocuments(docs);
        setDiscounts(ds);
      },
    );

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const result = await apiUpload('/documents/upload', file);
      if (fileRef.current) fileRef.current.value = '';
      await load();
      if (Array.isArray(result?.matches) && result.matches.length > 0) {
        setMatches({ documentId: result.id, matches: result.matches });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const applyToDiscount = (
    discountId: string,
    discountName: string,
    documentId: string,
  ) => {
    router.push(
      `/applications/new?discountId=${discountId}&discountName=${encodeURIComponent(discountName)}&documentId=${documentId}`,
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    await apiRequest(`/documents/${id}`, { method: 'DELETE' });
    await load();
  };

  const handleDownload = async (id: string, filename: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/documents/${id}/file`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      setError(`Failed to download (${res.status})`);
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        title="My documents"
        description="Upload PDFs and other files to attach when you apply for scholarships. We may suggest relevant awards from the content of your upload."
      />
      <main className="flex-1 p-6 sm:p-8">
        <div className="max-w-3xl">
          <div className={`${cardClass} mb-8 p-6`}>
            <h2 className="text-sm font-semibold text-slate-900">
              Upload a file
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Transcripts, statements, and other required materials.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="file"
                ref={fileRef}
                className="w-full min-w-0 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-200 file:bg-slate-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-800 hover:file:bg-slate-100"
              />
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className={primaryButtonAutoClass}
              >
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
            {error ? (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            ) : null}
          </div>

          {documents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300/90 bg-white/60 px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-700">
                No documents yet
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Upload files above — they will appear here for use on applications.
              </p>
            </div>
          ) : (
            <div className={dataTableWrapClass}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className={dataTableHeadClass}>
                    <tr>
                      <th className="px-6 py-3 font-medium">Filename</th>
                      <th className="px-6 py-3 font-medium">Uploaded</th>
                      <th className="px-6 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="bg-white/80">
                        <td className="px-6 py-3 font-medium text-slate-900">
                          {doc.filename}
                        </td>
                        <td className="px-6 py-3 text-slate-500 tabular-nums">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            {doc.matches?.length > 0 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setMatches({
                                    documentId: doc.id,
                                    matches: doc.matches,
                                  })
                                }
                                className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-200"
                              >
                                Suggested scholarships
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() =>
                                setViewingDoc({
                                  filename: doc.filename,
                                  fileUrl: `/api/documents/${doc.id}/file`,
                                })
                              }
                              className={ghostButtonClass}
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDownload(doc.id, doc.filename)
                              }
                              className={`${ghostButtonClass} text-indigo-600 hover:text-indigo-700`}
                            >
                              Download
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(doc.id)}
                              className={`${ghostButtonClass} text-red-600 hover:bg-red-50 hover:text-red-700`}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {viewingDoc ? (
        <PdfViewer
          documents={[viewingDoc]}
          title={viewingDoc.filename}
          onClose={() => setViewingDoc(null)}
        />
      ) : null}

      {matches ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]">
          <div
            className={`${cardClass} w-full max-w-md p-6 shadow-2xl`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="match-dialog-title"
          >
            <h2
              id="match-dialog-title"
              className="font-semibold text-slate-900"
            >
              Suggested scholarships
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Based on your document. Choose one to start an application with this
              file attached.
            </p>
            <ul className="mt-4 max-h-[min(50vh,22rem)] space-y-2 overflow-y-auto">
              {matches.matches.map((m) => {
                const d = discounts.find((x) => x.id === m.discountId);
                if (!d) return null;
                return (
                  <li key={m.discountId}>
                    <button
                      type="button"
                      onClick={() =>
                        applyToDiscount(d.id, d.name, matches.documentId)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-left text-sm transition hover:border-indigo-200 hover:bg-indigo-50/60"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-900">
                          {d.name}
                        </span>
                        <span className="shrink-0 text-xs font-medium text-slate-500 tabular-nums">
                          {Math.round(m.confidence * 100)}% match
                        </span>
                      </div>
                      {m.reason ? (
                        <p className="mt-1 text-xs text-slate-600">{m.reason}</p>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => setMatches(null)}
              className={`${secondaryButtonClass} mt-6 w-full sm:w-auto`}
            >
              Skip for now
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
