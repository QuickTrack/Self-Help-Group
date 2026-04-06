import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500 },
  location: { type: String, trim: true, maxlength: 100 },
  contactEmail: { type: String, trim: true, lowercase: true },
  contactPhone: { type: String, trim: true },
  registrationNumber: { type: String, trim: true },
  foundedDate: { type: Date },
  defaultCurrency: { type: String, default: 'KES', enum: ['KES', 'USD', 'UGX', 'TZS'] },
  logo: { type: String },
  address: {
    street: String,
    city: String,
    county: String,
    country: { type: String, default: 'Kenya' },
  },
  settings: {
    monthlyContribution: { type: Number, default: 1000 },
    weeklyContribution: { type: Number, default: 250 },
    shareValue: { type: Number, default: 1000 },
    defaultInterestRate: { type: Number, default: 12 },
    maxLoanPeriod: { type: Number, default: 12 },
    minGuarantors: { type: Number, default: 2 },
  },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

const Group = mongoose.models.Group || mongoose.model('Group', groupSchema);

async function migrate() {
  console.log('🔄 Running Group migration...\n');
  
  await mongoose.connect(MONGODB_URI);
  
  const existingGroup = await Group.findOne({ name: 'Githirioni Self Help Group' });
  
  if (existingGroup) {
    console.log('✓ Group already exists, skipping seed');
  } else {
    const group = await Group.create({
      name: 'Githirioni Self Help Group',
      description: 'A community-based financial and social support group promoting economic empowerment and mutual aid among members in Githirioni, Kiambu County.',
      location: 'Githirioni, Kiambu County',
      contactEmail: 'info@githirioni-shg.org',
      contactPhone: '+254 700 000 000',
      registrationNumber: 'SHG/GTH/2024/001',
      foundedDate: new Date('2020-01-15'),
      defaultCurrency: 'KES',
      address: {
        street: 'Githirioni Market',
        city: 'Githirioni',
        county: 'Kiambu',
        country: 'Kenya',
      },
      settings: {
        monthlyContribution: 1000,
        weeklyContribution: 250,
        shareValue: 1000,
        defaultInterestRate: 12,
        maxLoanPeriod: 12,
        minGuarantors: 2,
      },
      isActive: true,
    });
    console.log(`✓ Created default group: ${group.name} (${group._id})`);
  }
  
  console.log('\n✅ Migration complete!\n');
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});