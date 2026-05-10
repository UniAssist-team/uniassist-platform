/** Shared layout / surface styles for logged-in app pages (aligned with auth UI). */

export {
  authPrimaryButtonClass as primaryButtonClass,
  authCardClass as cardClass,
  authFieldClass as inputClass,
  authLinkClass as linkClass,
} from '@/components/auth/AuthShell';

/** Primary CTA without full width — for toolbars and button groups. */
export const primaryButtonAutoClass =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-55';

export const appShellMainClass =
  'flex min-h-screen flex-1 flex-col bg-gradient-to-b from-slate-100 via-white to-indigo-50/40';

export const pageBodyClass = 'flex-1 p-6 sm:p-8';

export const dataTableWrapClass =
  'overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-lg shadow-slate-900/[0.04]';

export const dataTableHeadClass =
  'bg-slate-50/95 text-left text-xs font-semibold uppercase tracking-wider text-slate-500';

export const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300';

export const ghostButtonClass =
  'inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900';

export const statCardBaseClass =
  'rounded-2xl border bg-white/95 p-6 shadow-md shadow-slate-900/[0.04]';
