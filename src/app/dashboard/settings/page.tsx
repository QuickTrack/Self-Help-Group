'use client';

import { useState } from 'react';
import { 
  Settings as SettingsIcon,
  Save,
  Building2,
  Percent,
  Wallet,
  Bell,
  Shield
} from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    groupName: 'Githirioni Self Help Group',
    defaultInterestRate: '10',
    shareValue: '1000',
    monthlyContribution: '1000',
    weeklyContribution: '250',
    smsNotifications: true,
    emailNotifications: true,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '4px' }}>
          Settings
        </h1>
        <p style={{ color: '#6B6B6B', fontSize: '0.875rem' }}>
          Configure system settings
        </p>
      </div>

      <div style={{ maxWidth: '640px' }}>
        <form onSubmit={handleSave}>
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: '#EBF5EB',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Building2 size={20} color="#228B22" />
              </div>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Group Information</h2>
                <p style={{ fontSize: '0.75rem', color: '#6B6B6B' }}>Basic group details</p>
              </div>
            </div>
            <div className="form-group">
              <label className="input-label">Group Name</label>
              <input
                type="text"
                value={settings.groupName}
                onChange={(e) => setSettings({ ...settings, groupName: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: '#DBEAFE',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Percent size={20} color="#1E40AF" />
              </div>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Financial Settings</h2>
                <p style={{ fontSize: '0.75rem', color: '#6B6B6B' }}>Configure financial parameters</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div className="form-group">
                <label className="input-label">Default Interest Rate (%)</label>
                <input
                  type="number"
                  value={settings.defaultInterestRate}
                  onChange={(e) => setSettings({ ...settings, defaultInterestRate: e.target.value })}
                  className="input"
                />
              </div>
              <div className="form-group">
                <label className="input-label">Share Value (KES)</label>
                <input
                  type="number"
                  value={settings.shareValue}
                  onChange={(e) => setSettings({ ...settings, shareValue: e.target.value })}
                  className="input"
                />
              </div>
              <div className="form-group">
                <label className="input-label">Monthly Contribution (KES)</label>
                <input
                  type="number"
                  value={settings.monthlyContribution}
                  onChange={(e) => setSettings({ ...settings, monthlyContribution: e.target.value })}
                  className="input"
                />
              </div>
              <div className="form-group">
                <label className="input-label">Weekly Contribution (KES)</label>
                <input
                  type="number"
                  value={settings.weeklyContribution}
                  onChange={(e) => setSettings({ ...settings, weeklyContribution: e.target.value })}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: '#FEF3C7',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bell size={20} color="#92400E" />
              </div>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Notifications</h2>
                <p style={{ fontSize: '0.75rem', color: '#6B6B6B' }}>Configure notification preferences</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.smsNotifications}
                  onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '0.875rem' }}>SMS Notifications (via API simulation)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '0.875rem' }}>Email Notifications</span>
              </label>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: '#DCFCE7',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Shield size={20} color="#166534" />
              </div>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Security</h2>
                <p style={{ fontSize: '0.75rem', color: '#6B6B6B' }}>Account security settings</p>
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#6B6B6B' }}>
              Authentication is secured with JWT tokens. Passwords are hashed using bcrypt with 12 rounds.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}