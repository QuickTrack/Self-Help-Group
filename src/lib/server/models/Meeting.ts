import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  agenda: {
    type: String,
  },
  minutes: {
    type: String,
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

export const Meeting = mongoose.models.Meeting || mongoose.model('Meeting', meetingSchema);