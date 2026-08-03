const db = require('../db');
const makeCrud = require('./_crud');
module.exports = makeCrud(db.offboarding, 'Offboarding');
