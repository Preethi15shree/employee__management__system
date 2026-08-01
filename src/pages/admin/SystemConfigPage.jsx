import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Pencil, X, Save } from 'lucide-react';

const CATEGORY_COLORS = {
  General: 'bg-blue-100 text-blue-700',
  'Work Policy': 'bg-green-100 text-green-700',
  'Leave Policy': 'bg-yellow-100 text-yellow-700',
  Security: 'bg-red-100 text-red-700',
};

export default function SystemConfigPage() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  function fetchConfigs() {
    api.get('/systemConfig').then(r => setConfigs(r.data)).catch(() => toast.error('Failed to load config')).finally(() => setLoading(false));
  }

  useEffect(() => { fetchConfigs(); }, []);

  async function handleSave(cfg) {
    setSaving(true);
    try {
      await api.patch(`/systemConfig/${cfg.id}`, { value: editValue });
      toast.success(`"${cfg.key}" updated`);
      setEditId(null);
      fetchConfigs();
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  }

  const grouped = configs.reduce((acc, c) => { (acc[c.category] = acc[c.category] || []).push(c); return acc; }, {});

  if (loading) return <div className="text-center text-gray-500 py-20">Loading…</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">System Configuration</h1>
      <div className="space-y-6">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[category] || 'bg-gray-100 text-gray-600'}`}>{category}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {items.map(cfg => (
                <div key={cfg.id} className="px-5 py-4 flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{cfg.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                    <p className="text-xs text-gray-400">{cfg.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {editId === cfg.id ? (
                      <>
                        <input
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-slate-500"
                          autoFocus
                        />
                        <button onClick={() => handleSave(cfg)} disabled={saving} className="p-1.5 text-green-600 hover:bg-green-50 rounded"><Save className="w-4 h-4" /></button>
                        <button onClick={() => setEditId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">{cfg.value}</span>
                        <button onClick={() => { setEditId(cfg.id); setEditValue(cfg.value); }} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded"><Pencil className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
