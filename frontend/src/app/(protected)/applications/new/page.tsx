'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';

function NewApplicationForm() {
  const router = useRouter();
  const params = useSearchParams();
  const discountId = params.get('discountId') || '';
  const discountName = params.get('discountName') || '';
  const initialDocumentId = params.get('documentId') || '';

  const [documents, setDocuments] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>(
    initialDocumentId ? [initialDocumentId] : [],
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/documents').then(setDocuments);
  }, []);

  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSubmit = async () => {
    if (!discountId) return setError('No discount selected.');
    if (selected.length === 0) return setError('Select at least one document.');
    setSubmitting(true);
    setError('');
    try {
      await apiRequest('/applications', {
        method: 'POST',
        body: JSON.stringify({ discountId, documentIds: selected }),
      });
      router.push('/applications');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
          <header className="h-16 bg-white border-b px-8 flex items-center">
            <h1 className="font-semibold text-zinc-800 text-lg">New Application</h1>
          </header>
          <main className="p-8 max-w-xl">
            <div className="bg-white border border-zinc-200 rounded-xl p-6">
              <div className="mb-5">
                <p className="text-xs text-zinc-400 mb-1">Applying for</p>
                <p className="font-semibold text-zinc-800">{discountName || '—'}</p>
              </div>

              <div className="mb-5">
                <p className="text-xs text-zinc-400 mb-2">
                  Select documents to attach
                </p>
                {documents.length === 0 ? (
                  <p className="text-sm text-zinc-400">
                    No documents uploaded yet.{' '}
                    <button
                      onClick={() => router.push('/documents')}
                      className="text-blue-600 underline"
                    >
                      Upload documents first
                    </button>
                  </p>
                ) : (
                  <div className="space-y-2">
                    {documents.map(doc => (
                      <label key={doc.id} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selected.includes(doc.id)}
                          onChange={() => toggle(doc.id)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-zinc-700">{doc.filename}</span>
                        <span className="text-xs text-zinc-400">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || documents.length === 0}
                  className="bg-blue-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit application'}
                </button>
                <button
                  onClick={() => router.back()}
                  className="text-zinc-500 text-sm px-4 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </main>
    </>
  );
}

export default function NewApplicationPage() {
  return (
    <Suspense>
      <NewApplicationForm />
    </Suspense>
  );
}