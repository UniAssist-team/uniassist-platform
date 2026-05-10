'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import PageHeader from '@/components/layout/PageHeader';
import {
  cardClass,
  dataTableHeadClass,
  dataTableWrapClass,
  inputClass,
  primaryButtonAutoClass,
  secondaryButtonClass,
} from '@/components/layout/appChrome';

export default function AdminUsersPage() {
  const { user, loading: sessionLoading } = useUser();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
  });
  const [formError, setFormError] = useState('');

  const load = () => {
    setLoading(true);
    apiRequest('/admin/users?perPage=100')
      .then(setUsers)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (sessionLoading || !user) return;
    if (user.role !== 'admin') {
      setLoading(false);
      return;
    }
    load();
  }, [user, sessionLoading]);

  const handleCreate = async () => {
    setFormError('');
    try {
      await apiRequest('/admin/users', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', role: 'staff' });
      load();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Request failed.');
    }
  };

  const handleRoleChange = async (id: string, role: string) => {
    await apiRequest(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    load();
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Delete user ${email}?`)) return;
    await apiRequest(`/admin/users/${id}`, { method: 'DELETE' });
    load();
  };

  if (sessionLoading || !user) {
    return (
      <>
        <PageHeader title="User management" />
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

  if (user.role !== 'admin') {
    return (
      <>
        <PageHeader title="User management" />
        <main className="flex-1 p-6 sm:p-8">
          <div className="rounded-2xl border border-amber-200/90 bg-amber-50/90 px-5 py-4 text-sm text-amber-950">
            This area is restricted to administrators. Staff accounts cannot view or
            manage users.
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="User management"
        description="Create staff and student accounts, assign roles, and remove users (admin only)."
        actions={
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className={primaryButtonAutoClass}
          >
            Create account
          </button>
        }
      />
      <main className="flex-1 p-6 sm:p-8">
        {loading ? (
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span
              className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"
              aria-hidden
            />
            Loading users…
          </div>
        ) : (
          <div className={dataTableWrapClass}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className={dataTableHeadClass}>
                  <tr>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">Role</th>
                    <th className="px-6 py-3 font-medium">Joined</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="bg-white/80">
                      <td className="px-6 py-3 text-slate-900">
                        {u.name || '—'}
                      </td>
                      <td className="px-6 py-3 text-slate-600">{u.email}</td>
                      <td className="px-6 py-3">
                        {u.role === 'admin' ? (
                          <span className="inline-flex rounded-lg bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-800">
                            admin
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) =>
                              handleRoleChange(u.id, e.target.value)
                            }
                            className={`${inputClass} max-w-[10rem] py-1.5 text-xs`}
                          >
                            <option value="student">student</option>
                            <option value="staff">staff</option>
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-3 text-slate-500 tabular-nums">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3">
                        {u.role !== 'admin' ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(u.id, u.email)}
                            className="text-xs font-semibold text-red-600 hover:text-red-700"
                          >
                            Delete
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showCreate ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]">
            <div className={`${cardClass} w-full max-w-sm p-6 shadow-2xl`}>
              <h2 className="font-semibold text-slate-900">Create account</h2>
              <p className="mt-1 text-sm text-slate-600">
                Staff or student — cannot create another admin here.
              </p>
              {[
                { label: 'Name (optional)', key: 'name' as const, type: 'text' },
                { label: 'Email', key: 'email' as const, type: 'email' },
                { label: 'Password', key: 'password' as const, type: 'password' },
              ].map((f) => (
                <div key={f.key} className="mt-4">
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    value={form[f.key]}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
              ))}
              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, role: e.target.value }))
                  }
                  className={inputClass}
                >
                  <option value="staff">staff</option>
                  <option value="student">student</option>
                </select>
              </div>
              {formError ? (
                <p className="mt-3 text-sm text-red-600">{formError}</p>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleCreate}
                  className={primaryButtonAutoClass}
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className={secondaryButtonClass}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </>
  );
}
