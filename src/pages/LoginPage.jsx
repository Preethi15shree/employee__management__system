import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { LogIn } from 'lucide-react';

const DEMO_CREDS = [
  { role: 'System Admin', email: 'admin@company.com', password: 'admin123', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
  { role: 'HR Admin', email: 'iris.chen@company.com', password: 'hr123456', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
  { role: 'Manager', email: 'bob.smith@company.com', password: 'mgr123456', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
  { role: 'Employee', email: 'alice.johnson@company.com', password: 'emp123456', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
];

export default function LoginPage() {
  const { login, isAuthenticated, homeRoute } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to={homeRoute} replace />;

  function validate() {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      const { ROLE_HOME } = await import('../utils/auth');
      toast.success('Welcome, ' + user.name + '!');
      navigate(ROLE_HOME[user.role] || '/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <LogIn className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-500 mt-1 text-sm">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email Address</label>
            <input
              id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@company.com"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Password</label>
            <input
              id="password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6">
          <p className="text-center text-xs text-gray-400 mb-3">Quick login — Demo accounts</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_CREDS.map(c => (
              <button key={c.role} onClick={() => setForm({ email: c.email, password: c.password })} className={`text-xs font-medium px-3 py-2 rounded-lg transition text-left ${c.color}`}>
                <span className="font-semibold block">{c.role}</span>
                <span className="opacity-70">{c.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
