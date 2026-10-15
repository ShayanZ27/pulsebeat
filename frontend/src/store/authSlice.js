import { createSlice, isAnyOf } from '@reduxjs/toolkit';
import { readStorage, STORAGE_KEYS } from '../utils/storage';
import { pulsebeatApi, sessionExpired } from './api';

const { login, register, logout } = pulsebeatApi.endpoints;

/**
 * The JWT lives in a cookie managed by the browser; client-side we only keep
 * the public profile (for rendering and for namespacing per-user storage).
 * Persistence is handled by the listener in store/index.js.
 */
const authSlice = createSlice({
  name: 'auth',
  initialState: () => ({ user: readStorage(STORAGE_KEYS.user) }),
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addMatcher(isAnyOf(login.matchFulfilled, register.matchFulfilled), (state, { payload }) => {
        state.user = payload;
      })
      // A failed logout request still ends the local session.
      .addMatcher(isAnyOf(logout.matchFulfilled, logout.matchRejected, sessionExpired), (state) => {
        state.user = null;
      });
  },
});

export const selectCurrentUser = (state) => state.auth.user;

export default authSlice.reducer;
