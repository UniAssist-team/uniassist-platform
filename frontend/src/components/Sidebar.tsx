'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/lib/api';

const studentNav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/discounts', label: 'Discounts' },
  { href: '/applications', label: 'My Applications' },
  { href: '/documents', label: 'My Documents' },
];

const adminNav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/admin/applications', label: 'Application Queue' },
  { href: '/admin/users', label: 'User Management' },
];

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const nav = role === 'admin' || role === 'staff' ? adminNav : studentNav;

  return (
    <aside className="w-64 bg-zinc-900 text-white flex flex-col min-h-screen">
      <div className="p-6 text-xl font-bold border-b border-zinc-700 tracking-tight">
        UniAssist
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-3 py-2 rounded text-sm font-medium transition-colors ${
              pathname === item.href
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-zinc-700">
        <button
          onClick={logout}
          className="w-full text-left text-sm text-zinc-400 hover:text-white px-3 py-2 rounded hover:bg-zinc-800 transition-colors"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}