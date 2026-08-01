import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Pencil, X, BadgeCheck } from 'lucide-react';

const ROLES = ['employee', 'manager', 'hr_admin', 'system_admin'];
const ROLE_LABELS = { employee: 'Employee', manager: 'Manager', hr_admin: 'HR Admin', system_admin: 'System Admin' };
const ROLE_COLORS = {
  employee: 'bg-blue-100 text-blue-700',
  manager: 'bg-emerald-100 text-emerald-700',
  hr_admin: 'bg-purple-100 text-purple-700',
  system_admin: 'bg-slate-100 text-slate-700',
};

export default function RoleManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [saving, setSaving] = useState(false);

  function fetchUsers() {
    api.get('/users').then(r => setUsers(r.data)).catch(() => toast.error('Failed to load users')).finally(() => setLoading(false));
  }

  useEffect(() => { fetchUsers(); }, []);

  async function handleSave(u) {
    setSaving(true);
    try {
      await api.patch(`/users/${u.id}`, { role: editRole });
      toast.success(`Role updated for ${u.name}`);
      setEditId(null);
      fetchUsers();
    } catch { toast.error('Failed to update role'); } finally { setSaving(false); }
  }

  if (loading) return <div className="text-center text-gray-500 py-20">Loading…</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Role Management</h1>
      <p className="text-gray-500 text-sm mb-6">Grant or change user permission levels across the system.</p>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {['User', 'Email', 'Current Role', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-white">{u.name.charAt(0)}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{u.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">{u.email}</td>
                <td className="px-5 py-4">
                  {editId === u.id ? (
                    <select value={editRole} onChange={e => setEditRole(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500">
                      {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  ) : (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role]}`}>
                      <BadgeCheck className="w-3 h-3" />{ROLE_LABELS[u.role] || u.role}
                    </span>
                  )}
                </td>
                <td className="px-5 py-4">
                  {editId === u.id ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleSave(u)} disabled={saving} className="text-xs bg-slate-700 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
                      <button onClick={() => setEditId(null)} className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditId(u.id); setEditRole(u.role); }} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
                      <Pencil className="w-3.5 h-3.5" /> Change Role
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
