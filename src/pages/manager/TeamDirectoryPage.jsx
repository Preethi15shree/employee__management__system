import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Search, Mail, Phone, Building2, User, Calendar, X, Edit2, Check } from 'lucide-react';

const DEPT_COLORS = {
  Engineering: 'bg-blue-100 text-blue-700',
  Marketing: 'bg-pink-100 text-pink-700',
  Finance: 'bg-green-100 text-green-700',
  HR: 'bg-purple-100 text-purple-700',
  Operations: 'bg-orange-100 text-orange-700',
  Sales: 'bg-yellow-100 text-yellow-700',
};

const STATUS_STYLE = { Active: 'bg-green-100 text-green-700', Inactive: 'bg-gray-100 text-gray-500', 'On Leave': 'bg-blue-100 text-blue-700' };

function EmployeeModal({ emp, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-gray-900 text-lg">Employee Profile</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-700">{emp.name.charAt(0)}</div>
            <div>
              <p className="text-xl font-bold text-gray-900">{emp.name}</p>
              <p className="text-sm text-gray-500">{emp.designation}</p>
              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[emp.status] || 'bg-gray-100 text-gray-500'}`}>{emp.status}</span>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            {[
              ['Department', emp.department, Building2],
              ['Email', emp.email, Mail],
              ['Phone', emp.phone || '—', Phone],
              ['Employee ID', '#' + emp.id, User],
              ['Join Date', emp.joinDate || '—', Calendar],
              ['Salary', emp.salary ? '₹' + Number(emp.salary).toLocaleString('en-IN') + ' / yr' : '—', null],
            ].map(([label, value, Icon]) => (
              <div key={label} className="flex items-center gap-3">
                {Icon && <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                {!Icon && <div className="w-4 h-4 flex-shrink-0" />}
                <span className="text-gray-500 w-28">{label}</span>
                <span className="font-medium text-gray-800">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeamDirectoryPage() {
  const { user } = useAuth();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState('');

  const mid = String(user?.employeeId || user?.id || '');

  useEffect(() => {
    api.get('/employees')
      .then(r => {
        // Show all employees across all dashboards
        setTeam(r.data);
      })
      .catch(() => toast.error('Failed to load team'))
      .finally(() => setLoading(false));
  }, [mid]);

  const depts = ['All', ...new Set(team.map(e => e.department))];
  const filtered = team.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.name.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.designation?.toLowerCase().includes(q);
    const matchDept = deptFilter === 'All' || e.department === deptFilter;
    return matchSearch && matchDept;
  });

  const active = team.filter(e => e.status === 'Active').length;
  const onLeave = team.filter(e => e.status === 'On Leave').length;

  async function saveNote(emp) {
    try {
      await api.patch('/employees/' + emp.id, { managerNote: noteText });
      setTeam(prev => prev.map(e => e.id === emp.id ? { ...e, managerNote: noteText } : e));
      toast.success('Note saved');
      setEditingNote(null);
    } catch { toast.error('Failed to save note'); }
  }

  if (loading) return <div className="text-center text-gray-500 py-20">Loading team…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Directory</h1>
          <p className="text-sm text-gray-500 mt-0.5">{team.length} members · {active} active · {onLeave} on leave</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, role…" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {depts.map(d => (
            <button key={d} onClick={() => setDeptFilter(d)} className={`px-3 py-2 rounded-lg text-xs font-medium transition ${deptFilter === d ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>{d}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-20 bg-white rounded-xl shadow-sm">No team members found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(emp => (
            <div key={emp.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 text-lg flex-shrink-0 cursor-pointer" onClick={() => setSelected(emp)}>{emp.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate cursor-pointer hover:text-emerald-600" onClick={() => setSelected(emp)}>{emp.name}</p>
                  <p className="text-xs text-gray-500 truncate">{emp.designation}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DEPT_COLORS[emp.department] || 'bg-gray-100 text-gray-600'}`}>{emp.department}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[emp.status] || 'bg-gray-100 text-gray-500'}`}>{emp.status}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-gray-500 mb-3">
                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400" /><span className="truncate">{emp.email}</span></div>
                {emp.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" /><span>{emp.phone}</span></div>}
              </div>

              {/* Manager Note */}
              {editingNote === emp.id ? (
                <div className="mt-2">
                  <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={2} placeholder="Add a private note about this team member…" className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => saveNote(emp)} className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded font-medium"><Check className="w-3 h-3" /> Save</button>
                    <button onClick={() => setEditingNote(null)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between mt-2">
                  <p className="text-xs text-gray-400 italic flex-1">{emp.managerNote || 'No notes yet'}</p>
                  <button onClick={() => { setEditingNote(emp.id); setNoteText(emp.managerNote || ''); }} className="ml-2 flex-shrink-0 text-gray-400 hover:text-emerald-600"><Edit2 className="w-3.5 h-3.5" /></button>
                </div>
              )}

              <button onClick={() => setSelected(emp)} className="w-full mt-3 text-xs border border-emerald-200 text-emerald-600 hover:bg-emerald-50 py-1.5 rounded-lg font-medium transition">View Full Profile</button>
            </div>
          ))}
        </div>
      )}

      {selected && <EmployeeModal emp={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
