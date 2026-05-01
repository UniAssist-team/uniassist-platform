'use client';
import { useEffect, useRef, useState } from 'react';

const PDF_JS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.min.mjs';
const PDF_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.worker.min.mjs';

let pdfjsLibPromise: Promise<any> | null = null;
function getPdfjsLib(): Promise<any> {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import(/* webpackIgnore: true */ PDF_JS_URL).then((mod: any) => {
      mod.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
      return mod;
    });
  }
  return pdfjsLibPromise;
}

export type PdfDocMatch = { discountName: string; confidence: number; reason: string };

export type PdfDoc = {
  filename: string;
  fileUrl: string;
  matches?: PdfDocMatch[];
};

export default function PdfViewer({
  documents,
  title = 'Documents',
  onClose,
}: {
  documents: PdfDoc[] | null;
  title?: string;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documents || documents.length === 0) return;
    let cancelled = false;
    setError(null);

    const run = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const pdfjsLib = await getPdfjsLib();
        if (cancelled || !containerRef.current) return;

        containerRef.current.innerHTML = '';

        for (const doc of documents) {
          const fileRes = await fetch(doc.fileUrl, { headers });
          if (!fileRes.ok) throw new Error(`Failed to fetch ${doc.filename} (${fileRes.status})`);
          const buffer = await fileRes.arrayBuffer();
          if (cancelled || !containerRef.current) return;
          const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

          const heading = document.createElement('h3');
          heading.textContent = doc.filename;
          heading.className = 'font-medium text-zinc-700 text-sm mt-4 mb-2';
          containerRef.current.appendChild(heading);

          if (doc.matches && doc.matches.length > 0) {
            const panel = document.createElement('div');
            panel.className = 'mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-xs space-y-1';
            const panelHeading = document.createElement('p');
            panelHeading.className = 'font-medium text-green-700 mb-1';
            panelHeading.textContent = 'Suggested discounts';
            panel.appendChild(panelHeading);
            for (const m of doc.matches) {
              const line = document.createElement('div');
              line.className = 'text-zinc-700';
              const nameEl = document.createElement('span');
              nameEl.className = 'font-medium';
              nameEl.textContent = m.discountName;
              const detailEl = document.createElement('span');
              detailEl.className = 'text-zinc-500';
              detailEl.textContent = ` (${Math.round(m.confidence * 100)}%) — ${m.reason}`;
              line.appendChild(nameEl);
              line.appendChild(detailEl);
              panel.appendChild(line);
            }
            containerRef.current.appendChild(panel);
          }

          for (let n = 1; n <= pdf.numPages; n++) {
            if (cancelled) return;
            const page = await pdf.getPage(n);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.className = 'mb-3 block max-w-full border border-zinc-200 shadow-sm';
            containerRef.current.appendChild(canvas);
            await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to render documents');
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [documents]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="font-semibold text-zinc-800">{title}</h2>
          <button onClick={onClose} className="text-sm text-zinc-500 hover:text-zinc-700">
            Close
          </button>
        </div>
        <div className="overflow-auto p-6">
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!error && documents === null && (
            <p className="text-sm text-zinc-400">Loading documents...</p>
          )}
          {!error && documents?.length === 0 && (
            <p className="text-sm text-zinc-400">No documents attached.</p>
          )}
          <div ref={containerRef} />
        </div>
      </div>
    </div>
  );
}
