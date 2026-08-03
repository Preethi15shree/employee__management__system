const db = require('../db');
const makeCrud = require('./_crud');
module.exports = makeCrud(db.expenses, 'Expense', (q) => {
  const query = {};
  if (q.employeeId) query.employeeId = q.employeeId;
  if (q.status) query.status = q.status;
  return query;
});
