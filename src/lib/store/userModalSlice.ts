import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserModalState {
  isOpen: boolean;
  mode: 'list' | 'add' | 'edit' | 'delete';
  selectedUser: {
    id: string;
    email: string;
    role: string;
  } | null;
  toast: {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  } | null;
}

const initialState: UserModalState = {
  isOpen: false,
  mode: 'list',
  selectedUser: null,
  toast: null,
};

const userModalSlice = createSlice({
  name: 'userModal',
  initialState,
  reducers: {
    openModal: (state) => {
      state.isOpen = true;
      state.mode = 'list';
      state.selectedUser = null;
    },
    closeModal: (state) => {
      state.isOpen = false;
      state.mode = 'list';
      state.selectedUser = null;
    },
    setMode: (state, action: PayloadAction<'list' | 'add' | 'edit' | 'delete'>) => {
      state.mode = action.payload;
    },
    setSelectedUser: (state, action: PayloadAction<{ id: string; email: string; role: string } | null>) => {
      state.selectedUser = action.payload;
    },
    showToast: (state, action: PayloadAction<{ message: string; severity: 'success' | 'error' | 'info' | 'warning' }>) => {
      state.toast = { open: true, ...action.payload };
    },
    hideToast: (state) => {
      state.toast = null;
    },
  },
});

export const { openModal, closeModal, setMode, setSelectedUser, showToast, hideToast } = userModalSlice.actions;
export default userModalSlice.reducer;