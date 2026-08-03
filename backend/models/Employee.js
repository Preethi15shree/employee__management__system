const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    joiningDate: { type: String, default: '' },
    managerId: { type: String, default: null },
    salary: { type: Number, default: 0 },
    skills: { type: [String], default: [] },
    pan: { type: String, default: '' },
    uan: { type: String, default: '' },
    bankName: { type: String, default: '' },
    bankAccount: { type: String, default: '' },
    dateOfBirth: { type: String, default: '' },
    gender: { type: String, default: '' },
    emergencyContact: { type: String, default: '' },
    emergencyPhone: { type: String, default: '' },
    bio: { type: String, default: '' },
    managerNote: { type: String, default: '' },
    currentShift: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', employeeSchema);
