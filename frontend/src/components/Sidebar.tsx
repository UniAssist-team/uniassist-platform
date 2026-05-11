'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/lib/api';

const studentNav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/discounts', label: 'Scholarships' },
  { href: '/applications', label: 'My applications' },
  { href: '/documents', label: 'My documents' },
];

const adminNav = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/applications', label: 'Application queue' },
  { href: '/admin/users', label: 'User management', adminOnly: true },
];

function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
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

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const isStaffOrAdmin = role === 'admin' || role === 'staff';
  const nav = (isStaffOrAdmin ? adminNav : studentNav).filter(
    (item) =>
      !('adminOnly' in item && item.adminOnly) || role === 'admin',
  );

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 ring-1 ring-white/10">
          <LogoMark className="h-5 w-5" />
        </span>
        <div>
          <p className="text-lg font-semibold tracking-tight">UniAssist</p>
          <p className="text-xs font-medium text-indigo-200/80">
            {isStaffOrAdmin ? 'Staff workspace' : 'Student portal'}
          </p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <button
          type="button"
          onClick={logout}
          className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
