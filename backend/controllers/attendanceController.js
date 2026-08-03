const db = require('../db');
const makeCrud = require('./_crud');
module.exports = makeCrud(db.attendance, 'Attendance', (q) => {
  const query = {};
  if (q.employeeId) query.employeeId = q.employeeId;
  if (q.date) query.date = q.date;
  return query;
});
