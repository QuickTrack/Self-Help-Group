import mongoose from 'mongoose';

const eligibilitySettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  description: String,
  category: {
    type: String,
    enum: ['eligibility', 'notification', 'limits'],
    default: 'eligibility',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

eligibilitySettingsSchema.index({ category: 1 });

export const EligibilitySettings = mongoose.models.EligibilitySettings || mongoose.model('EligibilitySettings', eligibilitySettingsSchema);

const defaultSettings = [
  { key: 'allowIneligibleSubmissions', value: true, description: 'Allow welfare payout requests to be submitted even when member does not meet eligibility requirements', category: 'eligibility' },
  { key: 'minimumContributionMonths', value: 3, description: 'Minimum number of months with contributions required', category: 'eligibility' },
  { key: 'minimumContributionsAmount', value: 750, description: 'Minimum total contribution amount required (KES)', category: 'eligibility' },
  { key: 'minimumMembershipMonths', value: 3, description: 'Minimum membership period in months', category: 'eligibility' },
  { key: 'requireActiveStatus', value: true, description: 'Require member to be active for eligibility', category: 'eligibility' },
  { key: 'notifyOnPayoutRequest', value: true, description: 'Notify admins when new payout request is submitted', category: 'notification' },
  { key: 'notifyOnPayoutApproved', value: true, description: 'Notify member when payout is approved', category: 'notification' },
  { key: 'notifyOnPayoutRejected', value: true, description: 'Notify member when payout is rejected', category: 'notification' },
  { key: 'notifyOnPayoutPaid', value: true, description: 'Notify member when payout is paid', category: 'notification' },
  { key: 'limitBereavement', value: 20000, description: 'Maximum payout for Bereavement (KES)', category: 'limits' },
  { key: 'limitWedding', value: 15000, description: 'Maximum payout for Wedding (KES)', category: 'limits' },
  { key: 'limitCelebration', value: 10000, description: 'Maximum payout for Celebration (KES)', category: 'limits' },
  { key: 'limitMedical', value: 25000, description: 'Maximum payout for Medical (KES)', category: 'limits' },
  { key: 'limitDisaster', value: 30000, description: 'Maximum payout for Disaster (KES)', category: 'limits' },
];

export async function initializeEligibilitySettings() {
  for (const setting of defaultSettings) {
    await EligibilitySettings.findOneAndUpdate(
      { key: setting.key },
      { $setOnInsert: setting },
      { upsert: true, new: true }
    );
  }
}
