const mongoose = require('mongoose');

const payslipSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    month: { type: String, required: true },
    year: { type: Number, required: true },
    payPeriod: { type: String, default: '' },
    workDays: { type: Number, default: 0 },
    pan: { type: String, default: '' },
    uan: { type: String, default: '' },
    bankName: { type: String, default: '' },
    bankAccount: { type: String, default: '' },
    companyName: { type: String, default: '' },
    companyAddress: { type: String, default: '' },
    basicSalary: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    specialAllowance: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    overtimePay: { type: Number, default: 0 },
    earnings: { type: Number, default: 0 },
    incomeTax: { type: Number, default: 0 },
    pf: { type: Number, default: 0 },
    professionalTax: { type: Number, default: 0 },
    healthInsurance: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    grossEarnings: { type: Number, default: 0 },
    netPay: { type: Number, default: 0 },
    status: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' },
    generatedOn: { type: String, default: () => new Date().toISOString().split('T')[0] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payslip', payslipSchema);
