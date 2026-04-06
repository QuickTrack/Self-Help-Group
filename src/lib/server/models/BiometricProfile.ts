import mongoose from 'mongoose';

const biometricProfileSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
    unique: true,
  },
  hashAlgorithm: {
    type: String,
    enum: ['sha256', 'sha512', 'bcrypt'],
    default: 'sha256',
  },
  biometricType: {
    type: String,
    enum: ['fingerprint', 'face', 'iris'],
    required: true,
  },
  biometricTemplate: {
    type: String,
    required: true,
  },
  enrolledAt: {
    type: Date,
    default: Date.now,
  },
  lastUsed: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  consentGiven: {
    type: Boolean,
    default: false,
  },
  consentDate: {
    type: Date,
  },
}, {
  timestamps: true,
});

biometricProfileSchema.index({ biometricType: 1 });

export const BiometricProfile = mongoose.models.BiometricProfile || mongoose.model('BiometricProfile', biometricProfileSchema);