import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'agent' | 'supervisor' | 'admin' | 'owner';
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sipAccounts: SIPAccount[];
}

interface SIPAccount {
  id: string;
  name: string;
  username: string;
  domain: string;
  password: string;
  isActive: boolean;
  color: string;
  ringtone: string;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  sipAccounts: [],
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess(state, action: PayloadAction<{ user: User; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.sipAccounts = [];
    },
    addSIPAccount(state, action: PayloadAction<SIPAccount>) {
      state.sipAccounts.push(action.payload);
    },
    removeSIPAccount(state, action: PayloadAction<string>) {
      state.sipAccounts = state.sipAccounts.filter(
        (account) => account.id !== action.payload
      );
    },
    updateSIPAccount(state, action: PayloadAction<SIPAccount>) {
      const index = state.sipAccounts.findIndex(
        (account) => account.id === action.payload.id
      );
      if (index !== -1) {
        state.sipAccounts[index] = action.payload;
      }
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  addSIPAccount,
  removeSIPAccount,
  updateSIPAccount,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
