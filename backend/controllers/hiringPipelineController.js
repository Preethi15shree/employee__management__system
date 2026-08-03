const db = require('../db');
const makeCrud = require('./_crud');
module.exports = makeCrud(db.hiringPipeline, 'HiringPipeline', (q) => {
  const query = {};
  if (q.department) query.department = q.department;
  if (q.status) query.status = q.status;
  if (q.hiringManagerId) query.hiringManagerId = q.hiringManagerId;
  return query;
});
