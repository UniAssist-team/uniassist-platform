'use client';
import { useEffect, useState, useRef } from 'react';
import { apiRequest, apiUpload } from '@/lib/api';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () =>
    Promise.all([apiRequest('/session'), apiRequest('/documents')])
      .then(([u, docs]) => { setUser(u); setDocuments(docs); });

  useEffect(() => { load(); }, []);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await apiUpload('/documents/upload', file);
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    await apiRequest(`/documents/${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-zinc-50">
        <Sidebar role={user?.role || 'student'} />
        <div className="flex-1 flex flex-col">
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
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}