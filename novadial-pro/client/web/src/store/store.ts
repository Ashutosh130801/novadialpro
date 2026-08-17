import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import callReducer from './slices/callSlice';
import campaignReducer from './slices/campaignSlice';
import contactReducer from './slices/contactSlice';
import agentReducer from './slices/agentSlice';
import gatewayReducer from './slices/gatewaySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    call: callReducer,
    campaign: campaignReducer,
    contact: contactReducer,
    agent: agentReducer,
    gateway: gatewayReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['call/connected', 'call/disconnected'],
        ignoredPaths: ['call.sipUser', 'call.session'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
