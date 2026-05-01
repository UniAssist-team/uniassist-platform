'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, apiUpload } from '@/lib/api';
import PdfViewer, { type PdfDoc } from '@/components/PdfViewer';

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
    Promise.all([apiRequest('/documents'), apiRequest('/discounts')])
      .then(([docs, ds]) => { setDocuments(docs); setDiscounts(ds); });

  useEffect(() => { load(); }, []);

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
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const applyToDiscount = (discountId: string, discountName: string, documentId: string) => {
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
          <header className="h-16 bg-white border-b px-8 flex items-center">
            <h1 className="font-semibold text-zinc-800 text-lg">My Documents</h1>
          </header>
          <main className="p-8 max-w-3xl">
            <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-6">
              <h2 className="font-semibold text-zinc-700 mb-3 text-sm">Upload a document</h2>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileRef}
                  className="text-sm text-zinc-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-zinc-300 file:text-sm file:bg-zinc-50 file:text-zinc-700 hover:file:bg-zinc-100"
                />
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>

            {documents.length === 0 ? (
              <p className="text-zinc-400 text-sm">No documents uploaded yet.</p>
            ) : (
              <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-zinc-500 text-left">
                    <tr>
                      <th className="px-6 py-3 font-medium">Filename</th>
                      <th className="px-6 py-3 font-medium">Uploaded</th>
                      <th className="px-6 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {documents.map(doc => (
                      <tr key={doc.id}>
                        <td className="px-6 py-3 text-zinc-800">{doc.filename}</td>
                        <td className="px-6 py-3 text-zinc-400">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex gap-3 justify-end items-center">
                            {doc.matches?.length > 0 && (
                              <button
                                onClick={() => setMatches({ documentId: doc.id, matches: doc.matches })}
                                className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                              >
                                Suggested discounts
                              </button>
                            )}
                            <button
                              onClick={() => setViewingDoc({
                                filename: doc.filename,
                                fileUrl: `/api/documents/${doc.id}/file`,
                              })}
                              className="text-zinc-600 hover:text-zinc-800 text-xs font-medium"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDownload(doc.id, doc.filename)}
                              className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                            >
                              Download
                            </button>
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="text-red-500 hover:text-red-700 text-xs font-medium"
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
            )}
          </main>

        {viewingDoc && (
          <PdfViewer
            documents={[viewingDoc]}
            title={viewingDoc.filename}
            onClose={() => setViewingDoc(null)}
          />
        )}

        {matches && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
              <h2 className="font-semibold text-zinc-800 mb-1">Suggested discounts</h2>
              <p className="text-sm text-zinc-500 mb-4">
                Based on the document you just uploaded. Click one to start an application.
              </p>
              <div className="space-y-2 mb-4">
                {matches.matches.map(m => {
                  const d = discounts.find(x => x.id === m.discountId);
                  if (!d) return null;
                  return (
                    <button
                      key={m.discountId}
                      onClick={() => applyToDiscount(d.id, d.name, matches.documentId)}
                      className="w-full text-left border border-zinc-200 rounded-lg p-3 hover:bg-zinc-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-zinc-800 text-sm">{d.name}</span>
                        <span className="text-xs text-zinc-400">
                          {Math.round(m.confidence * 100)}% match
                        </span>
                      </div>
                      {m.reason && <p className="text-xs text-zinc-500">{m.reason}</p>}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setMatches(null)}
                className="text-sm px-4 py-2 rounded-lg border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}
    </>
  );
}