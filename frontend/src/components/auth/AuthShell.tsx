'use client';

import type { SVGProps } from 'react';

export const authLabelClass =
  'mb-1.5 block text-sm font-medium text-slate-700';

export const authFieldClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20';

export const authPrimaryButtonClass =
  'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-55';

export const authCardClass =
  'rounded-2xl border border-slate-200/90 bg-white/95 p-8 shadow-xl shadow-slate-900/[0.06] backdrop-blur-sm';

export const authLinkClass =
  'font-semibold text-indigo-600 underline-offset-4 hover:text-indigo-500 hover:underline';

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-100 via-white to-indigo-50/40 px-4 py-10 sm:px-8">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <div className="flex justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 ring-4 ring-white">
              <UniAssistLogoIcon className="h-7 w-7" aria-hidden />
            </span>
          </div>
          <p className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">
            UniAssist
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Scholarships, applications &amp; documents
          </p>
        </header>
        {children}
      </div>
    </div>
  );
}

function UniAssistLogoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M12 3 2 8l10 5 10-5-10-5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M6 10.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
