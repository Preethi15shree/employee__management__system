const mongoose = require('mongoose');

const performanceReviewSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    reviewerId: { type: String, required: true },
    reviewerName: { type: String, required: true },
    period: { type: String, required: true },
    goals: { type: String, default: '' },
    rating: { type: Number, min: 1, max: 5, required: true },
    feedback: { type: String, default: '' },
    status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
    reviewedOn: { type: String, default: () => new Date().toISOString().split('T')[0] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PerformanceReview', performanceReviewSchema);
