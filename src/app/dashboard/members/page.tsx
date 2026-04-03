'use client';

import { useState } from 'react';
import { useStore } from '../../../stores/useStore';
import { 
  Search, 
  Plus, 
  Download, 
  Edit,
  Trash2,
  MapPin,
  X
} from 'lucide-react';

const locationOptions = ['Githirioni', 'Lari', 'Kiambu', 'Other'];
const statusOptions = ['active', 'inactive'];

export default function MembersPage() {
  const { members, addMember, updateMember, deleteMember } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '',
    phoneNumber: '',
    email: '',
    location: 'Githirioni',
    nextOfKinName: '',
    nextOfKinPhone: '',
    status: 'active',
  });

  const filteredMembers = members.filter((member: any) => {
    const matchesSearch = !searchTerm || 
      member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phoneNumber.includes(searchTerm);
    const matchesLocation = !filterLocation || member.location === filterLocation;
    const matchesStatus = !filterStatus || member.status === filterStatus;
    return matchesSearch && matchesLocation && matchesStatus;
  });

  const handleOpenModal = (member?: any) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        fullName: member.fullName,
        idNumber: member.idNumber,
        phoneNumber: member.phoneNumber,
        email: member.email || '',
        location: member.location,
        nextOfKinName: member.nextOfKinName,
        nextOfKinPhone: member.nextOfKinPhone,
        status: member.status,
      });
    } else {
      setEditingMember(null);
      setFormData({
        fullName: '',
        idNumber: '',
        phoneNumber: '',
        email: '',
        location: 'Githirioni',
        nextOfKinName: '',
        nextOfKinPhone: '',
        status: 'active',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMember) {
      updateMember(editingMember._id, formData);
    } else {
      const newMember = {
        _id: String(members.length + 1),
        memberId: `GSH-${String(members.length + 1).padStart(4, '0')}`,
        ...formData,
        joinDate: new Date(),
      };
      addMember(newMember);
    }
    
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this member?')) {
      deleteMember(id);
    }
  };

  const handleExport = () => {
    const csv = [
      ['Member ID', 'Name', 'ID Number', 'Phone', 'Email', 'Location', 'Status', 'Join Date'],
      ...filteredMembers.map((m: any) => [
        m.memberId,
        m.fullName,
        m.idNumber,
        m.phoneNumber,
        m.email || '',
        m.location,
        m.status,
        new Date(m.joinDate).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'members.csv';
    a.click();
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '4px' }}>
          Members
        </h1>
        <p style={{ color: '#6B6B6B', fontSize: '0.875rem' }}>
          Manage your group members
        </p>
      </div>

      <div className="card">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B6B6B' }} />
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input"
                style={{ paddingLeft: '40px', width: '240px', height: '40px' }}
              />
            </div>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="input select"
              style={{ width: '140px', height: '40px' }}
            >
              <option value="">All Locations</option>
              {locationOptions.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input select"
              style={{ width: '120px', height: '40px' }}
            >
              <option value="">All Status</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={handleExport}>
              <Download size={16} />
              Export
            </button>
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              <Plus size={16} />
              Add Member
            </button>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Member ID</th>
              <th>Name</th>
              <th>Contact</th>
              <th>Location</th>
              <th>Join Date</th>
              <th>Status</th>
              <th style={{ width: '80px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#6B6B6B' }}>
                  No members found
                </td>
              </tr>
            ) : (
              filteredMembers.map((member: any) => (
                <tr key={member._id}>
                  <td style={{ fontWeight: 500 }}>{member.memberId}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{member.fullName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B6B6B' }}>ID: {member.idNumber}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.875rem' }}>{member.phoneNumber}</div>
                    {member.email && (
                      <div style={{ fontSize: '0.75rem', color: '#6B6B6B' }}>{member.email}</div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} color="#6B6B6B" />
                      {member.location}
                    </div>
                  </td>
                  <td>{new Date(member.joinDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge badge-${member.status === 'active' ? 'success' : 'warning'}`}>
                      {member.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        onClick={() => handleOpenModal(member)}
                        style={{
                          padding: '6px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#6B6B6B',
                          borderRadius: '4px'
                        }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(member._id)}
                        style={{
                          padding: '6px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#EF4444',
                          borderRadius: '4px'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px',
              borderBottom: '1px solid #E5E7EB'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                {editingMember ? 'Edit Member' : 'Add New Member'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="input-label">Full Name *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">ID Number *</label>
                  <input
                    type="text"
                    value={formData.idNumber}
                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Location</label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input select"
                  >
                    {locationOptions.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="input-label">Next of Kin Name *</label>
                  <input
                    type="text"
                    value={formData.nextOfKinName}
                    onChange={(e) => setFormData({ ...formData, nextOfKinName: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Next of Kin Phone *</label>
                  <input
                    type="tel"
                    value={formData.nextOfKinPhone}
                    onChange={(e) => setFormData({ ...formData, nextOfKinPhone: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="input-label">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input select"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingMember ? 'Update' : 'Add'} Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}