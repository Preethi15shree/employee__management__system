import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Clock, RefreshCw, Check, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const STATUS_STYLE = {
  Present: 'bg-green-100 text-green-700',
  Absent: 'bg-red-100 text-red-600',
  Late: 'bg-yellow-100 text-yellow-700',
  'On Leave': 'bg-blue-100 text-blue-700',
  'Work From Home': 'bg-purple-100 text-purple-700',
};

const SHIFTS = ['Morning (9 AM – 6 PM)', 'Evening (2 PM – 11 PM)', 'Night (10 PM – 7 AM)', 'Remote / WFH', 'Flexible'];

export default function TeamOperationsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('attendance');
  const [attendance, setAttendance] = useState([]);
  const [team, setTeam] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);
  const [shifts, setShifts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const mid = String(user?.employeeId || user?.id || '');

  function loadData(silent = false) {
    if (!silent) setLoading(true); else setRefreshing(true);
    Promise.all([
      api.get('/employees'),
      api.get('/attendance'),
    ]).then(([empRes, attRes]) => {
      // Show all employees across all dashboards
      const allTeam = empRes.data;
      const allTeamIds = allTeam.map(e => String(e.id));
      const allAtt = attRes.data.filter(a => allTeamIds.includes(String(a.employeeId)));
      setTeam(allTeam);
      setAllAttendance(allAtt);
      // Filter by selected date
      setAttendance(allAtt.filter(a => a.date === selectedDate));
      // Init shifts
      const s = {};
      allTeam.forEach(e => { s[e.id] = e.currentShift || SHIFTS[0]; });
      setShifts(s);
    }).catch(() => toast.error('Failed to load data'))
      .finally(() => { setLoading(false); setRefreshing(false); });
  }

  useEffect(() => { if (mid) loadData(); }, [mid]);

  useEffect(() => {
    const filtered = allAttendance.filter(a => a.date === selectedDate);
    setAttendance(filtered);
  }, [selectedDate, allAttendance]);

  async function saveShift(emp) {
    try {
      await api.patch('/employees/' + emp.id, { currentShift: shifts[emp.id] });
      toast.success('Shift updated for ' + emp.name);
    } catch { toast.error('Failed to save shift'); }
  }

  function calcHours(checkIn, checkOut) {
    if (!checkIn || !checkOut) return null;
    const [ih, im] = checkIn.split(':').map(Number);
    const [oh, om] = checkOut.split(':').map(Number);
    return ((oh * 60 + om) - (ih * 60 + im)) / 60;
  }

  const summary = {
    Present: attendance.filter(a => a.status === 'Present').length,
    Absent: attendance.filter(a => a.status === 'Absent').length,
    Late: attendance.filter(a => a.status === 'Late').length,
    'On Leave': attendance.filter(a => a.status === 'On Leave').length,
    'Work From Home': attendance.filter(a => a.status === 'Work From Home').length,
  };

  // Team members with no attendance record for selected date
  const teamIds = team.map(e => String(e.id));
  const presentIds = attendance.map(a => String(a.employeeId));
  const absentMembers = team.filter(e => !presentIds.includes(String(e.id)));

  if (loading) return <div className="text-center text-gray-500 py-20">Loading team operations…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Team Operations</h1>
        <button onClick={() => loadData(true)} disabled={refreshing} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {[['attendance', Clock, 'Attendance Monitor'], ['shifts', Users, 'Shift Scheduling']].map(([key, Icon, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── Attendance Tab ── */}
      {tab === 'attendance' && (
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <label className="text-sm font-medium text-gray-700">Date:</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
            {Object.entries(summary).map(([s, count]) => (
              <div key={s} className="bg-white rounded-xl shadow-sm p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[s]}`}>{s}</span>
              </div>
            ))}
          </div>

          {attendance.length === 0 && absentMembers.length === 0 ? (
            <div className="text-center text-gray-400 py-16 bg-white rounded-xl shadow-sm">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No attendance data for {selectedDate}</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {['Employee', 'Department', 'Check In', 'Check Out', 'Hours', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {attendance.map(a => {
                    const hrs = calcHours(a.checkIn, a.checkOut);
                    const emp = team.find(e => String(e.id) === String(a.employeeId));
                    return (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">{a.employeeName.charAt(0)}</div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{a.employeeName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{emp?.department || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 font-medium">{a.checkIn || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 font-medium">{a.checkOut || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{hrs !== null ? hrs.toFixed(1) + ' h' : '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[a.status] || 'bg-gray-100 text-gray-600'}`}>{a.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {absentMembers.map(emp => (
                    <tr key={'absent-' + emp.id} className="hover:bg-red-50/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-600">{emp.name.charAt(0)}</div>
                          <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{emp.department}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">—</td>
                      <td className="px-4 py-3 text-sm text-gray-400">—</td>
                      <td className="px-4 py-3 text-sm text-gray-400">—</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">No Record</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Shift Scheduling Tab ── */}
      {tab === 'shifts' && (
        <div>
          <p className="text-sm text-gray-500 mb-4">Assign work shifts for each team member. Changes are saved to the employee record.</p>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Employee', 'Department', 'Designation', 'Status', 'Shift Assignment', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {team.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-gray-400 py-12">No team members found</td></tr>
                ) : team.map(emp => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700">{emp.name.charAt(0)}</div>
                        <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{emp.department}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{emp.designation}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[emp.status] || 'bg-gray-100 text-gray-500'}`}>{emp.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={shifts[emp.id] || SHIFTS[0]}
                        onChange={e => setShifts(p => ({ ...p, [emp.id]: e.target.value }))}
                        className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {SHIFTS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => saveShift(emp)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                        <Check className="w-3.5 h-3.5" /> Save
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
