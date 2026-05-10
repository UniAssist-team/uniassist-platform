'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';
import {
  cardClass,
  primaryButtonClass,
} from '@/components/layout/appChrome';

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    apiRequest('/discounts')
      .then(setDiscounts)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader
        title="Scholarships"
        description="Browse what is available, check required documents, then apply with your uploaded files."
      />
      <main className="flex-1 p-6 sm:p-8">
        {loading ? (
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span
              className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"
              aria-hidden
            />
            Loading scholarships…
          </div>
        ) : discounts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300/90 bg-white/60 px-6 py-14 text-center text-sm text-slate-600">
            No scholarships are available right now. Check back later.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {discounts.map((d) => (
              <article
                key={d.id}
                className={`${cardClass} flex flex-col p-6`}
              >
                <h2 className="text-base font-semibold text-slate-900">
                  {d.name}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {d.description}
                </p>
                <dl className="mt-4 space-y-2 text-xs text-slate-600">
                  <div>
                    <dt className="font-semibold text-slate-700">
                      Required documents
                    </dt>
                    <dd className="mt-0.5">{d.requiredDocuments}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-700">Benefits</dt>
                    <dd className="mt-0.5">{d.benefits}</dd>
                  </div>
                </dl>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/applications/new?discountId=${d.id}&discountName=${encodeURIComponent(d.name)}`,
                      )
                    }
                    className={primaryButtonClass}
                  >
                    Apply for this scholarship
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
