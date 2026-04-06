import mongoose from 'mongoose';

const welfareFundSchema = new mongoose.Schema({
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
  notes: {
    type: String,
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  payoutRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WelfarePayout',
  },
  appliedToPayout: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

welfareFundSchema.index({ member: 1, date: -1 });

export const WelfareFund = mongoose.models.WelfareFund || mongoose.model('WelfareFund', welfareFundSchema);