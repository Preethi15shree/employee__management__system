import { useEffect, useState } from 'react';
import api from '../utils/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Users, UserCheck, Building2, TrendingUp } from 'lucide-react';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/employees')
      .then((res) => setEmployees(res.data))
      .catch(() => setError('Failed to load analytics data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading analytics…</div>;
  if (error) return <div className="text-red-500 text-center mt-10">{error}</div>;

  const total = employees.length;
  const active = employees.filter((e) => e.status === 'Active').length;
  const inactive = total - active;

  // Department-wise count
  const deptMap = employees.reduce((acc, e) => {
    acc[e.department] = (acc[e.department] || 0) + 1;
    return acc;
  }, {});
  const deptData = Object.entries(deptMap).map(([name, value]) => ({ name, value }));

  // Monthly joined (last 6 months)
  const now = new Date();
  const monthlyMap = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    monthlyMap[key] = 0;
  }
  employees.forEach((e) => {
    const d = new Date(e.joiningDate);
    const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    if (key in monthlyMap) monthlyMap[key]++;
  });
  const monthlyData = Object.entries(monthlyMap).map(([month, count]) => ({ month, count }));

  const statusData = [
    { name: 'Active', value: active },
    { name: 'Inactive', value: inactive },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Employees" value={total} color="bg-indigo-500" />
        <StatCard icon={UserCheck} label="Active Employees" value={active} color="bg-green-500" />
        <StatCard icon={Building2} label="Departments" value={Object.keys(deptMap).length} color="bg-amber-500" />
        <StatCard icon={TrendingUp} label="Inactive Employees" value={inactive} color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Department-wise Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Department-wise Employees</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={deptData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Employee Status Distribution</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {statusData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Joined Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">Monthly Joined Employees (Last 6 Months)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
