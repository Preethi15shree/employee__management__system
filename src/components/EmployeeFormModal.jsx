import { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';

const DEPARTMENTS = ['Engineering', 'Marketing', 'HR', 'Finance', 'Sales'];
const STATUSES = ['Active', 'Inactive'];
const ROLES = ['employee', 'manager', 'hr_admin'];

const EMPTY = {
  name: '',
  email: '',
  department: '',
  designation: '',
  status: 'Active',
  joiningDate: '',
  password: '',
  role: 'employee',
};

export default function EmployeeFormModal({ employee, onClose, onSave }) {
  const [form, setForm] = useState(employee ? { ...employee } : { ...EMPTY });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const isNew = !employee;

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.department) errs.department = 'Department is required';
    if (!form.designation.trim()) errs.designation = 'Designation is required';
    if (!form.joiningDate) errs.joiningDate = 'Joining date is required';
    if (isNew) {
      if (!form.password || form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    }
    return errs;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  const field = (label, name, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        name={name}
        type={type}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors[name] ? 'border-red-400' : 'border-gray-300'}`}
      />
      {errors[name] && <p className="text-red-500 text-xs mt-0.5">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-gray-900">{employee ? 'Edit Employee' : 'Register New Employee'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {field('Full Name', 'name', 'text', 'John Doe')}
          {field('Email', 'email', 'email', 'john@company.com')}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              name="department"
              value={form.department}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.department ? 'border-red-400' : 'border-gray-300'}`}
            >
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.department && <p className="text-red-500 text-xs mt-0.5">{errors.department}</p>}
          </div>
          {field('Designation', 'designation', 'text', 'Software Engineer')}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {field('Joining Date', 'joiningDate', 'date')}
          {isNew && (
            <>
              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Login Credentials</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select name="role" value={form.role} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      {ROLES.map(r => <option key={r} value={r}>{r === 'employee' ? 'Employee' : r === 'manager' ? 'Manager' : 'HR Admin'}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="Min 6 characters" className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.password ? 'border-red-400' : 'border-gray-300'}`} />
                      <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs mt-0.5">{errors.password}</p>}
                    <p className="text-xs text-gray-400 mt-1">The employee will use this to log in to their dashboard</p>
                  </div>
                </div>
              </div>
            </>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-60">
              {saving ? 'Saving…' : employee ? 'Update' : 'Register Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
