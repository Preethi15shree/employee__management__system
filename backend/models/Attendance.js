const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: { type: String, default: null },
    employeeName: { type: String, required: true },
    date: { type: String, required: true },
    checkIn: { type: String, default: null },
    checkOut: { type: String, default: null },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'On Leave', 'Half Day'],
      required: true,
    },
    shift: { type: String, default: 'Morning' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);
