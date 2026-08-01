import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import ProfilePage from './pages/employee/ProfilePage';
import LeaveRequestPage from './pages/employee/LeaveRequestPage';
import PayslipsPage from './pages/employee/PayslipsPage';
import ExpensesPage from './pages/employee/ExpensesPage';
import TeamDirectoryPage from './pages/manager/TeamDirectoryPage';
import LeaveApprovalsPage from './pages/manager/LeaveApprovalsPage';
import PerformanceReviewsPage from './pages/manager/PerformanceReviewsPage';
import TeamOperationsPage from './pages/manager/TeamOperationsPage';
import TeamAnalyticsPage from './pages/manager/TeamAnalyticsPage';
import WorkflowsPage from './pages/manager/WorkflowsPage';
import AttendancePage from './pages/hr/AttendancePage';
import OnboardingPage from './pages/hr/OnboardingPage';
import OffboardingMgmtPage from './pages/hr/OffboardingMgmtPage';
import PayrollPage from './pages/hr/PayrollPage';
import SystemConfigPage from './pages/admin/SystemConfigPage';
import RoleManagementPage from './pages/admin/RoleManagementPage';
import BackupLogsPage from './pages/admin/BackupLogsPage';

function HomeRedirect() {
  const { homeRoute } = useAuth();
  return <Navigate to={homeRoute} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position='top-right' />
        <Routes>
          <Route path='/login' element={<LoginPage />} />
          <Route path='/unauthorized' element={<UnauthorizedPage />} />
          <Route path='/' element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<HomeRedirect />} />
            <Route path='dashboard' element={<ProtectedRoute roles={['system_admin','hr_admin']}><DashboardPage /></ProtectedRoute>} />
            <Route path='employees' element={<ProtectedRoute roles={['system_admin','hr_admin']}><EmployeesPage /></ProtectedRoute>} />
            <Route path='my/profile' element={<ProtectedRoute roles={['employee']}><ProfilePage /></ProtectedRoute>} />
            <Route path='my/leaves' element={<ProtectedRoute roles={['employee']}><LeaveRequestPage /></ProtectedRoute>} />
            <Route path='my/payslips' element={<ProtectedRoute roles={['employee']}><PayslipsPage /></ProtectedRoute>} />
            <Route path='my/expenses' element={<ProtectedRoute roles={['employee']}><ExpensesPage /></ProtectedRoute>} />
            <Route path='manager/team' element={<ProtectedRoute roles={['manager']}><TeamDirectoryPage /></ProtectedRoute>} />
            <Route path='manager/leaves' element={<ProtectedRoute roles={['manager']}><LeaveApprovalsPage /></ProtectedRoute>} />
            <Route path='manager/performance' element={<ProtectedRoute roles={['manager']}><PerformanceReviewsPage /></ProtectedRoute>} />
            <Route path='manager/operations' element={<ProtectedRoute roles={['manager']}><TeamOperationsPage /></ProtectedRoute>} />
            <Route path='manager/analytics' element={<ProtectedRoute roles={['manager']}><TeamAnalyticsPage /></ProtectedRoute>} />
            <Route path='manager/workflows' element={<ProtectedRoute roles={['manager']}><WorkflowsPage /></ProtectedRoute>} />
            <Route path='hr/attendance' element={<ProtectedRoute roles={['hr_admin']}><AttendancePage /></ProtectedRoute>} />
            <Route path='hr/onboarding' element={<ProtectedRoute roles={['hr_admin']}><OnboardingPage /></ProtectedRoute>} />
            <Route path='hr/payroll' element={<ProtectedRoute roles={['hr_admin']}><PayrollPage /></ProtectedRoute>} />
            <Route path='hr/offboarding' element={<ProtectedRoute roles={['hr_admin']}><OffboardingMgmtPage /></ProtectedRoute>} />
            <Route path='admin/roles' element={<ProtectedRoute roles={['system_admin']}><RoleManagementPage /></ProtectedRoute>} />
            <Route path='admin/config' element={<ProtectedRoute roles={['system_admin']}><SystemConfigPage /></ProtectedRoute>} />
            <Route path='admin/backup' element={<ProtectedRoute roles={['system_admin']}><BackupLogsPage /></ProtectedRoute>} />
          </Route>
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}