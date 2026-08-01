import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, X, DollarSign, RefreshCw, CheckCircle, XCircle, Clock, Receipt } from 'lucide-react';

const CATEGORIES = ['Travel', 'Meals', 'Equipment', 'Accommodation', 'Communication', 'Training', 'Other'];

const STATUS_STYLE = {
  Pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  Approved: 'bg-green-100 text-green-800 border border-green-200',
  Rejected: 'bg-red-100 text-red-700 border border-red-200',
};
const STATUS_ICON = { Pending: Clock, Approved: CheckCircle, Rejected: XCircle };

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'Travel', amount: '', date: '', description: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const pollRef = useRef(null);

  const eid = String(user?.employeeId || user?.id || '');

  function fetchExpenses(silent = false) {
    if (!silent) setLoading(true); else setRefreshing(true);
    api.get('/expenses')
      .then(r => {
        const mine = r.data.filter(e => String(e.employeeId) === eid);
        setExpenses(mine.sort((a, b) => b.submittedOn?.localeCompare(a.submittedOn || '') || 0));
      })
      .catch(() => { if (!silent) toast.error('Failed to load expenses'); })
      .finally(() => { setLoading(false); setRefreshing(false); });
  }

  useEffect(() => {
    if (!eid) return;
    fetchExpenses();
    // Poll every 15s to reflect manager approval status
    pollRef.current = setInterval(() => fetchExpenses(true), 15000);
    return () => clearInterval(pollRef.current);
  }, [eid]);

  function validate() {
    const e = {};
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) e.amount = 'Enter a valid amount';
    if (!form.date) e.date = 'Date is required';
    if (!form.description.trim()) e.description = 'Description is required';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      // Get employee to find managerId
      const allEmps = await api.get('/employees');
      const emp = allEmps.data.find(e => String(e.id) === eid);

      const payload = {
        id: Date.now().toString(),
        employeeId: eid,
        employeeName: user.name,
        managerId: emp?.managerId ? String(emp.managerId) : '2',
        category: form.category,
        amount: Number(form.amount),
        date: form.date,
        description: form.description.trim(),
        status: 'Pending',
        submittedOn: new Date().toISOString().split('T')[0],
      };
      await api.post('/expenses', payload);
      toast.success('Expense request submitted successfully!');
      setShowForm(false);
      setForm({ category: 'Travel', amount: '', date: '', description: '' });
      setErrors({});
      fetchExpenses();
    } catch {
      toast.error('Failed to submit expense request');
    } finally {
      setSaving(false);
    }
  }

  const summary = {
    total: expenses.length,
    pending: expenses.filter(e => e.status === 'Pending').length,
    approved: expenses.filter(e => e.status === 'Approved').length,
    totalApproved: expenses.filter(e => e.status === 'Approved').reduce((s, e) => s + Number(e.amount || 0), 0),
  };

  if (loading) return <div className="text-center text-gray-500 py-20">Loading expenses…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Expense Requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">Auto-refreshes every 15s to show manager decisions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchExpenses(true)} disabled={refreshing} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> Submit Expense
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          ['Total Submitted', summary.total, 'bg-blue-500', Receipt],
          ['Pending', summary.pending, 'bg-yellow-500', Clock],
          ['Approved', summary.approved, 'bg-green-500', CheckCircle],
          ['Total Approved', '₹' + Number(summary.totalApproved).toLocaleString('en-IN'), 'bg-emerald-500', DollarSign],
        ].map(([label, val, c, Icon]) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className={`w-11 h-11 rounded-full ${c} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{val}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {expenses.length === 0 ? (
        <div className="text-center text-gray-400 py-20 bg-white rounded-xl shadow-sm">
          <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-600">No expense requests yet</p>
          <p className="text-sm mt-1">Click <span className="font-semibold text-blue-600">Submit Expense</span> to claim your first reimbursement</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Category', 'Description', 'Amount', 'Expense Date', 'Submitted', 'Status', 'Reviewed By'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenses.map(exp => {
                  const Icon = STATUS_ICON[exp.status] || Clock;
                  return (
                    <tr key={exp.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{exp.category}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{exp.description}</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">₹{Number(exp.amount || 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{exp.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{exp.submittedOn}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[exp.status]}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {exp.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{exp.reviewedBy || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submit Expense Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Submit Expense Request</h2>
              <button onClick={() => { setShowForm(false); setErrors({}); }} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) <span className="text-red-500">*</span></label>
                <input
                  type="number" min="1" step="0.01"
                  value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder="Enter amount in ₹"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.amount ? 'border-red-400' : 'border-gray-300'}`}
                />
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expense Date <span className="text-red-500">*</span></label>
                <input
                  type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.date ? 'border-red-400' : 'border-gray-300'}`}
                />
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description / Purpose <span className="text-red-500">*</span></label>
                <textarea
                  value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3} placeholder="Describe the purpose of this expense…"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.description ? 'border-red-400' : 'border-gray-300'}`}
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowForm(false); setErrors({}); }} className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? 'Submitting…' : <><DollarSign className="w-4 h-4" /> Submit Request</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
