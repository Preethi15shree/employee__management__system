const db = require('../db');
const makeCrud = require('./_crud');
module.exports = makeCrud(db.performanceReviews, 'Performance Review', (q) => {
  const query = {};
  if (q.employeeId) query.employeeId = q.employeeId;
  if (q.reviewerId) query.reviewerId = q.reviewerId;
  return query;
});
