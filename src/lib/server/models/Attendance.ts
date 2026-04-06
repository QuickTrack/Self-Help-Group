import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true,
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'failed', 'manual'],
    default: 'pending',
  },
  bonusAllocated: {
    type: Boolean,
    default: false,
  },
  bonusAmount: {
    type: Number,
    default: 0,
  },
  bonusPaid: {
    type: Boolean,
    default: false,
  },
  bonusPaidAt: {
    type: Date,
  },
  bonusId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WelfarePayout',
  },
  verifiedAt: {
    type: Date,
  },
  processedAt: {
    type: Date,
  },
  checkInMethod: {
    type: String,
    enum: ['biometric', 'manual', 'qr'],
    default: 'manual',
  },
  deviceId: {
    type: String,
  },
  biometricType: {
    type: String,
    enum: ['fingerprint', 'face', 'iris', null],
    default: null,
  },
  verificationAttempts: {
    type: Number,
    default: 0,
  },
  lastAttemptAt: {
    type: Date,
  },
  failureReason: {
    type: String,
  },
}, {
  timestamps: true,
});

attendanceSchema.index({ meetingId: 1, memberId: 1 }, { unique: true });
attendanceSchema.index({ meetingId: 1, status: 1 });
attendanceSchema.index({ memberId: 1, verifiedAt: 1 });

export const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);