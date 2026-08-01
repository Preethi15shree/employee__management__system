import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, X, Check, UserMinus, RefreshCw, Search } from 'lucide-react';

const DEFAULT_TASKS = [
  'Exit Interview',
  'Return Laptop & Equipment',
  'Revoke System Access',
  'Knowledge Transfer Document',
  'Final Settlement',
  'Clear Dues & Loans',
  'ID Card & Access Card Return',
  'Relieving Letter Issued',
];

const REASONS = ['Resignation', 'Termination', 'Retirement', 'Contract End', 'Mutual Separation'];

export default function HROffboardingPage() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeId: '', employeeName: '', lastDay: '', reason: 'Resignation', tasks: DEFAULT_TASKS.map(l => ({ label: l, done: false })) });
  const [empSearch, setEmpSearch] = useState('');
  const [saving, setSaving] = useState(false);

  function fetchAll(silent = false) {
    if (!silent) setLoading(true); else setRefreshing(true);
    Promise.all([api.get('/offboarding'), api.get('/employees')])
      .then(([off, emp]) => { setRecords(off.data); setEmployees(emp.data); })
      .catch(() => toast.error('Failed to load offboarding data'))
      .finally(() => { setLoading(false); setRefreshing(false); });
  }

  useEffect(() => { fetchAll(); }, []);

  const empSuggestions = empSearch.length >= 1
    ? employees.filter(e => e.name.toLowerCase().includes(empSearch.toLowerCase()))
    : [];

  function selectEmployee(emp) {
    setForm(p => ({ ...p, employeeId: String(emp.id), employeeName: emp.name, managerId: String(emp.managerId || '2') }));
    setEmpSearch(emp.name);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.employeeId) { toast.error('Please select an employee'); return; }
    if (!form.lastDay) { toast.error('Last working day is required'); return; }
    if (records.some(r => String(r.employeeId) === form.employeeId && r.status !== 'Completed')) {
      toast.error('This employee already has an active offboarding process'); return;
    }
    setSaving(true);
    try {
      await api.post('/offboarding', {
        id: Date.now().toString(),
        employeeId: form.employeeId,
        employeeName: form.employeeName,
        managerId: form.managerId || '2',
        lastDay: form.lastDay,
        reason: form.reason,
        tasks: form.tasks,
        status: 'In Progress',
        initiatedOn: new Date().toISOString().split('T')[0],
      });
      toast.success('Offboarding initiated for ' + form.employeeName);
      setShowForm(false);
      setForm({ employeeId: '', employeeName: '', lastDay: '', reason: 'Resignation', tasks: DEFAULT_TASKS.map(l => ({ label: l, done: false })) });
      setEmpSearch('');
      fetchAll(true);
    } catch { toast.error('Failed to initiate offboarding'); }
    finally { setSaving(false); }
  }

  async function toggleTask(record, idx) {
    const tasks = record.tasks.map((t, i) => i === idx ? { ...t, done: !t.done } : t);
    const allDone = tasks.every(t => t.done);
    try {
      await api.patch('/offboarding/' + record.id, { tasks, status: allDone ? 'Completed' : 'In Progress' });
      if (allDone) {
        // Remove the employee from the employees list
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

  async function deleteRecord(id, name) {
    if (!window.confirm('Remove offboarding record for ' + name + '?')) return;
    try {
      await api.delete('/offboarding/' + id);
      toast.success('Offboarding record removed');
      fetchAll(true);
    } catch { toast.error('Failed to delete record'); }
  }

  const filtered = records.filter(r => !search || r.employeeName.toLowerCase().includes(search.toLowerCase()));
  const inProgress = records.filter(r => r.status !== 'Completed').length;
  const completed = records.filter(r => r.status === 'Completed').length;

  if (loading) return <div className="text-center text-gray-500 py-20">Loading offboarding records…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offboarding Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{inProgress} in progress · {completed} completed</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchAll(true)} disabled={refreshing} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> Initiate Offboarding
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by employee name…" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-20 bg-white rounded-xl shadow-sm">
          <UserMinus className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-600">No offboarding records</p>
          <p className="text-sm mt-1">Click <span className="font-semibold text-purple-600">Initiate Offboarding</span> to start an exit process</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.sort((a, b) => a.status === 'Completed' ? 1 : -1).map(record => {
            const done = record.tasks.filter(t => t.done).length;
            const pct = Math.round(done / record.tasks.length * 100);
            return (
              <div key={record.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-700 text-lg">{record.employeeName.charAt(0)}</div>
                    <div>
                      <p className="font-bold text-gray-900">{record.employeeName}</p>
                      <p className="text-sm text-gray-500">Last Day: <span className="font-semibold text-red-500">{record.lastDay}</span> · {record.reason}</p>
                      {record.initiatedOn && <p className="text-xs text-gray-400">Initiated: {record.initiatedOn}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${record.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{record.status}</span>
                    <button onClick={() => deleteRecord(record.id, record.employeeName)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Exit Checklist</span>
                    <span className="font-semibold">{done}/{record.tasks.length} · {pct}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-purple-500'}`} style={{ width: pct + '%' }} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {record.tasks.map((task, idx) => (
                    <button
                      key={idx}
                      onClick={() => toggleTask(record, idx)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-left transition ${task.done ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-gray-50 text-gray-700 border border-gray-100 hover:bg-gray-100'}`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${task.done ? 'bg-green-500' : 'border-2 border-gray-300'}`}>
                        {task.done && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`flex-1 ${task.done ? 'line-through opacity-70' : ''}`}>{task.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Initiate Offboarding Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Initiate Offboarding</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={empSearch}
                    onChange={e => { setEmpSearch(e.target.value); setForm(p => ({ ...p, employeeId: '', employeeName: '' })); }}
                    placeholder="Type employee name…"
                    className="w-full pl-9 pr-3 border border-gray-300 rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                {empSuggestions.length > 0 && !form.employeeId && (
                  <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-44 overflow-y-auto">
                    {empSuggestions.map(emp => (
                      <button key={emp.id} type="button" onMouseDown={() => selectEmployee(emp)} className="w-full text-left px-4 py-2.5 hover:bg-purple-50 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">{emp.name.charAt(0)}</div>
                        <div><p className="text-sm font-medium">{emp.name}</p><p className="text-xs text-gray-400">{emp.department} · {emp.designation}</p></div>
                      </button>
                    ))}
                  </div>
                )}
                {form.employeeId && <p className="text-xs text-purple-600 mt-1">✓ Selected: {form.employeeName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Working Day <span className="text-red-500">*</span></label>
                <input type="date" value={form.lastDay} onChange={e => setForm(p => ({ ...p, lastDay: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Leaving</label>
                <select value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  {REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Exit Checklist Tasks</p>
                <div className="space-y-1.5 max-h-44 overflow-y-auto">
                  {form.tasks.map((task, idx) => (
                    <label key={idx} className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                      <input type="checkbox" checked={task.done} onChange={() => setForm(p => ({ ...p, tasks: p.tasks.map((t, i) => i === idx ? { ...t, done: !t.done } : t) }))} className="w-4 h-4 accent-purple-600" />
                      <span className="text-sm text-gray-700">{task.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
                  <UserMinus className="w-4 h-4" /> {saving ? 'Creating…' : 'Initiate Offboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
