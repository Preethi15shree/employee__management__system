const mongoose = require('mongoose');

const onboardingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    department: { type: String, required: true },
    jobTitle: { type: String, required: true },
    startDate: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Pending',
    },
    documentsRequired: { type: [String], default: [] },
    documentsSubmitted: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Onboarding', onboardingSchema);
