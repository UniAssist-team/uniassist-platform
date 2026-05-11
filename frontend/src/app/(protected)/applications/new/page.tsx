'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';
import {
  cardClass,
  linkClass,
  primaryButtonAutoClass,
  secondaryButtonClass,
} from '@/components/layout/appChrome';

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
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleSubmit = async () => {
    if (!discountId) return setError('No scholarship selected.');
    if (selected.length === 0) return setError('Select at least one document.');
    setSubmitting(true);
    setError('');
    try {
      await apiRequest('/applications', {
        method: 'POST',
        body: JSON.stringify({ discountId, documentIds: selected }),
      });
      router.push('/applications');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="New application"
        description="Attach documents you already uploaded. You can add more files under My documents anytime."
      />
      <main className="flex-1 p-6 sm:p-8">
        <div className="max-w-xl">
          <div className={`${cardClass} p-6`}>
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600/90">
                Applying for
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {discountName || '—'}
              </p>
            </div>

            <div className="mb-6">
              <p className="mb-3 text-sm font-medium text-slate-800">
                Select documents to include
              </p>
              {documents.length === 0 ? (
                <p className="text-sm leading-relaxed text-slate-600">
                  No documents uploaded yet.{' '}
                  <button
                    type="button"
                    onClick={() => router.push('/documents')}
                    className={linkClass}
                  >
                    Upload documents first
                  </button>
                </p>
              ) : (
                <ul className="space-y-3">
                  {documents.map((doc) => (
                    <li key={doc.id}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/90 bg-slate-50/50 px-3 py-2.5 transition hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={selected.includes(doc.id)}
                          onChange={() => toggle(doc.id)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-slate-900">
                            {doc.filename}
                          </span>
                          <span className="text-xs text-slate-500 tabular-nums">
                            Uploaded{' '}
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {error ? (
              <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || documents.length === 0}
                className={primaryButtonAutoClass}
              >
                {submitting ? 'Submitting…' : 'Submit application'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className={secondaryButtonClass}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function NewApplicationFallback() {
  return (
    <>
      <PageHeader title="New application" />
      <main className="flex-1 p-6 sm:p-8">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span
            className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"
            aria-hidden
          />
          Loading…
        </div>
      </main>
    </>
  );
}

export default function NewApplicationPage() {
  return (
    <Suspense fallback={<NewApplicationFallback />}>
      <NewApplicationForm />
    </Suspense>
  );
}
