import mongoose from 'mongoose';

const leadershipRoleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  holderName: { type: String },
  phone: { type: String },
  email: { type: String },
  startDate: { type: Date },
});

const settingsSchema = new mongoose.Schema({
  groupName: {
    type: String,
    default: 'Githirioni Self Help Group',
  },
  logo: {
    type: String,
  },
  description: {
    type: String,
  },
  foundedDate: {
    type: Date,
  },
  location: {
    street: { type: String },
    city: { type: String },
    county: { type: String },
    country: { type: String, default: 'Kenya' },
  },
  contactPhone: {
    type: String,
  },
  contactEmail: {
    type: String,
  },
  registrationNumber: {
    type: String,
  },
  mission: {
    type: String,
  },
  vision: {
    type: String,
  },
  leadershipStructure: {
    chairperson: leadershipRoleSchema,
    viceChairperson: leadershipRoleSchema,
    secretary: leadershipRoleSchema,
    treasurer: leadershipRoleSchema,
    accountant: leadershipRoleSchema,
    committeeMembers: [leadershipRoleSchema],
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
  smsNotifications: {
    type: Boolean,
    default: true,
  },
  emailNotifications: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);