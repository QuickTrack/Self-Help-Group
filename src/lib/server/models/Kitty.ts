import mongoose from 'mongoose';

const kittySchema = new mongoose.Schema({
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true,
  },
  meetingDate: {
    type: Date,
    default: Date.now,
  },
  totalCollected: {
    type: Number,
    default: 0,
  },
  memberCount: {
    type: Number,
    default: 0,
  },
  meetingBudget: {
    type: Number,
    default: 0,
  },
  contributions: [{
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
    },
    memberName: String,
    memberId: String,
    totalContribution: Number,
    amountPaid: Number,
    paidAt: Date,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

kittySchema.index({ meetingId: 1 }, { unique: true });

export const Kitty = mongoose.models.Kitty || mongoose.model('Kitty', kittySchema);