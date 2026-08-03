const db = require('../db');
const makeCrud = require('./_crud');
module.exports = makeCrud(db.systemConfig, 'SystemConfig', (q) => {
  const query = {};
  if (q.category) query.category = q.category;
  return query;
});
