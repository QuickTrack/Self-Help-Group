'use client';

import { useState, useEffect } from 'react';
import { 
  Settings,
  Bell,
  DollarSign,
  Clock,
  Users,
  Shield,
  Save,
  History,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

interface EligibilitySetting {
  key: string;
  value: number | boolean;
  description: string;
  category: string;
  updatedAt?: string;
}

interface SettingChange {
  key: string;
  oldValue: any;
  newValue: any;
  timestamp: string;
}

const categoryLabels: Record<string, { title: string; description: string; icon: any }> = {
  eligibility: { 
    title: 'Eligibility Criteria', 
    description: 'Configure requirements for payout eligibility',
    icon: Shield
  },
  notification: { 
    title: 'Notifications', 
    description: 'Manage payout status update notifications',
    icon: Bell
  },
  limits: { 
    title: 'Payout Limits', 
    description: 'Set maximum payout amounts per event type',
    icon: DollarSign
  },
};

export default function EligibilitySettingsPage() {
  const [settings, setSettings] = useState<EligibilitySetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('eligibility');
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [recentChanges, setRecentChanges] = useState<SettingChange[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, number | boolean>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/welfare/eligibility-settings');
      const data = await response.json();
      
      if (response.ok) {
        setSettings(data.settings || []);
        
        const changes: SettingChange[] = (data.settings || [])
          .filter((s: EligibilitySetting) => s.updatedAt)
          .map((s: EligibilitySetting) => ({
            key: s.key,
            oldValue: null,
            newValue: s.value,
            timestamp: s.updatedAt,
          }))
          .sort((a: SettingChange, b: SettingChange) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
          .slice(0, 10);
        
        setRecentChanges(changes);
      }
    } catch (error) {
      console.error('Error fetching eligibility settings:', error);
      setApiError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (key: string, value: number | boolean) => {
    setPendingChanges(prev => ({ ...prev, [key]: value }));
    
    setSettings(prev => prev.map(s => 
      s.key === key ? { ...s, value } : s
    ));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setApiError(null);
      setApiSuccess(null);

      const updates = Object.entries(pendingChanges).map(([key, value]) => ({
        key,
        value,
      }));

      const response = await fetch('/api/welfare/eligibility-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updates }),
      });

      const data = await response.json();

      if (response.ok) {
        setApiSuccess(data.message || 'Settings saved successfully');
        setPendingChanges({});
        
        const changes: SettingChange[] = (data.updates || []).map((u: any) => ({
          key: u.key,
          oldValue: u.oldValue,
          newValue: u.newValue,
          timestamp: new Date().toISOString(),
        }));
        
        setRecentChanges(prev => [...changes, ...prev].slice(0, 10));
        
        setTimeout(() => setApiSuccess(null), 3000);
      } else {
        setApiError(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving eligibility settings:', error);
      setApiError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const getDisplayValue = (setting: EligibilitySetting) => {
    const pending = pendingChanges[setting.key];
    return pending !== undefined ? pending : setting.value;
  };

  const hasChanges = Object.keys(pendingChanges).length > 0;

  const settingsByCategory = settings.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {} as Record<string, EligibilitySetting[]>);

  const renderInput = (setting: EligibilitySetting) => {
    const value = getDisplayValue(setting);
    
    if (typeof value === 'boolean') {
      return (
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => handleValueChange(setting.key, e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          <span className="ms-3 text-sm font-medium text-gray-900">
            {value ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      );
    }
    
    return (
      <div className="flex items-center gap-2">
        {setting.key.includes('Amount') || setting.key.includes('limit') || setting.key.includes('limit') ? (
          <span className="text-gray-500">KES</span>
        ) : null}
        <input
          type="number"
          value={value as number}
          onChange={(e) => handleValueChange(setting.key, parseFloat(e.target.value) || 0)}
          className="border rounded px-3 py-2 w-32 text-right"
          min={0}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            Payout Eligibility Settings
          </h1>
          <p className="text-gray-600">Configure eligibility criteria and notification preferences</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="btn btn-outline flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            {showHistory ? 'Hide History' : 'View History'}
          </button>
          
          <button
            onClick={saveSettings}
            disabled={!hasChanges || saving}
            className="btn btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {apiSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          {apiSuccess}
        </div>
      )}

      {apiError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {apiError}
        </div>
      )}

      {hasChanges && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-yellow-700">
          <AlertCircle className="w-5 h-5" />
          You have unsaved changes. Click "Save Changes" to apply them.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow">
            <div className="flex border-b overflow-x-auto">
              {Object.entries(categoryLabels).map(([key, { title, icon: Icon }]) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`px-4 py-3 flex items-center gap-2 whitespace-nowrap ${
                    activeCategory === key 
                      ? 'border-b-2 border-blue-500 font-medium text-blue-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {title}
                </button>
              ))}
            </div>

            <div className="p-6">
              {settingsByCategory[activeCategory]?.map((setting) => (
                <div key={setting.key} className="mb-6 pb-6 border-b last:border-b-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        {setting.key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </label>
                      <p className="text-sm text-gray-500">{setting.description}</p>
                    </div>
                    <div className="ml-4">
                      {renderInput(setting)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          {showHistory && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-medium flex items-center gap-2 mb-4">
                <History className="w-4 h-4" />
                Recent Changes
              </h3>
              {recentChanges.length === 0 ? (
                <p className="text-sm text-gray-500">No recent changes</p>
              ) : (
                <div className="space-y-3">
                  {recentChanges.map((change, idx) => (
                    <div key={idx} className="text-sm border-b pb-2 last:border-b-0">
                      <div className="font-medium text-gray-900">
                        {change.key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </div>
                      <div className="text-gray-500">
                        {change.oldValue !== null ? (
                          <>
                            <span className="line-through">{String(change.oldValue)}</span> → <span className="font-medium">{String(change.newValue)}</span>
                          </>
                        ) : (
                          <span className="font-medium">{String(change.newValue)}</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(change.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!showHistory && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-medium flex items-center gap-2 mb-4">
                <Info className="w-4 h-4" />
                Quick Info
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5 text-blue-500" />
                  <span>Eligibility criteria determine which members qualify for welfare payouts</span>
                </div>
                <div className="flex items-start gap-2">
                  <Bell className="w-4 h-4 mt-0.5 text-blue-500" />
                  <span>Notifications can be sent to members and admins for status updates</span>
                </div>
                <div className="flex items-start gap-2">
                  <DollarSign className="w-4 h-4 mt-0.5 text-blue-500" />
                  <span>Payout limits are per event type and per calendar year</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
