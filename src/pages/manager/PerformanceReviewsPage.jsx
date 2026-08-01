import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Star, X, Send, Search, TrendingUp, Trash2 } from 'lucide-react';

const RATING_LABELS = { 1: 'Poor', 2: 'Below Average', 3: 'Average', 4: 'Good', 5: 'Excellent' };
const RATING_COLORS = { 1: 'text-red-600', 2: 'text-orange-500', 3: 'text-yellow-500', 4: 'text-green-600', 5: 'text-emerald-600' };

function StarRating({ value }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={`w-4 h-4 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)} className="focus:outline-none group">
          <Star className={`w-8 h-8 transition ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'}`} />
        </button>
      ))}
    </div>
  );
}

export default function PerformanceReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [empSearch, setEmpSearch] = useState('');
  const [showSugg, setShowSugg] = useState(false);
  const [filter, setFilter] = useState('All');
  const [form, setForm] = useState({ employeeId: '', employeeName: '', period: 'Q3 2026', goals: '', rating: 3, feedback: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const mid = String(user?.employeeId || user?.id || '');

  function fetchAll() {
    Promise.all([
      api.get('/performanceReviews'),
      api.get('/employees'),
    ]).then(([r, e]) => {
      // Client-side filter — json-server v1 type mismatch fix
      const mine = r.data.filter(rev => String(rev.reviewerId) === mid);
      setReviews(mine);
      setAllEmployees(e.data);
    }).catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { if (mid) fetchAll(); }, [mid]);

  function openAdd() {
    setEditTarget(null);
    setForm({ employeeId: '', employeeName: '', period: 'Q3 2026', goals: '', rating: 3, feedback: '' });
    setEmpSearch('');
    setShowSugg(false);
    setShowForm(true);
  }

  function openEdit(r) {
    setEditTarget(r);
    setForm({ employeeId: r.employeeId, employeeName: r.employeeName, period: r.period, goals: r.goals, rating: r.rating, feedback: r.feedback });
    setEmpSearch(r.employeeName);
    setShowSugg(false);
    setShowForm(true);
  }

  function selectEmployee(emp) {
    setForm(p => ({ ...p, employeeId: String(emp.id), employeeName: emp.name }));
    setEmpSearch(emp.name);
    setShowSugg(false);
  }

  const empSuggestions = empSearch.length >= 1
    ? allEmployees.filter(e => e.name.toLowerCase().includes(empSearch.toLowerCase()) && String(e.id) !== mid)
    : [];

  async function handleSave(e) {
    e.preventDefault();
    if (!form.employeeId) { toast.error('Please select an employee'); return; }
    if (!form.goals.trim()) { toast.error('Goals / KPIs are required'); return; }
    if (!form.feedback.trim()) { toast.error('Feedback is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        reviewerId: mid,
        reviewerName: user?.name,
        status: 'Completed',
        reviewedOn: new Date().toISOString().split('T')[0],
      };
      if (editTarget) {
        await api.put('/performanceReviews/' + editTarget.id, { ...editTarget, ...payload });
        toast.success('Review updated successfully');
      } else {
        await api.post('/performanceReviews', { id: Date.now().toString(), ...payload });
        toast.success('Review submitted for ' + form.employeeName);
      }
      setShowForm(false);
      fetchAll();
    } catch { toast.error('Failed to save review'); }
    finally { setSaving(false); }
  }

  async function handleDelete(rev) {
    if (!window.confirm('Delete this performance review?')) return;
    setDeleting(rev.id);
    try {
      await api.delete('/performanceReviews/' + rev.id);
      toast.success('Review deleted');
      fetchAll();
    } catch { toast.error('Failed to delete review'); }
    finally { setDeleting(null); }
  }

  const periods = ['All', ...new Set(reviews.map(r => r.period))];
  const displayed = filter === 'All' ? reviews : reviews.filter(r => r.period === filter);

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;

  if (loading) return <div className="text-center text-gray-500 py-20">Loading reviews…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Reviews</h1>
          <p className="text-sm text-gray-500 mt-0.5">{reviews.length} review{reviews.length !== 1 ? 's' : ''} submitted · Avg rating: <span className="font-semibold text-amber-600">{avgRating} / 5</span></p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Review
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        {[1, 2, 3, 4, 5].map(n => {
          const count = reviews.filter(r => r.rating === n).length;
          return (
            <div key={n} className="bg-white rounded-xl shadow-sm p-3 text-center">
              <div className="flex justify-center mb-1"><StarRating value={n} /></div>
              <p className="text-lg font-bold text-gray-900">{count}</p>
              <p className={`text-xs font-medium ${RATING_COLORS[n]}`}>{RATING_LABELS[n]}</p>
            </div>
          );
        })}
      </div>

      {/* Period filter */}
      {periods.length > 1 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          {periods.map(p => (
            <button key={p} onClick={() => setFilter(p)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filter === p ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>{p}</button>
          ))}
        </div>
      )}

      {displayed.length === 0 ? (
        <div className="text-center text-gray-400 py-20 bg-white rounded-xl shadow-sm">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-600">No reviews yet</p>
          <p className="text-sm mt-1">Click <span className="font-semibold text-emerald-600">Add Review</span> to submit your first performance review</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.sort((a, b) => b.reviewedOn?.localeCompare(a.reviewedOn || '') || 0).map(r => (
            <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700">{r.employeeName.charAt(0)}</div>
                    <div>
                      <p className="font-semibold text-gray-900">{r.employeeName}</p>
                      <p className="text-xs text-gray-500">Period: {r.period} · Reviewed: {r.reviewedOn}</p>
                    </div>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${r.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2 ml-11">
                    <StarRating value={r.rating} />
                    <span className={`text-sm font-semibold ${RATING_COLORS[r.rating]}`}>{RATING_LABELS[r.rating]}</span>
                  </div>
                  <div className="ml-11 space-y-1.5">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Goals / KPIs</p>
                      <p className="text-sm text-gray-700">{r.goals}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-500 uppercase mb-1">Feedback</p>
                      <p className="text-sm text-gray-700">{r.feedback}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(r)} className="text-xs border border-emerald-200 text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg font-medium">Edit</button>
                  <button onClick={() => handleDelete(r)} disabled={deleting === r.id} className="text-xs border border-red-200 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg font-medium disabled:opacity-50">
                    {deleting === r.id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{editTarget ? 'Edit Review' : 'Add Performance Review'}</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              {/* Employee search */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={empSearch}
                    onChange={e => { setEmpSearch(e.target.value); setForm(p => ({ ...p, employeeId: '', employeeName: '' })); setShowSugg(true); }}
                    onFocus={() => setShowSugg(true)}
                    placeholder="Type employee name…"
                    className="w-full pl-9 pr-3 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {showSugg && empSuggestions.length > 0 && !form.employeeId && (
                  <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {empSuggestions.map(emp => (
                      <button key={emp.id} type="button" onMouseDown={() => selectEmployee(emp)} className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">{emp.name.charAt(0)}</div>
                        <div><p className="text-sm font-medium">{emp.name}</p><p className="text-xs text-gray-400">{emp.department} · {emp.designation}</p></div>
                      </button>
                    ))}
                  </div>
                )}
                {form.employeeId && <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Selected: {form.employeeName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review Period <span className="text-red-500">*</span></label>
                <input value={form.period} onChange={e => setForm(p => ({ ...p, period: e.target.value }))} placeholder="e.g. Q3 2026 or July 2026" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goals / KPIs <span className="text-red-500">*</span></label>
                <textarea value={form.goals} onChange={e => setForm(p => ({ ...p, goals: e.target.value }))} rows={2} placeholder="List the goals and KPIs evaluated this period…" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Rating: <span className="text-emerald-600 font-semibold">{form.rating}/5 — {RATING_LABELS[form.rating]}</span>
                </label>
                <StarPicker value={form.rating} onChange={v => setForm(p => ({ ...p, rating: v }))} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Feedback <span className="text-red-500">*</span></label>
                <textarea value={form.feedback} onChange={e => setForm(p => ({ ...p, feedback: e.target.value }))} rows={3} placeholder="Provide detailed performance feedback, strengths, and areas for improvement…" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-60">
                  <Send className="w-4 h-4" /> {saving ? 'Saving…' : editTarget ? 'Update Review' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
