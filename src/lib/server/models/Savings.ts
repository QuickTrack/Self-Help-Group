import mongoose from 'mongoose';

const savingsSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
    unique: true,
  },
  savingsBalance: {
    type: Number,
    default: 0,
  },
  totalShares: {
    type: Number,
    default: 0,
  },
  shareValue: {
    type: Number,
    default: 1000,
  },
}, {
  timestamps: true,
});

export const Savings = mongoose.models.Savings || mongoose.model('Savings', savingsSchema);