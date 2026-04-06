import mongoose from 'mongoose';

const savingsSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
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
  isGroup: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

savingsSchema.index({ member: 1 }, { unique: true });
savingsSchema.index({ isGroup: 1 });

export const Savings = mongoose.models.Savings || mongoose.model('Savings', savingsSchema);