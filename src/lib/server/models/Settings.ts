import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  groupName: {
    type: String,
    default: 'Githirioni Self Help Group',
  },
  logo: {
    type: String,
  },
  defaultInterestRate: {
    type: Number,
    default: 10,
  },
  shareValue: {
    type: Number,
    default: 1000,
  },
  monthlyContribution: {
    type: Number,
    default: 1000,
  },
  weeklyContribution: {
    type: Number,
    default: 250,
  },
}, {
  timestamps: true,
});

export const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);