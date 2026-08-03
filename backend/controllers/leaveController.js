const db = require('../db');
const makeCrud = require('./_crud');
module.exports = makeCrud(db.leaveRequests, 'Leave Request', (q) => {
  const query = {};
  if (q.employeeId) query.employeeId = q.employeeId;
  if (q.managerId) query.managerId = q.managerId;
  if (q.status) query.status = q.status;
  return query;
});
