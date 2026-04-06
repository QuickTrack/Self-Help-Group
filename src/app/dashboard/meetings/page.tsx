'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  X,
  Clock,
  MapPin,
  Users,
  Send,
  Bell,
  Fingerprint,
  Camera,
  Pencil
} from 'lucide-react';
import BiometricCheckIn from '@/components/BiometricCheckIn';

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
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<any>(null);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await fetch('/api/meetings?limit=50');
        const data = await res.json();
        if (data.meetings?.length > 0) {
          setMeetings(data.meetings);
        } else {
          setMeetings(mockMeetings);
        }
      } catch (error) {
        console.error('Failed to load meetings:', error);
        setMeetings(mockMeetings);
      } finally {
        setLoadingMeetings(false);
      }
    };
    fetchMeetings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        setMeetings((prev) => [data.meeting, ...prev]);
      }
    } catch (error) {
      console.error('Failed to create meeting:', error);
    }
    setShowModal(false);
    setFormData({ title: '', date: '', time: '', location: '', agenda: '' });
  };

  const handleAnnouncementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAnnouncementModal(false);
    setAnnouncementData({ title: '', message: '', priority: 'normal' });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeeting) return;
    try {
      const res = await fetch(`/api/meetings/${editingMeeting._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        setMeetings((prev) => 
          prev.map((m) => m._id === editingMeeting._id ? data.meeting : m)
        );
      }
    } catch (error) {
      console.error('Failed to update meeting:', error);
    }
    setShowEditModal(false);
    setEditingMeeting(null);
    setFormData({ title: '', date: '', time: '', location: '', agenda: '' });
  };

  const openEditModal = (meeting: any) => {
    setEditingMeeting(meeting);
    setFormData({
      title: meeting.title || '',
      date: meeting.date ? new Date(meeting.date).toISOString().split('T')[0] : '',
      time: meeting.time || '',
      location: meeting.location || '',
      agenda: meeting.agenda || '',
    });
    setShowEditModal(true);
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
            {loadingMeetings ? (
              <p style={{ color: '#6B7280', textAlign: 'center', padding: '20px' }}>Loading...</p>
            ) : meetings.length === 0 && (
              <p style={{ color: '#6B7280', textAlign: 'center', padding: '20px' }}>No meetings scheduled</p>
            )}
            {meetings.map((meeting) => (
              <div
                key={meeting._id}
                style={{
                  padding: '16px',
                  background: '#F9FAFB',
                  borderRadius: '8px',
                  borderLeft: '3px solid #228B22',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600 }}>{meeting.title}</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => openEditModal(meeting)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        background: '#6B7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      <Pencil size={12} />
                      Edit
                    </button>
                    <button
                      onClick={() => { setSelectedMeetingId(meeting._id); setShowCheckInModal(true); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        background: '#228B22',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      <Fingerprint size={12} />
                      Check-In
                    </button>
                  </div>
                </div>
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
                    {meeting.attendees?.length || 0} expected
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

      {showEditModal && editingMeeting && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px',
              borderBottom: '1px solid #E5E7EB'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Edit Meeting</h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ padding: '20px' }}>
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
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCheckInModal && selectedMeetingId && (
        <div className="modal-overlay" onClick={() => setShowCheckInModal(false)}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: '900px', 
              width: '95%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px',
              borderBottom: '1px solid #E5E7EB'
            }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Biometric Check-In</h3>
                <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Meeting ID: {selectedMeetingId}</p>
              </div>
              <button onClick={() => setShowCheckInModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
              <BiometricCheckIn 
                meetingId={selectedMeetingId} 
                onClose={() => setShowCheckInModal(false)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}