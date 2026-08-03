/**
 * Seed script - imports all data from db.json into NeDB datastores.
 * Run with: npm run seed
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const db = require('./db');

const dbJsonPath = path.join(__dirname, '..', 'db.json');
const raw = JSON.parse(fs.readFileSync(dbJsonPath, 'utf-8'));

function stripId(obj) {
  const { id, ...rest } = obj;
  // Preserve original id as _id so cross-references (employeeId, managerId, etc.) still work
  if (id !== undefined) rest._id = String(id);
  return rest;
}

async function seed() {
  console.log('Seeding database...');

  // Clear all stores
  await Promise.all([
    db.employees.remove({}, { multi: true }),
    db.users.remove({}, { multi: true }),
    db.leaveRequests.remove({}, { multi: true }),
    db.payslips.remove({}, { multi: true }),
    db.attendance.remove({}, { multi: true }),
    db.performanceReviews.remove({}, { multi: true }),
    db.onboarding.remove({}, { multi: true }),
    db.offboarding.remove({}, { multi: true }),
    db.payroll.remove({}, { multi: true }),
    db.systemConfig.remove({}, { multi: true }),
    db.backupLogs.remove({}, { multi: true }),
    db.expenses.remove({}, { multi: true }),
    db.hiringPipeline.remove({}, { multi: true }),
  ]);
  console.log('Cleared all collections.');

  // Seed employees
  if (raw.employees && raw.employees.length) {
    await db.employees.insert(raw.employees.map(stripId));
    console.log(`Inserted ${raw.employees.length} employees`);
  }

  // Seed users with hashed passwords
  if (raw.users && raw.users.length) {
    const users = await Promise.all(
      raw.users.map(async (u) => {
        const { id, ...rest } = u;
        if (id !== undefined) rest._id = String(id);
        rest.password = await bcrypt.hash(rest.password, 10);
        return rest;
      })
    );
    await db.users.insert(users);
    console.log(`Inserted ${users.length} users`);
  }

  if (raw.leaveRequests && raw.leaveRequests.length) {
    await db.leaveRequests.insert(raw.leaveRequests.map(stripId));
    console.log(`Inserted ${raw.leaveRequests.length} leaveRequests`);
  }

  if (raw.payslips && raw.payslips.length) {
    await db.payslips.insert(raw.payslips.map(stripId));
    console.log(`Inserted ${raw.payslips.length} payslips`);
  }

  if (raw.attendance && raw.attendance.length) {
    await db.attendance.insert(raw.attendance.map(stripId));
    console.log(`Inserted ${raw.attendance.length} attendance records`);
  }

  if (raw.performanceReviews && raw.performanceReviews.length) {
    await db.performanceReviews.insert(raw.performanceReviews.map(stripId));
    console.log(`Inserted ${raw.performanceReviews.length} performanceReviews`);
  }

  if (raw.onboarding && raw.onboarding.length) {
    await db.onboarding.insert(raw.onboarding.map(stripId));
    console.log(`Inserted ${raw.onboarding.length} onboarding records`);
  }

  if (raw.offboarding && raw.offboarding.length) {
    await db.offboarding.insert(raw.offboarding.map(stripId));
    console.log(`Inserted ${raw.offboarding.length} offboarding records`);
  }

  if (raw.payroll && raw.payroll.length) {
    await db.payroll.insert(raw.payroll.map(stripId));
    console.log(`Inserted ${raw.payroll.length} payroll records`);
  }

  if (raw.systemConfig && raw.systemConfig.length) {
    await db.systemConfig.insert(raw.systemConfig.map(stripId));
    console.log(`Inserted ${raw.systemConfig.length} systemConfig entries`);
  }

  if (raw.backupLogs && raw.backupLogs.length) {
    await db.backupLogs.insert(raw.backupLogs.map(stripId));
    console.log(`Inserted ${raw.backupLogs.length} backupLogs`);
  }

  if (raw.expenses && raw.expenses.length) {
    await db.expenses.insert(raw.expenses.map(stripId));
    console.log(`Inserted ${raw.expenses.length} expenses`);
  }

  if (raw.hiringPipeline && raw.hiringPipeline.length) {
    await db.hiringPipeline.insert(raw.hiringPipeline.map(stripId));
    console.log(`Inserted ${raw.hiringPipeline.length} hiringPipeline entries`);
  }

  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
