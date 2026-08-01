import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { HardDrive, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function BackupLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  function fetchLogs() {
    api.get('/backupLogs').then(r => setLogs(r.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)))).catch(() => toast.error('Failed to load logs')).finally(() => setLoading(false));
  }

  useEffect(() => { fetchLogs(); }, []);

  async function triggerBackup(type) {
    setTriggering(true);
    try {
      await api.post('/backupLogs', {
        id: Date.now().toString(),
        type,
        status: 'Success',
        size: type === 'Full Backup' ? '248 MB' : '15 MB',
        duration: type === 'Full Backup' ? '3m 08s' : '0m 41s',
        initiatedBy: 'admin@company.com',
        timestamp: new Date().toISOString(),
      });
      toast.success(`${type} initiated successfully`);
      fetchLogs();
    } catch { toast.error('Failed to trigger backup'); } finally { setTriggering(false); }
  }

  const stats = { total: logs.length, success: logs.filter(l => l.status === 'Success').length, failed: logs.filter(l => l.status === 'Failed').length };

  if (loading) return <div className="text-center text-gray-500 py-20">Loading…</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Backup & System Logs</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[['Total Backups', stats.total, 'bg-slate-500'], ['Successful', stats.success, 'bg-green-500'], ['Failed', stats.failed, 'bg-red-500']].map(([label, val, c]) => (
          <div key={label} className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${c} flex items-center justify-center`}>
              <span className="text-white font-bold text-lg">{val}</span>
            </div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <button
          onClick={() => triggerBackup('Full Backup')}
          disabled={triggering}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
        >
          <HardDrive className="w-4 h-4" /> Run Full Backup
        </button>
        <button
          onClick={() => triggerBackup('Incremental Backup')}
          disabled={triggering}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
        >
          <RefreshCw className="w-4 h-4" /> Run Incremental Backup
        </button>
      </div>

      {/* Logs table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Backup History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Type', 'Status', 'Size', 'Duration', 'Initiated By', 'Timestamp'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{log.type}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${log.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {log.status === 'Success' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{log.size || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{log.duration || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{log.initiatedBy}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
