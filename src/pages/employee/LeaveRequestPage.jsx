import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, X, Calendar, RefreshCw, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';

const LEAVE_TYPES = ['Annual', 'Sick', 'Casual', 'Maternity', 'Paternity'];

const STATUS_STYLE = {
  Pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  Approved: 'bg-green-100 text-green-800 border border-green-200',
  Rejected: 'bg-red-100 text-red-700 border border-red-200',
};

const STATUS_ICON = { Pending: Clock, Approved: CheckCircle, Rejected: XCircle };

export default function LeaveRequestPage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'Annual', from: '', to: '', reason: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const pollRef = useRef(null);

  const eid = String(user?.employeeId || user?.id || '');

  function fetchLeaves(silent = false) {
    if (!silent) setLoading(true); else setRefreshing(true);
    return api.get('/leaveRequests')
      .then(r => {
        // Filter client-side — avoids json-server v1 type mismatch
        const mine = r.data.filter(l => String(l.employeeId) === eid);
        setLeaves(mine.sort((a, b) => b.appliedOn.localeCompare(a.appliedOn)));
      })
      .catch(() => { if (!silent) toast.error('Failed to load leaves'); })
      .finally(() => { setLoading(false); setRefreshing(false); });
  }

  useEffect(() => {
    if (!eid) return;
    fetchLeaves();
    pollRef.current = setInterval(() => fetchLeaves(true), 10000);
    return () => clearInterval(pollRef.current);
  }, [eid]);

  function validate() {
    const e = {};
    if (!form.from) e.from = 'Start date required';
    if (!form.to) e.to = 'End date required';
    if (form.from && form.to && form.to < form.from) e.to = 'End date must be after start date';
    if (!form.reason.trim()) e.reason = 'Reason required';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const days = Math.max(1, Math.round((new Date(form.to) - new Date(form.from)) / 86400000) + 1);

      // Get employee record to find managerId
      let empRecord = null;
      try {
        const allEmps = await api.get('/employees');
        empRecord = allEmps.data.find(e => String(e._id) === eid);
      } catch { /* fallback */ }

      const payload = {
        employeeId: eid,
        employeeName: user.name,
        type: form.type,
        from: form.from,
        to: form.to,
        days,
        reason: form.reason.trim(),
        managerId: empRecord?.managerId ? String(empRecord.managerId) : '2',
        status: 'Pending',
        appliedOn: new Date().toISOString().split('T')[0],
      };
      await api.post('/leaveRequests', payload);
      toast.success('Leave request submitted successfully!');
      setShowForm(false);
      setForm({ type: 'Annual', from: '', to: '', reason: '' });
      setErrors({});
      await fetchLeaves();
    } catch {
      toast.error('Failed to submit leave request');
    } finally {
      setSaving(false);
    }
  }

  const summary = {
    total: leaves.length,
    pending: leaves.filter(l => l.status === 'Pending').length,
    approved: leaves.filter(l => l.status === 'Approved').length,
    rejected: leaves.filter(l => l.status === 'Rejected').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Leave Requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">Auto-refreshes every 10s to show manager decisions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchLeaves(true)} disabled={refreshing} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition" title="Refresh now">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> Apply Leave
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          ['Total Requests', summary.total, 'bg-blue-500', FileText],
          ['Pending', summary.pending, 'bg-yellow-500', Clock],
          ['Approved', summary.approved, 'bg-green-500', CheckCircle],
          ['Rejected', summary.rejected, 'bg-red-500', XCircle],
        ].map(([label, val, c, Icon]) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className={`w-11 h-11 rounded-full ${c} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{val}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-20">Loading your leaves…</div>
      ) : leaves.length === 0 ? (
        <div className="text-center text-gray-400 py-20 bg-white rounded-xl shadow-sm">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-600">No leave requests yet</p>
          <p className="text-sm mt-1">Click <span className="font-semibold text-blue-600">Apply Leave</span> to submit your first request</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Type', 'From', 'To', 'Days', 'Reason', 'Applied On', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leaves.map(lr => {
                  const Icon = STATUS_ICON[lr.status] || Clock;
                  return (
                    <tr key={lr._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{lr.type}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-medium whitespace-nowrap">{lr.from}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-medium whitespace-nowrap">{lr.to}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-center font-semibold">{lr.days}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{lr.reason}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{lr.appliedOn}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[lr.status]}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {lr.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Apply for Leave</h2>
              <button onClick={() => { setShowForm(false); setErrors({}); }} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={form.from} onChange={e => setForm(p => ({ ...p, from: e.target.value }))} className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.from ? 'border-red-400' : 'border-gray-300'}`} />
                  {errors.from && <p className="text-red-500 text-xs mt-1">{errors.from}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={form.to} min={form.from} onChange={e => setForm(p => ({ ...p, to: e.target.value }))} className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.to ? 'border-red-400' : 'border-gray-300'}`} />
                  {errors.to && <p className="text-red-500 text-xs mt-1">{errors.to}</p>}
                </div>
              </div>
              {form.from && form.to && form.to >= form.from && (
                <p className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                  Duration: <strong>{Math.max(1, Math.round((new Date(form.to) - new Date(form.from)) / 86400000) + 1)} day(s)</strong>
                </p>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} rows={3} placeholder="Describe the reason for your leave…" className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.reason ? 'border-red-400' : 'border-gray-300'}`} />
                {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason}</p>}
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowForm(false); setErrors({}); }} className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? 'Submitting…' : <><Plus className="w-4 h-4" /> Submit Request</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
