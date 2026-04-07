import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface LeadershipRole {
  title: string;
  holderName?: string;
  phone?: string;
  email?: string;
  startDate?: string;
}

interface GroupSettings {
  _id?: string;
  groupName: string;
  logo?: string;
  description?: string;
  foundedDate?: string;
  location?: {
    street?: string;
    city?: string;
    county?: string;
    country?: string;
  };
  contactPhone?: string;
  contactEmail?: string;
  registrationNumber?: string;
  mission?: string;
  vision?: string;
  leadershipStructure?: {
    chairperson?: LeadershipRole;
    viceChairperson?: LeadershipRole;
    secretary?: LeadershipRole;
    treasurer?: LeadershipRole;
    accountant?: LeadershipRole;
    committeeMembers?: LeadershipRole[];
  };
  defaultInterestRate: number;
  shareValue: number;
  monthlyContribution: number;
  weeklyContribution: number;
  welfareContribution?: number;
  bonusPerAttendance?: number;
  smsNotifications: boolean;
  emailNotifications: boolean;
}

interface GroupState {
  settings: GroupSettings | null;
  loading: boolean;
  error: string | null;
}

const initialState: GroupState = {
  settings: null,
  loading: false,
  error: null,
};

export const fetchGroupSettings = createAsyncThunk(
  'group/fetchSettings',
  async () => {
    const response = await fetch('/api/settings');
    if (!response.ok) throw new Error('Failed to fetch settings');
    const data = await response.json();
    return data.settings as GroupSettings;
  }
);

export const updateGroupSettings = createAsyncThunk(
  'group/updateSettings',
  async (settings: Partial<GroupSettings>) => {
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error('Failed to update settings');
    const data = await response.json();
    return data.settings as GroupSettings;
  }
);

const groupSlice = createSlice({
  name: 'group',
  initialState,
  reducers: {
    setGroupSettings: (state, action: PayloadAction<GroupSettings>) => {
      state.settings = action.payload;
    },
    clearGroupError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGroupSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroupSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchGroupSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch settings';
      })
      .addCase(updateGroupSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateGroupSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(updateGroupSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update settings';
      });
  },
});

export const { setGroupSettings, clearGroupError } = groupSlice.actions;
export default groupSlice.reducer;