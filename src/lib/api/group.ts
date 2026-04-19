/**
 * Group API Client
 * 
 * Provides methods to interact with the Group management API.
 * All methods automatically handle cache invalidation.
 * 
 * @example
 * import { groupApi } from '@/lib/api/group';
 * 
 * // Get all groups
 * const groups = await groupApi.getAll();
 * 
 * // Get single group
 * const group = await groupApi.getById(groupId);
 * 
 * // Create group
 * const newGroup = await groupApi.create({ name: 'New Group', description: '...' });
 * 
 * // Update group
 * const updated = await groupApi.update(groupId, { name: 'Updated Name' });
 * 
 * // Delete group
 * await groupApi.delete(groupId);
 */

const API_BASE = '/api/groups';

interface GroupAddress {
  street?: string;
  city?: string;
  county?: string;
  country?: string;
}

interface GroupSettings {
  monthlyContribution?: number;
  weeklyContribution?: number;
  shareValue?: number;
  defaultInterestRate?: number;
  maxLoanPeriod?: number;
  minGuarantors?: number;
  welfareContribution?: number;
  bonusPerAttendance?: number;
  meetingBudget?: number;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  location?: string;
  contactEmail?: string;
  contactPhone?: string;
  registrationNumber?: string;
  foundedDate?: string;
  defaultCurrency?: string;
  logo?: string;
  address?: GroupAddress;
  settings?: GroupSettings;
  created_at?: string;
  updated_at?: string;
}

export const groupApi = {
  async getAll(): Promise<Group[]> {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Failed to fetch groups');
    const data = await res.json();
    return data.groups;
  },

  async getById(id: string): Promise<Group> {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) throw new Error('Failed to fetch group');
    const data = await res.json();
    return data.group;
  },

  async create(group: Partial<Group>): Promise<Group> {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(group),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create group');
    }
    const data = await res.json();
    return data.group;
  },

  async update(id: string, updates: Partial<Group>): Promise<Group> {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update group');
    }
    const data = await res.json();
    return data.group;
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete group');
    }
  },
};

export default groupApi;