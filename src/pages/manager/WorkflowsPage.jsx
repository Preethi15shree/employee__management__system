import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Check, DollarSign, Briefcase, UserMinus, RefreshCw, Plus, X, Search } from 'lucide-react';

const EXPENSE_STATUS_STYLE = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-600',
};
const STAGE_COLORS = {
  Applied: 'bg-gray-100 text-gray-600',
  'HR Screen': 'bg-blue-100 text-blue-600',
  'Technical Interview': 'bg-purple-100 text-purple-700',
  'Final Round': 'bg-orange-100 text-orange-600',
  Offer: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-600',
  'Feedback Submitted': 'bg-emerald-100 text-emerald-700',
};
const DEPARTMENTS = ['Engineering', 'Marketing', 'Finance', 'HR', 'Operations', 'Sales'];
const STAGES = ['Applied', 'HR Screen', 'Technical Interview', 'Final Round', 'Offer', 'Rejected'];
const OFFBOARD_TASKS = ['Exit Interview', 'Return Laptop & Equipment', 'Revoke System Access', 'Knowledge Transfer Document', 'Final Settlement', 'Clear Dues & Loans', 'ID Card & Access Card Return', 'Relieving Letter Issued'];
const REASONS = ['Resignation', 'Termination', 'Retirement', 'Contract End', 'Mutual Separation'];

