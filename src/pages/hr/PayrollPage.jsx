import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Pencil, X, DollarSign } from 'lucide-react';

export default function PayrollPage() {
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  function fetchPayroll() {
    api.get('/payroll').then(r => setPayroll(r.data)).catch(() => toast.error('Failed to load payroll')).finally(() => setLoading(false));
  }

  useEffect(() => { fetchPayroll(); }, []);

  function openEdit(item) {
    setEditTarget(item);
    setForm({ basicSalary: item.basicSalary, hra: item.hra, allowances: item.allowances, bonus: item.bonus, deductions: item.deductions, tax: item.tax });
  }

  function calcNet(f) {
    return (+f.basicSalary || 0) + (+f.hra || 0) + (+f.allowances || 0) + (+f.bonus || 0) - (+f.deductions || 0) - (+f.tax || 0);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const netPay = calcNet(form);
      await api.put(`/payroll/${editTarget.id}`, { ...editTarget, ...form, netPay, lastUpdated: new Date().toISOString().split('T')[0] });
      toast.success('Payroll updated');
      setEditTarget(null);
      fetchPayroll();
    } catch { toast.error('Failed to update'); } finally { setSaving(false); }
  }

  const fmt = n => `$${Number(n).toLocaleString()}`;

  if (loading) return <div className="text-center text-gray-500 py-20">Loading…</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Payroll Management</h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Employee', 'Department', 'Basic Salary', 'HRA', 'Allowances', 'Bonus', 'Deductions', 'Tax', 'Net Pay', 'Last Updated', 'Actions'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payroll.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{p.employeeName}</td>
                  <td className="px-3 py-3 text-sm text-gray-600">{p.department}</td>
                  <td className="px-3 py-3 text-sm text-gray-600">{fmt(p.basicSalary)}</td>
                  <td className="px-3 py-3 text-sm text-gray-600">{fmt(p.hra)}</td>
                  <td className="px-3 py-3 text-sm text-gray-600">{fmt(p.allowances)}</td>
                  <td className="px-3 py-3 text-sm text-green-600">{fmt(p.bonus)}</td>
                  <td className="px-3 py-3 text-sm text-red-500">{fmt(p.deductions)}</td>
                  <td className="px-3 py-3 text-sm text-red-500">{fmt(p.tax)}</td>
                  <td className="px-3 py-3 text-sm font-bold text-gray-900">{fmt(p.netPay)}</td>
                  <td className="px-3 py-3 text-xs text-gray-400">{p.lastUpdated}</td>
                  <td className="px-3 py-3">
                    <button onClick={() => openEdit(p)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"><Pencil className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Edit Payroll — {editTarget.employeeName}</h2>
              <button onClick={() => setEditTarget(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[['Basic Salary', 'basicSalary'], ['HRA', 'hra'], ['Allowances', 'allowances'], ['Bonus', 'bonus'], ['Deductions', 'deductions'], ['Tax', 'tax']].map(([label, field]) => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                    <input type="number" value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                ))}
              </div>
              <div className="bg-purple-50 rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm font-medium text-purple-700">Net Pay</span>
                <span className="text-lg font-bold text-purple-700">${Number(calcNet(form)).toLocaleString()}</span>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setEditTarget(null)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60">{saving ? 'Saving…' : 'Update'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
