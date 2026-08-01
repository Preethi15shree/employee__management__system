import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';

const STATUS_STYLE = {
  Present: 'bg-green-100 text-green-700',
  Absent: 'bg-red-100 text-red-600',
  Late: 'bg-yellow-100 text-yellow-700',
  'On Leave': 'bg-blue-100 text-blue-700',
};

export default function AttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedDate, setSelectedDate] = useState('2026-07-31');

  function fetchAttendance() {
    api.get('/attendance', { params: selectedDate ? { date: selectedDate } : {} })
      .then(r => setAttendance(r.data))
      .catch(() => toast.error('Failed to load attendance'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchAttendance(); }, [selectedDate]);

  const filtered = attendance.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.employeeName.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const summary = attendance.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {});

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Attendance Tracker</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[['Present', 'bg-green-500'], ['Absent', 'bg-red-500'], ['Late', 'bg-yellow-500'], ['On Leave', 'bg-blue-500']].map(([s, c]) => (
          <div key={s} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${c} flex items-center justify-center`}>
              <span className="text-white font-bold text-lg">{summary[s] || 0}</span>
            </div>
            <p className="text-sm font-medium text-gray-600">{s}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3">
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee…" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
          {['All', 'Present', 'Absent', 'Late', 'On Leave'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center text-gray-500 py-20">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Employee', 'Date', 'Check In', 'Check Out', 'Shift', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{a.employeeName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{a.date}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{a.checkIn || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{a.checkOut || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{a.shift}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[a.status] || 'bg-gray-100 text-gray-600'}`}>{a.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
