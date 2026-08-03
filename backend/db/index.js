const Datastore = require('nedb-promises');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

const db = {
  employees:          Datastore.create({ filename: path.join(dataDir, 'employees.db'),          autoload: true }),
  users:              Datastore.create({ filename: path.join(dataDir, 'users.db'),              autoload: true }),
  leaveRequests:      Datastore.create({ filename: path.join(dataDir, 'leaveRequests.db'),      autoload: true }),
  payslips:           Datastore.create({ filename: path.join(dataDir, 'payslips.db'),           autoload: true }),
  attendance:         Datastore.create({ filename: path.join(dataDir, 'attendance.db'),         autoload: true }),
  performanceReviews: Datastore.create({ filename: path.join(dataDir, 'performanceReviews.db'), autoload: true }),
  onboarding:         Datastore.create({ filename: path.join(dataDir, 'onboarding.db'),         autoload: true }),
  offboarding:        Datastore.create({ filename: path.join(dataDir, 'offboarding.db'),        autoload: true }),
  payroll:            Datastore.create({ filename: path.join(dataDir, 'payroll.db'),            autoload: true }),
  systemConfig:       Datastore.create({ filename: path.join(dataDir, 'systemConfig.db'),       autoload: true }),
  backupLogs:         Datastore.create({ filename: path.join(dataDir, 'backupLogs.db'),         autoload: true }),
  expenses:           Datastore.create({ filename: path.join(dataDir, 'expenses.db'),           autoload: true }),
  hiringPipeline:     Datastore.create({ filename: path.join(dataDir, 'hiringPipeline.db'),     autoload: true }),
};

module.exports = db;
