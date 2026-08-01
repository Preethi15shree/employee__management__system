import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Users, LogOut, X, User, Calendar, FileText,
  UsersRound, CheckSquare, TrendingUp, UserPlus, DollarSign,
  ClockIcon, Settings, HardDrive, BadgeCheck, Receipt, UserMinus,
} from 'lucide-react';

const NAV_BY_ROLE = {
  employee: [
    { to: '/my/profile', icon: User, label: 'My Profile' },
    { to: '/my/leaves', icon: Calendar, label: 'Leave Requests' },
    { to: '/my/payslips', icon: FileText, label: 'Payslips' },
    { to: '/my/expenses', icon: Receipt, label: 'My Expenses' },
  ],
  manager: [
    { to: '/manager/team', icon: UsersRound, label: 'Team Directory' },
    { to: '/manager/leaves', icon: CheckSquare, label: 'Leave Approvals' },
    { to: '/manager/performance', icon: TrendingUp, label: 'Performance Reviews' },
    { to: '/manager/operations', icon: ClockIcon, label: 'Team Operations' },
    { to: '/manager/analytics', icon: LayoutDashboard, label: 'Team Analytics' },
    { to: '/manager/workflows', icon: DollarSign, label: 'Workflows' },
  ],
  hr_admin: [
    { to: '/hr/attendance', icon: ClockIcon, label: 'Attendance' },
    { to: '/hr/onboarding', icon: UserPlus, label: 'Onboarding' },
    { to: '/hr/offboarding', icon: UserMinus, label: 'Offboarding' },
    { to: '/hr/payroll', icon: DollarSign, label: 'Payroll' },
    { to: '/employees', icon: Users, label: 'Employees' },
  ],
  system_admin: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Analytics' },
    { to: '/employees', icon: Users, label: 'Employees' },
    { to: '/admin/roles', icon: BadgeCheck, label: 'Role Management' },
    { to: '/admin/config', icon: Settings, label: 'System Config' },
    { to: '/admin/backup', icon: HardDrive, label: 'Backup & Logs' },
  ],
};

const ROLE_COLORS = {
  employee: 'bg-blue-700',
  manager: 'bg-emerald-700',
  hr_admin: 'bg-purple-700',
  system_admin: 'bg-slate-700',
};

const ROLE_LABELS = {
  employee: 'Employee',
  manager: 'Manager',
  hr_admin: 'HR Admin',
  system_admin: 'System Admin',
};

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = NAV_BY_ROLE[user && user.role] || [];
  const bgColor = ROLE_COLORS[user && user.role] || 'bg-indigo-800';

  function handleLogout() {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  }

  const content = (
    <div className="flex flex-col h-full">
      <div className={`flex items-center justify-between p-5 border-b border-white/10 ${bgColor}`}>
        <div className="min-w-0">
          <h2 className="text-white font-bold text-base leading-tight truncate">{user && user.name}</h2>
          <span className="inline-block text-xs bg-white/20 text-white px-2 py-0.5 rounded-full mt-1">
            {ROLE_LABELS[user && user.role] || (user && user.role)}
          </span>
        </div>
        <button className="md:hidden text-white/70 ml-2" onClick={() => setMobileOpen(false)}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ' +
              (isActive ? 'bg-white text-gray-900' : 'text-white/80 hover:bg-white/10 hover:text-white')
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className={`hidden md:flex flex-col w-60 min-h-screen flex-shrink-0 ${bgColor}`}>
        {content}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className={`relative z-50 flex flex-col w-60 h-full ${bgColor}`}>{content}</aside>
        </div>
      )}
    </>
  );
}
