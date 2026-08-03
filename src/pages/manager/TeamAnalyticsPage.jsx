import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, UserCheck, Clock, Star } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const RATING_LABELS = { 1: 'Poor', 2: 'Below Avg', 3: 'Average', 4: 'Good', 5: 'Excellent' };
const RATING_COLORS = { 1: '#ef4444', 2: '#f97316', 3: '#f59e0b', 4: '#22c55e', 5: '#10b981' };

export default function TeamAnalyticsPage() {
  const { user } = useAuth();
  const [team, setTeam] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [skills, setSkills] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const mid = String(user?.employeeId || user?.id || '');

  useEffect(() => {
    if (!mid) return;
    Promise.all([
      api.get('/employees'),
      api.get('/leaveRequests'),
      api.get('/performanceReviews'),
    ]).then(([t, l, r]) => {
      const allTeam = t.data;
      const allTeamIds = allTeam.map(e => String(e._id));
      setTeam(allTeam);
      setLeaves(l.data);
      setSkills([]);
      setReviews(r.data);
    }).catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [mid]);

  if (loading) return <div className="text-center text-gray-500 py-20">Loading analytics…</div>;

  const active = team.filter(e => e.status === 'Active').length;
  const onLeave = team.filter(e => e.status === 'On Leave').length;
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';

  // Leave by type
  const leaveByType = leaves.reduce((acc, l) => { acc[l.type] = (acc[l.type] || 0) + 1; return acc; }, {});
  const leaveData = Object.entries(leaveByType).map(([type, count]) => ({ type, count }));

  // Leave by status
  const leaveStatusData = ['Pending', 'Approved', 'Rejected'].map(s => ({
    name: s, value: leaves.filter(l => l.status === s).length
  })).filter(d => d.value > 0);

  // Status pie
  const statusData = [
    { name: 'Active', value: active },
    { name: 'On Leave', value: onLeave },
    { name: 'Inactive', value: team.length - active - onLeave },
  ].filter(d => d.value > 0);

  // Department breakdown
  const deptData = Object.entries(team.reduce((acc, e) => { acc[e.department] = (acc[e.department] || 0) + 1; return acc; }, {}))
    .map(([dept, count]) => ({ dept, count }));

  // Skills overview
  const teamIds = team.map(e => String(e._id));
  const teamSkills = skills.filter(s => teamIds.includes(String(s.employeeId)));
  const allSkillNames = [...new Set(teamSkills.flatMap(s => (s.skills || []).map(sk => sk.name)))];

  // Rating distribution
  const ratingData = [1, 2, 3, 4, 5].map(n => ({
    rating: RATING_LABELS[n],
    count: reviews.filter(r => r.rating === n).length,
    fill: RATING_COLORS[n],
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Team Analytics</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          ['Team Size', team.length, Users, 'bg-emerald-500'],
          ['Active', active, UserCheck, 'bg-green-500'],
          ['On Leave', onLeave, Clock, 'bg-blue-500'],
          ['Avg Rating', avgRating, Star, 'bg-amber-500'],
        ].map(([label, val, Icon, c]) => (
          <div key={label} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
            <div className={`w-11 h-11 rounded-full ${c} flex items-center justify-center flex-shrink-0`}><Icon className="w-5 h-5 text-white" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{val}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Headcount Status Pie */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Headcount Overview</h2>
          {statusData.length === 0 ? <p className="text-center text-gray-400 py-10">No data</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Department Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Department Distribution</h2>
          {deptData.length === 0 ? <p className="text-center text-gray-400 py-10">No data</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <XAxis dataKey="dept" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Leave by Type */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Leave Requests by Type</h2>
          {leaveData.length === 0 ? <p className="text-center text-gray-400 py-10">No leave data</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={leaveData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Performance Rating Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Performance Rating Distribution</h2>
          {reviews.length === 0 ? <p className="text-center text-gray-400 py-10">No reviews submitted yet</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ratingData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <XAxis dataKey="rating" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {ratingData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Skill Matrix */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Team Skill Matrix</h2>
        {teamSkills.length === 0 ? (
          <p className="text-center text-gray-400 py-10">No skill data available for your team</p>
        ) : allSkillNames.length === 0 ? (
          <p className="text-center text-gray-400 py-10">Skills data is empty</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-6 text-gray-500 font-semibold text-xs uppercase">Employee</th>
                  {allSkillNames.map(s => <th key={s} className="text-center py-2 px-2 text-gray-500 font-semibold text-xs uppercase whitespace-nowrap">{s}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {teamSkills.map(ts => (
                  <tr key={ts._id} className="hover:bg-gray-50">
                    <td className="py-2.5 pr-6 font-medium text-gray-900 whitespace-nowrap">{ts.employeeName}</td>
                    {allSkillNames.map(sn => {
                      const sk = (ts.skills || []).find(s => s.name === sn);
                      return (
                        <td key={sn} className="py-2.5 px-2 text-center">
                          {sk ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sk.certified ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-600'}`}>
                              {sk.level}{sk.certified ? ' ✓' : ''}
                            </span>
                          ) : <span className="text-gray-300 text-base">—</span>}
                        </td>
                      );
                    })}
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
