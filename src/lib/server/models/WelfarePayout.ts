import mongoose from 'mongoose';

const welfarePayoutSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
  },
  eventType: {
    type: String,
    enum: ['Bereavement', 'Wedding', 'Celebration', 'Medical', 'Disaster'],
    required: true,
  },
  eventDescription: {
    type: String,
    required: true,
  },
  requestedAmount: {
    type: Number,
    required: true,
  },
  approvedAmount: {
    type: Number,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Paid', 'Cancelled'],
    default: 'Pending',
  },
  eligibilityCheck: {
    isEligible: {
      type: Boolean,
      default: false,
    },
    minimumContributions: {
      type: Number,
      default: 0,
    },
    minimumMonths: {
      type: Number,
      default: 0,
    },
    contributionMade: {
      type: Number,
      default: 0,
    },
    monthsActive: {
      type: Number,
      default: 0,
    },
    reasons: [{
      type: String,
    }],
    checkedAt: {
      type: Date,
    },
  },
  eventDate: {
    type: Date,
  },
  documents: [{
    name: String,
    url: String,
  }],
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedByName: {
    type: String,
  },
  approvedAt: {
    type: Date,
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  rejectedAt: {
    type: Date,
  },
  rejectionReason: {
    type: String,
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  paidAt: {
    type: Date,
  },
  notes: {
    type: String,
  },
  requestBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  overrideReason: {
    type: String,
  },
  treasurerApprovedBy: {
    type: String,
  },
  treasurerApprovedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

welfarePayoutSchema.index({ member: 1, status: 1 });
welfarePayoutSchema.index({ eventType: 1, status: 1 });
welfarePayoutSchema.index({ createdAt: -1 });

export const WelfarePayout = mongoose.models.WelfarePayout || mongoose.model('WelfarePayout', welfarePayoutSchema);