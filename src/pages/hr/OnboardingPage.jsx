import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, X, CheckCircle, Clock, FileCheck } from 'lucide-react';

const DEPARTMENTS = ['Engineering', 'Marketing', 'HR', 'Finance', 'Sales'];
const ALL_DOCS = ['ID Proof', 'Offer Letter', 'Bank Details', 'Education Certificate', 'Background Check'];

const STATUS_STYLE = {
  'Pending': 'bg-yellow-100 text-yellow-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Completed': 'bg-green-100 text-green-700',
};

export default function OnboardingPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', department: '', jobTitle: '', startDate: '', documentsRequired: [...ALL_DOCS] });
  const [saving, setSaving] = useState(false);

  function fetchList() {
    api.get('/onboarding').then(r => setList(r.data)).catch(() => toast.error('Failed to load onboarding')).finally(() => setLoading(false));
  }

  useEffect(() => { fetchList(); }, []);

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.department || !form.jobTitle || !form.startDate) { toast.error('Fill all fields'); return; }
    setSaving(true);
    try {
      await api.post('/onboarding', { ...form, status: 'Pending', documentsSubmitted: [] });
      toast.success('New hire added to onboarding');
      setShowForm(false);
      setForm({ name: '', email: '', department: '', jobTitle: '', startDate: '', documentsRequired: [...ALL_DOCS] });
      fetchList();
    } catch { toast.error('Failed to add'); } finally { setSaving(false); }
  }

  async function markDocReceived(item, doc) {
    const newDocs = item.documentsSubmitted.includes(doc)
      ? item.documentsSubmitted.filter(d => d !== doc)
      : [...item.documentsSubmitted, doc];
    const allDone = newDocs.length >= item.documentsRequired.length;
    await api.patch(`/onboarding/${item._id}`, { documentsSubmitted: newDocs, status: allDone ? 'Completed' : 'In Progress' });
    if (allDone && !item.documentsSubmitted.includes(doc)) {
      // Add the new hire as a full employee and create their login account
      try {
        const empRes = await api.get('/employees');
        const maxId = empRes.data.reduce((m, e) => Math.max(m, Number(e.id) || 0), 0);
        const newEmpId = String(maxId + 1);
        await api.post('/employees', {
          id: newEmpId,
          name: item.name,
          email: item.email,
          department: item.department,
          designation: item.jobTitle,
          phone: '',
          joinDate: item.startDate,
          status: 'Active',
          managerId: '2',
          salary: 0,
          skills: [],
        });
        const usersRes = await api.get('/users');
        const existingUser = usersRes.data.find(u => u.email === item.email);
        if (!existingUser) {
          const maxUid = usersRes.data.reduce((m, u) => Math.max(m, Number(u.id) || 0), 0);
          const defaultPass = item.name.split(' ')[0].toLowerCase() + '123456';
          await api.post('/users', {
            id: String(maxUid + 1),
            email: item.email,
            password: defaultPass,
            name: item.name,
            role: 'employee',
            employeeId: newEmpId,
          });
          toast.success(`${item.name} added to employees! Login: ${item.email} / ${defaultPass}`);
        } else {
          toast.success(item.name + ' added to employees list!');
        }
      } catch { toast.error('Onboarding completed but failed to add to employees'); }
    }
    fetchList();
  }

  if (loading) return <div className="text-center text-gray-500 py-20">Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Onboarding</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Add New Hire
        </button>
      </div>

      <div className="space-y-4">
        {list.map(item => (
          <div key={item._id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[item.status]}`}>{item.status}</span>
                </div>
                <p className="text-sm text-gray-500">{item.jobTitle} · {item.department}</p>
                <p className="text-xs text-gray-400">Start date: {item.startDate} · {item.email}</p>
              </div>
              <div className="text-sm text-gray-500">
                {item.documentsSubmitted.length}/{item.documentsRequired.length} docs received
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.documentsRequired.map(doc => {
                const done = item.documentsSubmitted.includes(doc);
                return (
                  <button
                    key={doc}
                    onClick={() => markDocReceived(item, doc)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition ${done ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-purple-300 hover:text-purple-600'}`}
                  >
                    {done ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    {doc}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="text-center text-gray-400 py-20">No onboarding records</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add New Hire</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              {[['Full Name', 'name', 'text'], ['Email', 'email', 'email'], ['Job Title', 'jobTitle', 'text']].map(([label, field, type]) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type={type} value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">Select…</option>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60">{saving ? 'Saving…' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
