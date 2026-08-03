const db = require('../db');
const makeCrud = require('./_crud');
module.exports = makeCrud(db.payslips, 'Payslip', (q) => {
  const query = {};
  if (q.employeeId) query.employeeId = q.employeeId;
  if (q.year) query.year = q.year;
  return query;
});
