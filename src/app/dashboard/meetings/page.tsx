'use client';

import { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  X,
  Clock,
  MapPin,
  Users,
  Send,
  Bell
} from 'lucide-react';

const mockMeetings = [
  {
    _id: '1',
    title: 'Monthly General Meeting',
    date: new Date('2024-06-15'),
    time: '10:00 AM',
    location: 'Githirioni Community Hall',
    agenda: '1. Reading of minutes\n2. Financial report\n3. Loan applications\n4. AOB',
    attendees: ['1', '2', '3', '4'],
  },
  {
    _id: '2',
    title: 'Loan Committee Meeting',
    date: new Date('2024-06-20'),
    time: '2:00 PM',
    location: 'SHG Office',
    agenda: 'Review pending loan applications',
    attendees: ['1', '2'],
  },
];

const mockAnnouncements = [
  {
    _id: '1',
    title: 'Upcoming Contribution Deadline',
    message: 'This is a reminder that monthly contributions are due by the 5th of each month.',
    priority: 'high',
    createdAt: new Date('2024-06-01'),
  },
  {
    _id: '2',
    title: 'Annual General Meeting Notice',
    message: 'The AGM will be held on July 15th, 2024. All members are encouraged to attend.',
    priority: 'normal',
    createdAt: new Date('2024-05-28'),
  },
];

export default function MeetingsPage() {
  const [showModal, setShowModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    agenda: '',
  });
  const [announcementData, setAnnouncementData] = useState({
    title: '',
    message: '',
    priority: 'normal',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(false);
    setFormData({ title: '', date: '', time: '', location: '', agenda: '' });
  };

  const handleAnnouncementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAnnouncementModal(false);
    setAnnouncementData({ title: '', message: '', priority: 'normal' });
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '4px' }}>
          Meetings & Announcements
        </h1>
        <p style={{ color: '#6B6B6B', fontSize: '0.875rem' }}>
          Schedule meetings and send announcements
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Upcoming Meetings</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              <Plus size={14} />
              Schedule
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mockMeetings.map((meeting) => (
              <div
                key={meeting._id}
                style={{
                  padding: '16px',
                  background: '#F9FAFB',
                  borderRadius: '8px',
                  borderLeft: '3px solid #228B22',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>{meeting.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.875rem', color: '#6B6B6B' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={14} />
                    {new Date(meeting.date).toLocaleDateString()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={14} />
                    {meeting.time}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={14} />
                    {meeting.location}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={14} />
                    {meeting.attendees.length} expected
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Announcements</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAnnouncementModal(true)}>
              <Send size={14} />
              New
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mockAnnouncements.map((announcement) => (
              <div
                key={announcement._id}
                style={{
                  padding: '16px',
                  background: announcement.priority === 'high' ? '#FEE2E2' : '#F9FAFB',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600 }}>{announcement.title}</div>
                  {announcement.priority === 'high' && (
                    <span className="badge badge-error">Urgent</span>
                  )}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#4A4A4A' }}>{announcement.message}</div>
                <div style={{ fontSize: '0.75rem', color: '#6B6B6B', marginTop: '8px' }}>
                  {new Date(announcement.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px',
              borderBottom: '1px solid #E5E7EB'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Schedule Meeting</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="input-label">Meeting Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div className="form-group">
                    <label className="input-label">Date *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="input-label">Time *</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="input-label">Location *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Agenda</label>
                  <textarea
                    value={formData.agenda}
                    onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Meeting items..."
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAnnouncementModal && (
        <div className="modal-overlay" onClick={() => setShowAnnouncementModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px',
              borderBottom: '1px solid #E5E7EB'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>New Announcement</h3>
              <button onClick={() => setShowAnnouncementModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAnnouncementSubmit} style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="input-label">Title *</label>
                  <input
                    type="text"
                    value={announcementData.title}
                    onChange={(e) => setAnnouncementData({ ...announcementData, title: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Message *</label>
                  <textarea
                    value={announcementData.message}
                    onChange={(e) => setAnnouncementData({ ...announcementData, message: e.target.value })}
                    className="input"
                    rows={3}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Priority</label>
                  <select
                    value={announcementData.priority}
                    onChange={(e) => setAnnouncementData({ ...announcementData, priority: e.target.value })}
                    className="input select"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAnnouncementModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Send</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}