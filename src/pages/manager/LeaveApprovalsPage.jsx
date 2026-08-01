import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

const STATUS_STYLE = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-600',
};

export default function LeaveApprovalsPage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('Pending');
  const [updating, setUpdating] = useState(null);
  const pollRef = useRef(null);

  const mid = String(user?.employeeId || user?.id || '');

  function fetchLeaves(silent = false) {
    if (!silent) setLoading(true); else setRefreshing(true);
    return api.get('/leaveRequests')
      .then(r => {
        // Show all leave requests across all dashboards
        setLeaves(r.data);
      })
      .catch(() => { if (!silent) toast.error('Failed to load leave requests'); })
      .finally(() => { setLoading(false); setRefreshing(false); });
  }

  useEffect(() => {
    if (!mid) return;
    fetchLeaves();
    pollRef.current = setInterval(() => fetchLeaves(true), 10000);
    return () => clearInterval(pollRef.current);
  }, [mid]);

  async function updateStatus(leave, status) {
    setUpdating(leave.id);
    try {
      await api.patch('/leaveRequests/' + leave.id, { status });
      toast.success('Leave request ' + status.toLowerCase() + ' successfully');
      await fetchLeaves(true);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  }

  const counts = { All: leaves.length, Pending: leaves.filter(l=>l.status==='Pending').length, Approved: leaves.filter(l=>l.status==='Approved').length, Rejected: leaves.filter(l=>l.status==='Rejected').length };
  const filtered = filter === 'All' ? leaves : leaves.filter(l => l.status === filter);

  if (loading) return <div className="text-center text-gray-500 py-20">Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Approvals</h1>
          <p className="text-sm text-gray-500 mt-0.5">Approve or reject time-off requests from your team</p>
        </div>
        <button onClick={() => fetchLeaves(true)} disabled={refreshing} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {['All', 'Pending', 'Approved', 'Rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === s ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}>
            {s}
            <span className={`text-xs px-1.5 rounded-full ${filter === s ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{counts[s]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-20 bg-white rounded-xl shadow-sm">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No {filter.toLowerCase()} leave requests</p>
          {filter === 'Pending' && <p className="text-sm mt-1">Your team has no pending requests right now</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.sort((a,b) => b.appliedOn.localeCompare(a.appliedOn)).map(lr => (
            <div key={lr.id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-emerald-700">{lr.employeeName.charAt(0)}</span>
                    </div>
                    <p className="font-semibold text-gray-900">{lr.employeeName}</p>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${STATUS_STYLE[lr.status]}`}>{lr.status}</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-10">{lr.type} Leave · <span className="font-medium">{lr.from}</span> to <span className="font-medium">{lr.to}</span> · <span className="font-medium">{lr.days} day{lr.days > 1 ? 's' : ''}</span></p>
                  <p className="text-xs text-gray-400 ml-10 mt-1">Reason: {lr.reason} · Applied: {lr.appliedOn}</p>
                </div>
                {lr.status === 'Pending' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button disabled={updating === lr.id} onClick={() => updateStatus(lr, 'Approved')} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-60">
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button disabled={updating === lr.id} onClick={() => updateStatus(lr, 'Rejected')} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-60">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
