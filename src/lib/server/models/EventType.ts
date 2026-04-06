import mongoose from 'mongoose';

const eventTypeSchema = new mongoose.Schema({
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
  isHardcoded: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export const EventType = mongoose.models.EventType || mongoose.model('EventType', eventTypeSchema);
