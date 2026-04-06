import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const permissionSchema = new mongoose.Schema({
  allowed: [{
    type: String,
    enum: [
      'dashboard.view',
      'members.view', 'members.create', 'members.edit', 'members.delete',
      'contributions.view', 'contributions.create',
      'loans.view', 'loans.create', 'loans.approve', 'loans.disburse',
      'savings.view', 'savings.create', 'savings.addTransaction',
      'welfare.view', 'welfare.create', 'welfare.approve',
      'reports.view',
      'meetings.view', 'meetings.create',
      'announcements.view', 'announcements.create',
      'settings.view', 'settings.edit',
      'users.view', 'users.create', 'users.edit', 'users.delete',
    ],
  }],
  denied: [{
    type: String,
    enum: [
      'dashboard.view',
      'members.view', 'members.create', 'members.edit', 'members.delete',
      'contributions.view', 'contributions.create',
      'loans.view', 'loans.create', 'loans.approve', 'loans.disburse',
      'savings.view', 'savings.create', 'savings.addTransaction',
      'welfare.view', 'welfare.create', 'welfare.approve',
      'reports.view',
      'meetings.view', 'meetings.create',
      'announcements.view', 'announcements.create',
      'settings.view', 'settings.edit',
      'users.view', 'users.create', 'users.edit', 'users.delete',
    ],
  }],
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'treasurer', 'secretary', 'member'],
    default: 'member',
  },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
  },
  permissionScope: {
    type: permissionSchema,
    default: () => ({ allowed: [] }),
  },
}, {
  timestamps: true,
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);