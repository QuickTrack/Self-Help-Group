import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
  },
  principalAmount: {
    type: Number,
    required: true,
  },
  interestRate: {
    type: Number,
    default: 10,
  },
  repaymentPeriod: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Disbursed', 'Paid'],
    default: 'Pending',
  },
  guarantor1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
  },
  guarantor2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
  },
  installmentAmount: {
    type: Number,
  },
  totalInterest: {
    type: Number,
  },
  totalRepayable: {
    type: Number,
  },
  outstandingBalance: {
    type: Number,
  },
  appliedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  disbursedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

loanSchema.pre('save', function (next) {
  if (this.isModified('principalAmount') || this.isModified('interestRate') || this.isModified('repaymentPeriod')) {
    const principal = this.principalAmount;
    const rate = this.interestRate / 100;
    const period = this.repaymentPeriod;
    
    this.totalInterest = Math.round(principal * rate * period);
    this.totalRepayable = principal + this.totalInterest;
    this.installmentAmount = Math.round(this.totalRepayable / period);
    this.outstandingBalance = this.totalRepayable;
  }
  next();
});

export const Loan = mongoose.models.Loan || mongoose.model('Loan', loanSchema);

loanSchema.index({ member: 1, status: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ createdAt: -1 });
loanSchema.index({ dueDate: 1 });