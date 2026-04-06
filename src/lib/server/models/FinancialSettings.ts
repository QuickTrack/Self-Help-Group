import mongoose from 'mongoose';

const financialSettingsSchema = new mongoose.Schema({
  bonusPerAttendance: {
    type: Number,
    default: 1000,
  },
  shareValue: {
    type: Number,
    default: 5000,
  },
  interestRate: {
    type: Number,
    default: 10,
  },
  monthlyContribution: {
    type: Number,
    default: 1000,
  },
  loanProcessingFee: {
    type: Number,
    default: 500,
  },
  latePaymentPenalty: {
    type: Number,
    default: 100,
  },
}, {
  timestamps: true,
});

export const FinancialSettings = mongoose.models.FinancialSettings || mongoose.model('FinancialSettings', financialSettingsSchema);