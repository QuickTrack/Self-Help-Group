import mongoose from 'mongoose';

const contributionSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'M-Pesa', 'Bank'],
    default: 'Cash',
  },
  contributionType: {
    type: String,
    enum: ['Monthly', 'Weekly', 'Special'],
    default: 'Monthly',
  },
  isRecurring: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

export const Contribution = mongoose.models.Contribution || mongoose.model('Contribution', contributionSchema);

contributionSchema.index({ member: 1, date: -1 });
contributionSchema.index({ date: -1 });
contributionSchema.index({ contributionType: 1 });
contributionSchema.index({ createdAt: -1 });