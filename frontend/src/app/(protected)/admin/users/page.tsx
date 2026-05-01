'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [formError, setFormError] = useState('');

  const load = () => {
    setLoading(true);
    apiRequest('/admin/users?perPage=100')
      .then(setUsers)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

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
    } catch (e: any) {
      setFormError(e.message);
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

  return (
    <>
          <header className="h-16 bg-white border-b px-8 flex items-center justify-between">
            <h1 className="font-semibold text-zinc-800 text-lg">User Management</h1>
            <button
              onClick={() => setShowCreate(true)}
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Create staff account
            </button>
          </header>
          <main className="p-8">
            {loading ? <p className="text-zinc-400">Loading...</p> : (
              <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-zinc-500 text-left">
                    <tr>
                      <th className="px-6 py-3 font-medium">Name</th>
                      <th className="px-6 py-3 font-medium">Email</th>
                      <th className="px-6 py-3 font-medium">Role</th>
                      <th className="px-6 py-3 font-medium">Joined</th>
                      <th className="px-6 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="px-6 py-3 text-zinc-800">{u.name || '—'}</td>
                        <td className="px-6 py-3 text-zinc-600">{u.email}</td>
                        <td className="px-6 py-3">
                          {u.role === 'admin' ? (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">admin</span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={e => handleRoleChange(u.id, e.target.value)}
                              className="text-xs border border-zinc-300 rounded px-2 py-1 bg-white"
                            >
                              <option value="student">student</option>
                              <option value="staff">staff</option>
                            </select>
                          )}
                        </td>
                        <td className="px-6 py-3 text-zinc-400">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3">
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handleDelete(u.id, u.email)}
                              className="text-xs text-red-500 hover:text-red-700 font-medium"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {showCreate && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-lg">
                  <h2 className="font-semibold text-zinc-800 mb-4">Create staff account</h2>
                  {[
                    { label: 'Name (optional)', key: 'name', type: 'text' },
                    { label: 'Email', key: 'email', type: 'email' },
                    { label: 'Password', key: 'password', type: 'password' },
                  ].map(f => (
                    <div key={f.key} className="mb-3">
                      <label className="block text-xs text-zinc-500 mb-1">{f.label}</label>
                      <input
                        type={f.type}
                        value={(form as any)[f.key]}
                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        className="w-full border border-zinc-300 rounded-lg p-2 text-sm"
                      />
                    </div>
                  ))}
                  <div className="mb-4">
                    <label className="block text-xs text-zinc-500 mb-1">Role</label>
                    <select
                      value={form.role}
                      onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full border border-zinc-300 rounded-lg p-2 text-sm"
                    >
                      <option value="staff">staff</option>
                      <option value="student">student</option>
                    </select>
                  </div>
                  {formError && <p className="text-red-500 text-xs mb-3">{formError}</p>}
                  <div className="flex gap-3">
                    <button onClick={handleCreate} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
                      Create
                    </button>
                    <button onClick={() => setShowCreate(false)} className="text-sm px-4 py-2 rounded-lg border border-zinc-300 text-zinc-600">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
    </>
  );
}