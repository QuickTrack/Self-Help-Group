import { configureStore } from '@reduxjs/toolkit';
import userModalReducer from './userModalSlice';
import groupReducer from './groupSlice';

export const store = configureStore({
  reducer: {
    userModal: userModalReducer,
    group: groupReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;