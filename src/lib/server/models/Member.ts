import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  memberId: {
    type: String,
    required: true,
    unique: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  idNumber: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
  },
  location: {
    type: String,
    enum: ['Githirioni', 'Lari', 'Kiambu', 'Other'],
    default: 'Githirioni',
  },
  joinDate: {
    type: Date,
    default: Date.now,
  },
  nextOfKinName: {
    type: String,
    required: true,
  },
  nextOfKinPhone: {
    type: String,
    required: true,
  },
  photo: {
    type: String,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  biometricConsentGiven: {
    type: Boolean,
    default: false,
  },
  biometricConsentDate: {
    type: Date,
  },
  biometricConsentVersion: {
    type: String,
  },
  biometricEnrolled: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export const Member = mongoose.models.Member || mongoose.model('Member', memberSchema);

memberSchema.index({ fullName: 'text', memberId: 'text', phoneNumber: 'text' });
memberSchema.index({ status: 1 });
memberSchema.index({ location: 1 });
memberSchema.index({ createdAt: -1 });