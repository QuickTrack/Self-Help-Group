'use client';

import { useState, useEffect } from 'react';
import { 
  Save,
  Building2,
  Percent,
  Bell,
  Shield,
  Heart,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  ChevronRight,
  Settings,
  Users,
  MapPin,
  FileText,
  Target,
  Eye,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import Link from 'next/link';
import type { LifeEventType } from '@/types';
import UserManagementModal from '@/components/UserManagementModal';
import { PermissionGuard } from '@/components/PermissionGuard';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { openModal } from '@/lib/store/userModalSlice';
import { fetchGroupSettings, updateGroupSettings } from '@/lib/store/groupSlice';

interface LeadershipRole {
  title: string;
  holderName?: string;
  phone?: string;
  email?: string;
  startDate?: string;
}

interface LeadershipStructure {
  chairperson: LeadershipRole;
  viceChairperson: LeadershipRole;
  secretary: LeadershipRole;
  treasurer: LeadershipRole;
  accountant: LeadershipRole;
  committeeMembers: LeadershipRole[];
}

interface Location {
  street?: string;
  city?: string;
  county?: string;
  country?: string;
}

interface SettingsState {
  groupName: string;
  description: string;
  foundedDate: string;
  contactPhone: string;
  contactEmail: string;
  registrationNumber: string;
  location: Location;
  mission: string;
  vision: string;
  leadershipStructure: LeadershipStructure;
  defaultInterestRate: string;
  shareValue: string;
  monthlyContribution: string;
  weeklyContribution: string;
  welfareContribution: string;
  bonusPerAttendance: string;
  smsNotifications: boolean;
  emailNotifications: boolean;
}

const defaultLeadershipRole: LeadershipRole = { title: '', holderName: '', phone: '', email: '' };
const defaultLocation: Location = { street: '', city: '', county: '', country: 'Kenya' };

type TabId = 'general' | 'leadership' | 'financial' | 'notifications' | 'security';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const tabs: Tab[] = [
  { id: 'general', label: 'General', icon: Building2 },
  { id: 'leadership', label: 'Leadership', icon: Users },
  { id: 'financial', label: 'Financial', icon: Percent },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
];

const cardStyles = {
  section: {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    padding: '24px',
    marginBottom: '16px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #F3F4F6',
  },
  iconBox: (color: string) => ({
    width: '40px',
    height: '40px',
    background: color,
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  label: {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: '#6B7280',
    marginBottom: '6px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '0.875rem',
    transition: 'all 0.2s',
    outline: 'none',
  },
  inputFocus: {
    borderColor: '#228B22',
    boxShadow: '0 0 0 3px rgba(34, 139, 34, 0.1)',
  },
};

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const { settings: groupSettings } = useAppSelector(state => state.group);
  
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [lifeEventTypes, setLifeEventTypes] = useState<LifeEventType[]>([]);
  const [showAddLifeForm, setShowAddLifeForm] = useState(false);
  const [editingLifeEventType, setEditingLifeEventType] = useState<LifeEventType | null>(null);
  const [lifeEventTypeForm, setLifeEventTypeForm] = useState({ name: '', description: '', maxCompensation: '' });
  const [lifeFormErrors, setLifeFormErrors] = useState<{ name?: string; description?: string; maxCompensation?: string }>({});
  
  const [showLeadershipForm, setShowLeadershipForm] = useState(false);
  const [newCommitteeMember, setNewCommitteeMember] = useState({ title: 'Committee Member', holderName: '', phone: '', email: '' });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    groupInfo: true,
    missionVision: false,
    location: false,
    leadership: true,
    financial: true,
  });

  const [settings, setSettings] = useState<SettingsState>({
    groupName: 'Githirioni Self Help Group',
    description: '',
    foundedDate: '',
    contactPhone: '',
    contactEmail: '',
    registrationNumber: '',
    location: defaultLocation,
    mission: '',
    vision: '',
    leadershipStructure: {
      chairperson: { ...defaultLeadershipRole, title: 'Chairperson' },
      viceChairperson: { ...defaultLeadershipRole, title: 'Vice Chairperson' },
      secretary: { ...defaultLeadershipRole, title: 'Secretary' },
      treasurer: { ...defaultLeadershipRole, title: 'Treasurer' },
      accountant: { ...defaultLeadershipRole, title: 'Accountant' },
      committeeMembers: [],
    },
    defaultInterestRate: '10',
    shareValue: '1000',
    monthlyContribution: '1000',
    weeklyContribution: '250',
    welfareContribution: '100',
    bonusPerAttendance: '1000',
    smsNotifications: true,
    emailNotifications: true,
  });

  useEffect(() => {
    dispatch(fetchGroupSettings());
  }, [dispatch]);

  useEffect(() => {
    if (groupSettings) {
      setSettings({
        groupName: groupSettings.groupName || 'Githirioni Self Help Group',
        description: groupSettings.description || '',
        foundedDate: groupSettings.foundedDate ? groupSettings.foundedDate.split('T')[0] : '',
        contactPhone: groupSettings.contactPhone || '',
        contactEmail: groupSettings.contactEmail || '',
        registrationNumber: groupSettings.registrationNumber || '',
        location: groupSettings.location || defaultLocation,
        mission: groupSettings.mission || '',
        vision: groupSettings.vision || '',
        leadershipStructure: {
          chairperson: { ...defaultLeadershipRole, title: 'Chairperson', ...groupSettings.leadershipStructure?.chairperson },
          viceChairperson: { ...defaultLeadershipRole, title: 'Vice Chairperson', ...groupSettings.leadershipStructure?.viceChairperson },
          secretary: { ...defaultLeadershipRole, title: 'Secretary', ...groupSettings.leadershipStructure?.secretary },
          treasurer: { ...defaultLeadershipRole, title: 'Treasurer', ...groupSettings.leadershipStructure?.treasurer },
          accountant: { ...defaultLeadershipRole, title: 'Accountant', ...groupSettings.leadershipStructure?.accountant },
          committeeMembers: groupSettings.leadershipStructure?.committeeMembers || [],
        },
        defaultInterestRate: String(groupSettings.defaultInterestRate || 10),
        shareValue: String(groupSettings.shareValue || 1000),
        monthlyContribution: String(groupSettings.monthlyContribution || 1000),
        weeklyContribution: String(groupSettings.weeklyContribution || 250),
        welfareContribution: String(groupSettings.welfareContribution || 100),
        bonusPerAttendance: String(groupSettings.bonusPerAttendance || 1000),
        smsNotifications: groupSettings.smsNotifications ?? true,
        emailNotifications: groupSettings.emailNotifications ?? true,
      });
    }
  }, [groupSettings]);

  useEffect(() => {
    const loadFinancialSettings = async () => {
      try {
        const res = await fetch('/api/financial-settings');
        const data = await res.json();
        if (data.settings) {
          setSettings(prev => ({
            ...prev,
            bonusPerAttendance: String(data.settings.bonusPerAttendance || 1000),
            welfareContribution: String(data.settings.welfareContribution || 100),
          }));
        }
      } catch (error) {
        console.error('Failed to load financial settings:', error);
      }
    };
    loadFinancialSettings();
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleAddCommitteeMember = () => {
    if (newCommitteeMember.holderName.trim()) {
      setSettings({
        ...settings,
        leadershipStructure: {
          ...settings.leadershipStructure,
          committeeMembers: [...settings.leadershipStructure.committeeMembers, { ...newCommitteeMember }],
        },
      });
      setNewCommitteeMember({ title: 'Committee Member', holderName: '', phone: '', email: '' });
      setShowLeadershipForm(false);
    }
  };

  const handleRemoveCommitteeMember = (index: number) => {
    setSettings({
      ...settings,
      leadershipStructure: {
        ...settings.leadershipStructure,
        committeeMembers: settings.leadershipStructure.committeeMembers.filter((_, i) => i !== index),
      },
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setApiSuccess(null);
    setSubmitting(true);

    try {
      await dispatch(updateGroupSettings({
        groupName: settings.groupName,
        description: settings.description,
        foundedDate: settings.foundedDate || undefined,
        contactPhone: settings.contactPhone || undefined,
        contactEmail: settings.contactEmail || undefined,
        registrationNumber: settings.registrationNumber || undefined,
        location: settings.location,
        mission: settings.mission || undefined,
        vision: settings.vision || undefined,
        leadershipStructure: settings.leadershipStructure,
        defaultInterestRate: Number(settings.defaultInterestRate),
        shareValue: Number(settings.shareValue),
        monthlyContribution: Number(settings.monthlyContribution),
        weeklyContribution: Number(settings.weeklyContribution),
        smsNotifications: settings.smsNotifications,
        emailNotifications: settings.emailNotifications,
      })).unwrap();

      await fetch('/api/financial-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bonusPerAttendance: Number(settings.bonusPerAttendance),
          shareValue: Number(settings.shareValue),
          interestRate: Number(settings.defaultInterestRate),
          monthlyContribution: Number(settings.monthlyContribution),
          welfareContribution: Number(settings.welfareContribution),
        }),
      });

      setApiSuccess('Settings saved successfully!');
      setTimeout(() => setApiSuccess(null), 3000);
    } catch (error: any) {
      setApiError(error.message || 'Failed to save settings');
    } finally {
      setSubmitting(false);
    }
  };

  const updateRoleField = (role: 'chairperson' | 'viceChairperson' | 'secretary' | 'treasurer' | 'accountant', field: keyof LeadershipRole, value: string) => {
    setSettings({
      ...settings,
      leadershipStructure: {
        ...settings.leadershipStructure,
        [role]: {
          ...settings.leadershipStructure[role],
          [field]: value,
        },
      },
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <>
            <div style={cardStyles.section}>
              <div style={cardStyles.sectionHeader}>
                <div style={cardStyles.iconBox('#EBF5EB')}>
                  <Building2 size={20} color="#228B22" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1A1A1A' }}>Group Information</h3>
                  <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Basic group details</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                <div>
                  <label style={cardStyles.label}>Group Name</label>
                  <input
                    type="text"
                    value={settings.groupName}
                    onChange={(e) => setSettings({ ...settings, groupName: e.target.value })}
                    style={cardStyles.input}
                    onFocus={(e) => e.target.style.borderColor = '#228B22'}
                    onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                  />
                </div>
                <div>
                  <label style={cardStyles.label}>Registration Number</label>
                  <input
                    type="text"
                    value={settings.registrationNumber}
                    onChange={(e) => setSettings({ ...settings, registrationNumber: e.target.value })}
                    style={cardStyles.input}
                    onFocus={(e) => e.target.style.borderColor = '#228B22'}
                    onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                    placeholder="e.g., SHG/2024/001"
                  />
                </div>
                <div>
                  <label style={cardStyles.label}>Founded Date</label>
                  <input
                    type="date"
                    value={settings.foundedDate}
                    onChange={(e) => setSettings({ ...settings, foundedDate: e.target.value })}
                    style={cardStyles.input}
                  />
                </div>
                <div>
                  <label style={cardStyles.label}>Contact Phone</label>
                  <input
                    type="tel"
                    value={settings.contactPhone}
                    onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                    style={cardStyles.input}
                    onFocus={(e) => e.target.style.borderColor = '#228B22'}
                    onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                    placeholder="+254..."
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={cardStyles.label}>Contact Email</label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    style={cardStyles.input}
                    onFocus={(e) => e.target.style.borderColor = '#228B22'}
                    onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                    placeholder="group@example.com"
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={cardStyles.label}>Description</label>
                  <textarea
                    value={settings.description}
                    onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                    style={{ ...cardStyles.input, minHeight: '80px', resize: 'vertical' }}
                    onFocus={(e) => e.target.style.borderColor = '#228B22'}
                    onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                    placeholder="Brief description of the group..."
                  />
                </div>
              </div>
            </div>

            <div style={cardStyles.section}>
              <div 
                style={cardStyles.sectionHeader}
                onClick={() => toggleSection('missionVision')}
                onMouseOver={(e) => e.currentTarget.style.cursor = 'pointer'}
              >
                <div style={cardStyles.iconBox('#F3E8FF')}>
                  <Target size={20} color="#7C3AED" />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1A1A1A' }}>Mission & Vision</h3>
                  <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Group purpose and aspirations</p>
                </div>
                {expandedSections.missionVision ? <ChevronUp size={20} color="#6B7280" /> : <ChevronDown size={20} color="#6B7280" />}
              </div>
              
              {expandedSections.missionVision && (
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={cardStyles.label}>Mission Statement</label>
                    <textarea
                      value={settings.mission}
                      onChange={(e) => setSettings({ ...settings, mission: e.target.value })}
                      style={{ ...cardStyles.input, minHeight: '100px', resize: 'vertical' }}
                      onFocus={(e) => e.target.style.borderColor = '#228B22'}
                      onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                      placeholder="What is the group's purpose? What do you do?"
                    />
                  </div>
                  <div>
                    <label style={cardStyles.label}>Vision Statement</label>
                    <textarea
                      value={settings.vision}
                      onChange={(e) => setSettings({ ...settings, vision: e.target.value })}
                      style={{ ...cardStyles.input, minHeight: '100px', resize: 'vertical' }}
                      onFocus={(e) => e.target.style.borderColor = '#228B22'}
                      onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                      placeholder="What does the group aspire to become?"
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={cardStyles.section}>
              <div 
                style={cardStyles.sectionHeader}
                onClick={() => toggleSection('location')}
                onMouseOver={(e) => e.currentTarget.style.cursor = 'pointer'}
              >
                <div style={cardStyles.iconBox('#FEF3C7')}>
                  <MapPin size={20} color="#D97706" />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1A1A1A' }}>Location</h3>
                  <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Physical address details</p>
                </div>
                {expandedSections.location ? <ChevronUp size={20} color="#6B7280" /> : <ChevronDown size={20} color="#6B7280" />}
              </div>
              
              {expandedSections.location && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={cardStyles.label}>Street Address</label>
                    <input
                      type="text"
                      value={settings.location.street || ''}
                      onChange={(e) => setSettings({ ...settings, location: { ...settings.location, street: e.target.value } })}
                      style={cardStyles.input}
                      onFocus={(e) => e.target.style.borderColor = '#228B22'}
                      onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                      placeholder="e.g., Githirioni Market"
                    />
                  </div>
                  <div>
                    <label style={cardStyles.label}>City/Town</label>
                    <input
                      type="text"
                      value={settings.location.city || ''}
                      onChange={(e) => setSettings({ ...settings, location: { ...settings.location, city: e.target.value } })}
                      style={cardStyles.input}
                      onFocus={(e) => e.target.style.borderColor = '#228B22'}
                      onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                    />
                  </div>
                  <div>
                    <label style={cardStyles.label}>County</label>
                    <input
                      type="text"
                      value={settings.location.county || ''}
                      onChange={(e) => setSettings({ ...settings, location: { ...settings.location, county: e.target.value } })}
                      style={cardStyles.input}
                      onFocus={(e) => e.target.style.borderColor = '#228B22'}
                      onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                      placeholder="e.g., Kiambu"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        );

      case 'leadership':
        return (
          <div style={cardStyles.section}>
            <div style={cardStyles.sectionHeader}>
              <div style={cardStyles.iconBox('#E0E7FF')}>
                <Users size={20} color="#4F46E5" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1A1A1A' }}>Leadership Structure</h3>
                <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Current leadership positions and committee members</p>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {(['chairperson', 'viceChairperson', 'secretary', 'treasurer', 'accountant'] as const).map((role) => (
                <div key={role} style={{ 
                  padding: '16px', 
                  background: '#F9FAFB', 
                  borderRadius: '10px',
                  border: '1px solid #E5E7EB'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    marginBottom: '12px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid #E5E7EB'
                  }}>
                    <div style={{ 
                      width: '28px', 
                      height: '28px', 
                      background: '#4F46E5', 
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Users size={14} color="white" />
                    </div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1A1A1A' }}>
                      {settings.leadershipStructure[role].title}
                    </h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Name"
                      value={settings.leadershipStructure[role].holderName || ''}
                      onChange={(e) => updateRoleField(role, 'holderName', e.target.value)}
                      style={{ ...cardStyles.input, padding: '8px 10px', fontSize: '0.8125rem' }}
                      onFocus={(e) => e.target.style.borderColor = '#228B22'}
                      onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={settings.leadershipStructure[role].phone || ''}
                      onChange={(e) => updateRoleField(role, 'phone', e.target.value)}
                      style={{ ...cardStyles.input, padding: '8px 10px', fontSize: '0.8125rem' }}
                      onFocus={(e) => e.target.style.borderColor = '#228B22'}
                      onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={settings.leadershipStructure[role].email || ''}
                      onChange={(e) => updateRoleField(role, 'email', e.target.value)}
                      style={{ ...cardStyles.input, padding: '8px 10px', fontSize: '0.8125rem' }}
                      onFocus={(e) => e.target.style.borderColor = '#228B22'}
                      onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1A1A1A' }}>Additional Committee Members</h4>
                <button
                  type="button"
                  onClick={() => setShowLeadershipForm(!showLeadershipForm)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: '#228B22',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#1F6B1F'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#228B22'}
                >
                  <Plus size={16} />
                  Add Member
                </button>
              </div>
              
              {showLeadershipForm && (
                <div style={{ 
                  padding: '20px', 
                  background: '#F0FDF4', 
                  borderRadius: '10px', 
                  marginBottom: '16px',
                  border: '1px solid #BBF7D0'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                    <input
                      type="text"
                      placeholder="Role/Title"
                      value={newCommitteeMember.title}
                      onChange={(e) => setNewCommitteeMember({ ...newCommitteeMember, title: e.target.value })}
                      style={cardStyles.input}
                      onFocus={(e) => e.target.style.borderColor = '#228B22'}
                      onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                    />
                    <input
                      type="text"
                      placeholder="Name"
                      value={newCommitteeMember.holderName}
                      onChange={(e) => setNewCommitteeMember({ ...newCommitteeMember, holderName: e.target.value })}
                      style={cardStyles.input}
                      onFocus={(e) => e.target.style.borderColor = '#228B22'}
                      onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={newCommitteeMember.phone}
                      onChange={(e) => setNewCommitteeMember({ ...newCommitteeMember, phone: e.target.value })}
                      style={cardStyles.input}
                      onFocus={(e) => e.target.style.borderColor = '#228B22'}
                      onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={newCommitteeMember.email}
                      onChange={(e) => setNewCommitteeMember({ ...newCommitteeMember, email: e.target.value })}
                      style={cardStyles.input}
                      onFocus={(e) => e.target.style.borderColor = '#228B22'}
                      onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleAddCommitteeMember}
                      style={{
                        padding: '8px 20px',
                        background: '#228B22',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Add Member
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLeadershipForm(false)}
                      style={{
                        padding: '8px 20px',
                        background: 'white',
                        color: '#6B7280',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {settings.leadershipStructure.committeeMembers.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {settings.leadershipStructure.committeeMembers.map((member, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        background: '#F9FAFB',
                        borderRadius: '8px',
                        border: '1px solid #E5E7EB',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ 
                          width: '36px', 
                          height: '36px', 
                          background: '#E0E7FF', 
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Users size={16} color="#4F46E5" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '0.875rem', color: '#1A1A1A' }}>{member.holderName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{member.title}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {member.phone && (
                          <span style={{ fontSize: '0.8125rem', color: '#6B7280' }}>{member.phone}</span>
                        )}
                        {member.email && (
                          <span style={{ fontSize: '0.8125rem', color: '#6B7280' }}>{member.email}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveCommitteeMember(index)}
                          style={{
                            padding: '6px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#DC2626',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#FEE2E2'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ 
                  padding: '24px', 
                  textAlign: 'center', 
                  color: '#6B7280',
                  background: '#F9FAFB',
                  borderRadius: '8px',
                  border: '1px dashed #D1D5DB'
                }}>
                  <Users size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.875rem' }}>No additional committee members added</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'financial':
        return (
          <div style={cardStyles.section}>
            <div style={cardStyles.sectionHeader}>
              <div style={cardStyles.iconBox('#DBEAFE')}>
                <Percent size={20} color="#1E40AF" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1A1A1A' }}>Financial Settings</h3>
                <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Configure financial parameters and contribution amounts</p>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div style={{ 
                padding: '20px', 
                background: '#F0F9FF', 
                borderRadius: '10px',
                border: '1px solid #BAE6FD'
              }}>
                <label style={{ ...cardStyles.label, color: '#0369A1' }}>Default Interest Rate (%)</label>
                <input
                  type="number"
                  value={settings.defaultInterestRate}
                  onChange={(e) => setSettings({ ...settings, defaultInterestRate: e.target.value })}
                  style={{ ...cardStyles.input, borderColor: '#7DD3FC', background: 'white' }}
                  onFocus={(e) => e.target.style.borderColor = '#228B22'}
                  onBlur={(e) => e.target.style.borderColor = '#7DD3FC'}
                />
                <p style={{ fontSize: '0.6875rem', color: '#0C4A6E', marginTop: '6px' }}>Annual interest rate for loans</p>
              </div>
              
              <div style={{ 
                padding: '20px', 
                background: '#FEFCE8', 
                borderRadius: '10px',
                border: '1px solid #FDE047'
              }}>
                <label style={{ ...cardStyles.label, color: '#A16207' }}>Share Value (KES)</label>
                <input
                  type="number"
                  value={settings.shareValue}
                  onChange={(e) => setSettings({ ...settings, shareValue: e.target.value })}
                  style={{ ...cardStyles.input, borderColor: '#FDE047', background: 'white' }}
                  onFocus={(e) => e.target.style.borderColor = '#228B22'}
                  onBlur={(e) => e.target.style.borderColor = '#FDE047'}
                />
                <p style={{ fontSize: '0.6875rem', color: '#713F12', marginTop: '6px' }}>Value of one share unit</p>
              </div>
              
              <div style={{ 
                padding: '20px', 
                background: '#F0FDF4', 
                borderRadius: '10px',
                border: '1px solid #BBF7D0'
              }}>
                <label style={{ ...cardStyles.label, color: '#15803D' }}>Monthly Contribution (KES)</label>
                <input
                  type="number"
                  value={settings.monthlyContribution}
                  onChange={(e) => setSettings({ ...settings, monthlyContribution: e.target.value })}
                  style={{ ...cardStyles.input, borderColor: '#86EFAC', background: 'white' }}
                  onFocus={(e) => e.target.style.borderColor = '#228B22'}
                  onBlur={(e) => e.target.style.borderColor = '#86EFAC'}
                />
                <p style={{ fontSize: '0.6875rem', color: '#14532D', marginTop: '6px' }}>Required monthly contribution per member</p>
              </div>
              
              <div style={{ 
                padding: '20px', 
                background: '#FDF4FF', 
                borderRadius: '10px',
                border: '1px solid #F0ABFC'
              }}>
                <label style={{ ...cardStyles.label, color: '#A21CAF' }}>Weekly Contribution (KES)</label>
                <input
                  type="number"
                  value={settings.weeklyContribution}
                  onChange={(e) => setSettings({ ...settings, weeklyContribution: e.target.value })}
                  style={{ ...cardStyles.input, borderColor: '#F0ABFC', background: 'white' }}
                  onFocus={(e) => e.target.style.borderColor = '#228B22'}
                  onBlur={(e) => e.target.style.borderColor = '#F0ABFC'}
                />
                <p style={{ fontSize: '0.6875rem', color: '#86198F', marginTop: '6px' }}>Optional weekly contribution option</p>
              </div>

              <div style={{ 
                padding: '20px', 
                background: '#FEE2E2', 
                borderRadius: '10px',
                border: '1px solid #FCA5A5'
              }}>
                <label style={{ ...cardStyles.label, color: '#DC2626' }}>Welfare Contribution (KES)</label>
                <input
                  type="number"
                  min="100"
                  value={settings.welfareContribution}
                  onChange={(e) => setSettings({ ...settings, welfareContribution: e.target.value })}
                  style={{ ...cardStyles.input, borderColor: '#FCA5A5', background: 'white' }}
                  onFocus={(e) => e.target.style.borderColor = '#228B22'}
                  onBlur={(e) => e.target.style.borderColor = '#FCA5A5'}
                />
                <p style={{ fontSize: '0.6875rem', color: '#991B1B', marginTop: '6px' }}>Minimum welfare contribution amount (minimum: 100)</p>
              </div>

              <div style={{ 
                padding: '20px', 
                background: '#FEF3C7', 
                borderRadius: '10px',
                border: '1px solid #FDE047'
              }}>
                <label style={{ ...cardStyles.label, color: '#A16207' }}>Bonus Per Attendance (KES)</label>
                <input
                  type="number"
                  value={settings.bonusPerAttendance}
                  onChange={(e) => setSettings({ ...settings, bonusPerAttendance: e.target.value })}
                  style={{ ...cardStyles.input, borderColor: '#FDE047', background: 'white' }}
                  onFocus={(e) => e.target.style.borderColor = '#228B22'}
                  onBlur={(e) => e.target.style.borderColor = '#FDE047'}
                />
                <p style={{ fontSize: '0.6875rem', color: '#713F12', marginTop: '6px' }}>Bonus amount for attending meetings</p>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div style={cardStyles.section}>
            <div style={cardStyles.sectionHeader}>
              <div style={cardStyles.iconBox('#FEF3C7')}>
                <Bell size={20} color="#D97706" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1A1A1A' }}>Notification Preferences</h3>
                <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Configure how you receive notifications</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: '#F9FAFB',
                borderRadius: '10px',
                border: '1px solid #E5E7EB'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    background: '#DCFCE7', 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>📱</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.9375rem', color: '#1A1A1A' }}>SMS Notifications</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Receive alerts via SMS</div>
                  </div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px' }}>
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: settings.smsNotifications ? '#228B22' : '#D1D5DB',
                    borderRadius: '26px',
                    transition: '0.3s',
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '20px',
                      width: '20px',
                      left: settings.smsNotifications ? '24px' : '3px',
                      bottom: '3px',
                      background: 'white',
                      borderRadius: '50%',
                      transition: '0.3s',
                    }} />
                  </span>
                </label>
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: '#F9FAFB',
                borderRadius: '10px',
                border: '1px solid #E5E7EB'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    background: '#DBEAFE', 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>✉️</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.9375rem', color: '#1A1A1A' }}>Email Notifications</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Receive updates via email</div>
                  </div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px' }}>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: settings.emailNotifications ? '#228B22' : '#D1D5DB',
                    borderRadius: '26px',
                    transition: '0.3s',
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '20px',
                      width: '20px',
                      left: settings.emailNotifications ? '24px' : '3px',
                      bottom: '3px',
                      background: 'white',
                      borderRadius: '50%',
                      transition: '0.3s',
                    }} />
                  </span>
                </label>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div style={cardStyles.section}>
            <div style={cardStyles.sectionHeader}>
              <div style={cardStyles.iconBox('#DCFCE7')}>
                <Shield size={20} color="#166534" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1A1A1A' }}>Security Settings</h3>
                <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Account and data security configuration</p>
              </div>
            </div>
            
            <div style={{ 
              padding: '20px', 
              background: '#F0FDF4', 
              borderRadius: '10px',
              border: '1px solid #BBF7D0',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px'
            }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                background: '#22C55E', 
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Shield size={24} color="white" />
              </div>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#14532D', marginBottom: '8px' }}>
                  Your data is secure
                </h4>
                <p style={{ fontSize: '0.875rem', color: '#166534', lineHeight: 1.6 }}>
                  Authentication is secured with JWT tokens. All passwords are hashed using bcrypt with 12 rounds of encryption. Your group's financial data is protected with industry-standard security measures.
                </p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    background: '#DCFCE7', 
                    borderRadius: '4px', 
                    fontSize: '0.6875rem', 
                    color: '#15803D',
                    fontWeight: 500
                  }}>
                    JWT Authentication
                  </span>
                  <span style={{ 
                    padding: '4px 10px', 
                    background: '#DCFCE7', 
                    borderRadius: '4px', 
                    fontSize: '0.6875rem', 
                    color: '#15803D',
                    fontWeight: 500
                  }}>
                    Bcrypt Hashing
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAF8' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '4px' }}>
          Settings
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
          Configure and manage your group settings
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '16px',
        marginBottom: '24px'
      }}>
        <Link href="/dashboard/settings/eligibility" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '20px',
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = '#228B22'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#EBF5EB',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Shield size={24} color="#228B22" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1A1A1A', marginBottom: '2px' }}>
                  Payout Eligibility
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#6B6B6B' }}>
                  Configure eligibility criteria, limits & notifications
                </p>
              </div>
              <ChevronRight size={20} color="#6B6B6B" />
            </div>
          </div>
        </Link>
        
        <PermissionGuard permission="users.view" fallback={null}>
          <div
            onClick={() => dispatch(openModal())}
            style={{
              padding: '20px',
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#228B22'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#E8EAF6',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users size={24} color="#3F51B5" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1A1A1A', marginBottom: '2px' }}>
                  User Management
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#6B6B6B' }}>
                  Add, edit, and manage user accounts and roles
                </p>
              </div>
              <ChevronRight size={20} color="#6B6B6B" />
            </div>
          </div>
        </PermissionGuard>
      </div>

      {apiError && (
        <div style={{
          padding: '14px 20px',
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: '10px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#DC2626'
        }}>
          <AlertCircle size={20} />
          <span style={{ fontSize: '0.9375rem' }}>{apiError}</span>
        </div>
      )}

      {apiSuccess && (
        <div style={{
          padding: '14px 20px',
          background: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: '10px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#16A34A'
        }}>
          <Check size={20} />
          <span style={{ fontSize: '0.9375rem' }}>{apiSuccess}</span>
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '200px 1fr', 
        gap: '24px',
        alignItems: 'start'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          padding: '12px',
          position: 'sticky',
          top: '88px'
        }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '12px 16px',
                  background: activeTab === tab.id ? '#EBF5EB' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: activeTab === tab.id ? '#228B22' : '#4B5563',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  fontSize: '0.875rem',
                  marginBottom: '4px',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div>
          <form onSubmit={handleSave}>
            {renderTabContent()}

            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px',
              padding: '20px 0',
              marginTop: '8px',
              borderTop: '1px solid #E5E7EB'
            }}>
              <button 
                type="button" 
                className="btn btn-secondary"
                style={{ padding: '10px 20px' }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting}
                style={{ 
                  padding: '10px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Save size={18} />
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <UserManagementModal />
    </div>
  );
}