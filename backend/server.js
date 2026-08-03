require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const leaveRoutes = require('./routes/leaves');
const payslipRoutes = require('./routes/payslips');
const attendanceRoutes = require('./routes/attendance');
const performanceRoutes = require('./routes/performance');
const onboardingRoutes = require('./routes/onboarding');
const offboardingRoutes = require('./routes/offboarding');
const payrollRoutes = require('./routes/payroll');
const systemConfigRoutes = require('./routes/systemConfig');
const backupLogsRoutes = require('./routes/backupLogs');
const expensesRoutes = require('./routes/expenses');
const hiringPipelineRoutes = require('./routes/hiringPipeline');
const userRoutes = require('./routes/users');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/employees', employeeRoutes);
app.use('/users', userRoutes);
app.use('/leaveRequests', leaveRoutes);
app.use('/payslips', payslipRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/performanceReviews', performanceRoutes);
app.use('/onboarding', onboardingRoutes);
app.use('/offboarding', offboardingRoutes);
app.use('/payroll', payrollRoutes);
app.use('/systemConfig', systemConfigRoutes);
app.use('/backupLogs', backupLogsRoutes);
app.use('/expenses', expensesRoutes);
app.use('/hiringPipeline', hiringPipelineRoutes);

app.get('/', (req, res) => res.json({ message: 'Employee Management API is running' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