export default function WorkflowsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('expenses');
  const [expenses, setExpenses] = useState([]);
  const [hiring, setHiring] = useState([]);
  const [offboarding, setOffboarding] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbacks, setFeedbacks] = useState({});
  const [ratings, setRatings] = useState({});
  const [updating, setUpdating] = useState(null);

  // Hiring form state
  const [showHiringForm, setShowHiringForm] = useState(false);
  const [hiringForm, setHiringForm] = useState({ role: '', department: 'Engineering', applicants: [{ name: '', email: '', stage: 'Applied' }] });
  const [savingHiring, setSavingHiring] = useState(false);

  // Offboarding form state
  const [showOffboardForm, setShowOffboardForm] = useState(false);
  const [offboardForm, setOffboardForm] = useState({ employeeId: '', employeeName: '', lastDay: '', reason: 'Resignation', tasks: OFFBOARD_TASKS.map(l => ({ label: l, done: false })) });
  const [empSearch, setEmpSearch] = useState('');
  const [savingOffboard, setSavingOffboard] = useState(false);

  const mid = String(user?.employeeId || user?.id || '');

  function fetchAll(silent = false) {
    if (!silent) setLoading(true); else setRefreshing(true);
    Promise.all([
      api.get('/expenses'),
      api.get('/hiringPipeline'),
      api.get('/offboarding'),
      api.get('/employees'),
    ]).then(([exp, hire, off, emp]) => {
      setExpenses(exp.data);
      setHiring(hire.data);
      setOffboarding(off.data);
      setEmployees(emp.data);
    }).catch(() => toast.error('Failed to load workflows'))
      .finally(() => { setLoading(false); setRefreshing(false); });
  }

  useEffect(() => { if (mid) fetchAll(); }, [mid]);

  // ── Expense Actions ──────────────────────────────────────────────────────
  async function updateExpense(id, status) {
    setUpdating(id);
    try {
      await api.patch('/expenses/' + id, { status, reviewedOn: new Date().toISOString().split('T')[0], reviewedBy: user?.name });
      toast.success('Expense ' + status.toLowerCase());
      fetchAll(true);
    } catch { toast.error('Failed to update expense'); }
    finally { setUpdating(null); }
  }

  // ── Hiring Actions ───────────────────────────────────────────────────────
  function addApplicant() {
    setHiringForm(p => ({ ...p, applicants: [...p.applicants, { name: '', email: '', stage: 'Applied' }] }));
  }
  function removeApplicant(idx) {
    setHiringForm(p => ({ ...p, applicants: p.applicants.filter((_, i) => i !== idx) }));
  }
  function updateApplicant(idx, field, value) {
    setHiringForm(p => ({ ...p, applicants: p.applicants.map((a, i) => i === idx ? { ...a, [field]: value } : a) }));
  }

  async function submitHiring(e) {
    e.preventDefault();
    if (!hiringForm.role.trim()) { toast.error('Job role is required'); return; }
    const validApplicants = hiringForm.applicants.filter(a => a.name.trim() && a.email.trim());
    if (validApplicants.length === 0) { toast.error('Add at least one applicant with name and email'); return; }
    setSavingHiring(true);
    try {
      await api.post('/hiringPipeline', {
        id: Date.now().toString(),
        role: hiringForm.role.trim(),
        department: hiringForm.department,
        postedDate: new Date().toISOString().split('T')[0],
        applicants: validApplicants.map(a => ({ ...a, resumeUrl: '#', rating: 0, feedback: '' })),
        status: 'Active',
        hiringManagerId: mid,
      });
      toast.success('Hiring position created: ' + hiringForm.role);
      setShowHiringForm(false);
      setHiringForm({ role: '', department: 'Engineering', applicants: [{ name: '', email: '', stage: 'Applied' }] });
      fetchAll(true);
    } catch { toast.error('Failed to create position'); }
    finally { setSavingHiring(false); }
  }

  async function submitFeedback(jobId, applicantIdx) {
    const key = jobId + '_' + applicantIdx;
    const fb = (feedbacks[key] || '').trim();
    if (!fb) { toast.error('Please enter feedback before submitting'); return; }
    const rating = ratings[key] || 3;
    const job = hiring.find(h => h.id === jobId);
    if (!job) return;
    const updated = [...job.applicants];
    updated[applicantIdx] = { ...updated[applicantIdx], feedback: fb, rating, stage: 'Feedback Submitted' };
    setUpdating(key);
    try {
      await api.patch('/hiringPipeline/' + jobId, { applicants: updated });
      toast.success('Feedback submitted');
      fetchAll(true);
    } catch { toast.error('Failed to submit feedback'); }
    finally { setUpdating(null); }
  }

  async function updateApplicantStage(jobId, applicantIdx, newStage) {
    const job = hiring.find(h => h.id === jobId);
    if (!job) return;
    const updated = [...job.applicants];
    updated[applicantIdx] = { ...updated[applicantIdx], stage: newStage };
    try {
      await api.patch('/hiringPipeline/' + jobId, { applicants: updated });
      toast.success('Stage updated to ' + newStage);
      fetchAll(true);
    } catch { toast.error('Failed to update stage'); }
  }

  async function deletePosition(id, role) {
    if (!window.confirm('Delete position "' + role + '"?')) return;
    try {
      await api.delete('/hiringPipeline/' + id);
      toast.success('Position deleted');
      fetchAll(true);
    } catch { toast.error('Failed to delete position'); }
  }

  // ── Offboarding Actions ──────────────────────────────────────────────────
  const empSuggestions = empSearch.length >= 1
    ? employees.filter(e => e.name.toLowerCase().includes(empSearch.toLowerCase()))
    : [];

  function selectEmployee(emp) {
    setOffboardForm(p => ({ ...p, employeeId: String(emp.id), employeeName: emp.name }));
    setEmpSearch(emp.name);
  }

  async function submitOffboarding(e) {
    e.preventDefault();
    if (!offboardForm.employeeId) { toast.error('Please select an employee'); return; }
    if (!offboardForm.lastDay) { toast.error('Last working day is required'); return; }
    if (offboarding.some(r => String(r.employeeId) === offboardForm.employeeId && r.status !== 'Completed')) {
      toast.error('Active offboarding already exists for this employee'); return;
    }
    setSavingOffboard(true);
    try {
      await api.post('/offboarding', {
        id: Date.now().toString(),
        employeeId: offboardForm.employeeId,
        employeeName: offboardForm.employeeName,
        managerId: mid,
        lastDay: offboardForm.lastDay,
        reason: offboardForm.reason,
        tasks: offboardForm.tasks,
        status: 'In Progress',
        initiatedOn: new Date().toISOString().split('T')[0],
      });
      toast.success('Offboarding initiated for ' + offboardForm.employeeName);
      setShowOffboardForm(false);
      setOffboardForm({ employeeId: '', employeeName: '', lastDay: '', reason: 'Resignation', tasks: OFFBOARD_TASKS.map(l => ({ label: l, done: false })) });
      setEmpSearch('');
      fetchAll(true);
    } catch { toast.error('Failed to initiate offboarding'); }
    finally { setSavingOffboard(false); }
  }

  async function toggleOffboardTask(record, idx) {
    const tasks = record.tasks.map((t, i) => i === idx ? { ...t, done: !t.done } : t);
    const allDone = tasks.every(t => t.done);
    try {
      await api.patch('/offboarding/' + record.id, { tasks, status: allDone ? 'Completed' : 'In Progress' });
      if (allDone) {
        const emp = employees.find(e => String(e.id) === String(record.employeeId));
        if (emp) {
          await api.delete('/employees/' + emp.id);
          toast.success(record.employeeName + "'s offboarding completed & removed from employees");
        } else {
          toast.success(record.employeeName + "'s offboarding completed!");
        }
      }
      fetchAll(true);
    } catch { toast.error('Failed to update task'); }
  }

  const pendingExpenses = expenses.filter(e => e.status === 'Pending').length;
  const pendingFeedback = hiring.reduce((s, j) => s + j.applicants.filter(a => !a.feedback).length, 0);
  const openOffboarding = offboarding.filter(o => o.status !== 'Completed').length;

  if (loading) return <div className="text-center text-gray-500 py-20">Loading workflows…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Direct Action Workflows</h1>
        <button onClick={() => fetchAll(true)} disabled={refreshing} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 flex-wrap">
        {[
          ['expenses', DollarSign, 'Expense Approvals', pendingExpenses],
          ['hiring', Briefcase, 'Hiring Pipeline', pendingFeedback],
          ['offboarding', UserMinus, 'Offboarding', openOffboarding],
        ].map(([key, Icon, label, badge]) => (
          <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-4 h-4" />{label}
            {badge > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${tab === key ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>{badge}</span>}
          </button>
        ))}
      </div>

      {/* ── EXPENSE APPROVALS ─────────────────────────────────────────── */}
      {tab === 'expenses' && (
        <div className="space-y-3">
          {expenses.length === 0 ? (
            <div className="text-center text-gray-400 py-20 bg-white rounded-xl shadow-sm">
              <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-gray-600">No expense requests yet</p>
            </div>
          ) : expenses.sort((a, b) => (b.submittedOn || '').localeCompare(a.submittedOn || '')).map(exp => (
            <div key={exp.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700">{exp.employeeName.charAt(0)}</div>
                    <div>
                      <p className="font-semibold text-gray-900">{exp.employeeName}</p>
                      <p className="text-xs text-gray-500">Submitted: {exp.submittedOn}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${EXPENSE_STATUS_STYLE[exp.status]}`}>{exp.status}</span>
                  </div>
                  <p className="text-sm text-gray-700 ml-11"><span className="font-medium">{exp.category}</span> · {exp.description}</p>
                  <p className="text-xs text-gray-400 ml-11 mt-0.5">Expense Date: {exp.date}{exp.reviewedBy ? ` · Reviewed by ${exp.reviewedBy}` : ''}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-2xl font-bold text-gray-900">₹{Number(exp.amount || 0).toLocaleString('en-IN')}</span>
                  {exp.status === 'Pending' && (
                    <div className="flex gap-2">
                      <button disabled={updating === exp.id} onClick={() => updateExpense(exp.id, 'Approved')} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button disabled={updating === exp.id} onClick={() => updateExpense(exp.id, 'Rejected')} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── HIRING PIPELINE ───────────────────────────────────────────── */}
      {tab === 'hiring' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowHiringForm(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> Add New Position
            </button>
          </div>
          <div className="space-y-5">
            {hiring.length === 0 ? (
              <div className="text-center text-gray-400 py-20 bg-white rounded-xl shadow-sm">
                <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium text-gray-600">No open positions</p>
                <p className="text-sm mt-1">Click <span className="font-semibold text-emerald-600">Add New Position</span> to create one</p>
              </div>
            ) : hiring.map(job => (
              <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-5 flex-wrap gap-2">
                  <div>
                    <p className="text-lg font-bold text-gray-900">{job.role}</p>
                    <p className="text-sm text-gray-500">{job.department} · Posted {job.postedDate}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">{job.status}</span>
                    <button onClick={() => deletePosition(job.id, job.role)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><X className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="space-y-3">
                  {(job.applicants || []).map((ap, idx) => {
                    const key = job.id + '_' + idx;
                    return (
                      <div key={idx} className="border border-gray-100 rounded-xl p-4">
                        <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                          <div>
                            <p className="font-semibold text-gray-900">{ap.name}</p>
                            <p className="text-xs text-gray-500">{ap.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <select value={ap.stage} onChange={e => updateApplicantStage(job.id, idx, e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500">
                              {STAGES.map(s => <option key={s}>{s}</option>)}
                            </select>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STAGE_COLORS[ap.stage] || 'bg-gray-100 text-gray-600'}`}>{ap.stage}</span>
                          </div>
                        </div>
                        {ap.feedback ? (
                          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm">
                            <p className="text-xs font-semibold text-emerald-700 mb-1">Feedback Submitted</p>
                            <p className="text-gray-700">{ap.feedback}</p>
                            <div className="flex gap-0.5 mt-1">{[1,2,3,4,5].map(n=><span key={n} className={`text-sm ${n<=ap.rating?'text-amber-400':'text-gray-200'}`}>★</span>)}</div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <textarea value={feedbacks[key]||''} onChange={e=>setFeedbacks(p=>({...p,[key]:e.target.value}))} placeholder="Write interview feedback…" rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Rating:</span>
                                {[1,2,3,4,5].map(n=><button key={n} type="button" onClick={()=>setRatings(p=>({...p,[key]:n}))} className={`text-xl ${n<=(ratings[key]||3)?'text-amber-400':'text-gray-200 hover:text-amber-300'}`}>★</button>)}
                              </div>
                              <button disabled={updating===key} onClick={()=>submitFeedback(job.id,idx)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-60">
                                <Check className="w-3.5 h-3.5" /> {updating===key?'Saving…':'Submit Feedback'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── OFFBOARDING ───────────────────────────────────────────────── */}
      {tab === 'offboarding' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowOffboardForm(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> Initiate Offboarding
            </button>
          </div>
          <div className="space-y-4">
            {offboarding.length === 0 ? (
              <div className="text-center text-gray-400 py-20 bg-white rounded-xl shadow-sm">
                <UserMinus className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium text-gray-600">No offboarding in progress</p>
                <p className="text-sm mt-1">Click <span className="font-semibold text-red-600">Initiate Offboarding</span> to start an exit process</p>
              </div>
            ) : offboarding.map(record => {
              const done = record.tasks.filter(t => t.done).length;
              const pct = Math.round(done / record.tasks.length * 100);
              return (
                <div key={record.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{record.employeeName}</p>
                      <p className="text-sm text-gray-500">Last Day: <span className="font-semibold text-red-500">{record.lastDay}</span> · {record.reason}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${record.status==='Completed'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{record.status}</span>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1.5"><span>Exit Checklist</span><span className="font-semibold">{done}/{record.tasks.length} · {pct}%</span></div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${pct===100?'bg-green-500':'bg-emerald-500'}`} style={{width:pct+'%'}} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {record.tasks.map((task, idx) => (
                      <button key={idx} onClick={()=>toggleOffboardTask(record,idx)} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-left transition ${task.done?'bg-green-50 text-green-800 border border-green-100':'bg-gray-50 text-gray-700 border border-gray-100 hover:bg-gray-100'}`}>
                        <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${task.done?'bg-green-500':'border-2 border-gray-300'}`}>{task.done&&<Check className="w-3 h-3 text-white"/>}</div>
                        <span className={`flex-1 ${task.done?'line-through opacity-70':''}`}>{task.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ADD HIRING POSITION MODAL ─────────────────────────────────── */}
      {showHiringForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add New Position</h2>
              <button onClick={() => setShowHiringForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={submitHiring} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Role / Title <span className="text-red-500">*</span></label>
                <input value={hiringForm.role} onChange={e=>setHiringForm(p=>({...p,role:e.target.value}))} placeholder="e.g. Senior React Developer" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select value={hiringForm.department} onChange={e=>setHiringForm(p=>({...p,department:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {DEPARTMENTS.map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Applicants <span className="text-red-500">*</span></label>
                  <button type="button" onClick={addApplicant} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"><Plus className="w-3.5 h-3.5"/>Add Applicant</button>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {hiringForm.applicants.map((ap, idx) => (
                    <div key={idx} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500">Applicant {idx+1}</span>
                        {hiringForm.applicants.length > 1 && <button type="button" onClick={()=>removeApplicant(idx)} className="text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5"/></button>}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input value={ap.name} onChange={e=>updateApplicant(idx,'name',e.target.value)} placeholder="Full name" className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                        <input value={ap.email} onChange={e=>updateApplicant(idx,'email',e.target.value)} placeholder="Email" className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                        <select value={ap.stage} onChange={e=>updateApplicant(idx,'stage',e.target.value)} className="col-span-2 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500">
                          {STAGES.map(s=><option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={()=>setShowHiringForm(false)} className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={savingHiring} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
                  <Briefcase className="w-4 h-4" />{savingHiring?'Creating…':'Create Position'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── INITIATE OFFBOARDING MODAL ────────────────────────────────── */}
      {showOffboardForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Initiate Offboarding</h2>
              <button onClick={()=>setShowOffboardForm(false)}><X className="w-5 h-5 text-gray-400"/></button>
            </div>
            <form onSubmit={submitOffboarding} className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                  <input value={empSearch} onChange={e=>{setEmpSearch(e.target.value);setOffboardForm(p=>({...p,employeeId:'',employeeName:''}));}} placeholder="Type employee name…" className="w-full pl-9 pr-3 border border-gray-300 rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"/>
                </div>
                {empSuggestions.length > 0 && !offboardForm.employeeId && (
                  <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-44 overflow-y-auto">
                    {empSuggestions.map(emp=>(
                      <button key={emp.id} type="button" onMouseDown={()=>selectEmployee(emp)} className="w-full text-left px-4 py-2.5 hover:bg-red-50 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-700">{emp.name.charAt(0)}</div>
                        <div><p className="text-sm font-medium">{emp.name}</p><p className="text-xs text-gray-400">{emp.department} · {emp.designation}</p></div>
                      </button>
                    ))}
                  </div>
                )}
                {offboardForm.employeeId && <p className="text-xs text-red-600 mt-1">✓ Selected: {offboardForm.employeeName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Working Day <span className="text-red-500">*</span></label>
                <input type="date" value={offboardForm.lastDay} onChange={e=>setOffboardForm(p=>({...p,lastDay:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <select value={offboardForm.reason} onChange={e=>setOffboardForm(p=>({...p,reason:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                  {REASONS.map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Exit Checklist</p>
                <div className="space-y-1.5 max-h-44 overflow-y-auto">
                  {offboardForm.tasks.map((task,idx)=>(
                    <label key={idx} className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                      <input type="checkbox" checked={task.done} onChange={()=>setOffboardForm(p=>({...p,tasks:p.tasks.map((t,i)=>i===idx?{...t,done:!t.done}:t)}))} className="w-4 h-4 accent-red-600"/>
                      <span className="text-sm text-gray-700">{task.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={()=>setShowOffboardForm(false)} className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={savingOffboard} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
                  <UserMinus className="w-4 h-4"/>{savingOffboard?'Initiating…':'Initiate Offboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
