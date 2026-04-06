import mongoose from 'mongoose';

const lifeEventTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  maxCompensation: {
    type: Number,
    required: true,
    min: 0,
  },
}, {
  timestamps: true,
});

export const LifeEventType = mongoose.models.LifeEventType || mongoose.model('LifeEventType', lifeEventTypeSchema);