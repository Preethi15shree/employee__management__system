const db = require('../db');
const makeCrud = require('./_crud');
module.exports = makeCrud(db.payroll, 'Payroll', (q) => {
  const query = {};
  if (q.employeeId) query.employeeId = q.employeeId;
  if (q.department) query.department = q.department;
  return query;
});
