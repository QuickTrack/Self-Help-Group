import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    minlength: [2, 'Group name must be at least 2 characters'],
    maxlength: [100, 'Group name cannot exceed 100 characters'],
    unique: true,
    uniqueCaseInsensitive: true,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  location: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  contactPhone: {
    type: String,
    trim: true,
  },
  registrationNumber: {
    type: String,
    trim: true,
  },
  foundedDate: {
    type: Date,
  },
  defaultCurrency: {
    type: String,
    default: 'KES',
    enum: {
      values: ['KES', 'USD', 'UGX', 'TZS'],
      message: 'Currency must be one of: KES, USD, UGX, TZS',
    },
  },
  logo: {
    type: String,
  },
  address: {
    street: { type: String, trim: true, maxlength: 200 },
    city: { type: String, trim: true, maxlength: 100 },
    county: { type: String, trim: true, maxlength: 100 },
    country: { type: String, default: 'Kenya', maxlength: 100 },
  },
  settings: {
    monthlyContribution: { type: Number, default: 1000, min: [0, 'Must be positive'] },
    weeklyContribution: { type: Number, default: 250, min: [0, 'Must be positive'] },
    shareValue: { type: Number, default: 1000, min: [0, 'Must be positive'] },
    defaultInterestRate: { type: Number, default: 12, min: [0, 'Must be positive'], max: [100, 'Cannot exceed 100%'] },
    maxLoanPeriod: { type: Number, default: 12, min: [1, 'Minimum 1 month'], max: [60, 'Maximum 60 months'] },
    minGuarantors: { type: Number, default: 2, min: [1, 'At least 1 guarantor required'] },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  version: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

groupSchema.index({ name: 1 });
groupSchema.index({ isActive: 1 });
groupSchema.index({ registrationNumber: 1 });

groupSchema.pre('save', function(next) {
  this.version += 1;
  next();
});

groupSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export const Group = mongoose.models.Group || mongoose.model('Group', groupSchema);