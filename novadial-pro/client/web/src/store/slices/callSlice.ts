import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type CallStatus = 'idle' | 'connecting' | 'active' | 'held' | 'muted' | 'ended';
export type CallDirection = 'inbound' | 'outbound';
export type DialMode = 'manual' | 'preview' | 'power' | 'progressive' | 'predictive';

interface CallParticipant {
  id: string;
  name: string;
  number: string;
  avatar?: string;
}

interface CallQuality {
  mos: number;
  jitter: number;
  packetLoss: number;
  latency: number;
}

interface CallState {
  status: CallStatus;
  direction: CallDirection | null;
  currentCall: {
    id: string;
    participant: CallParticipant | null;
    startTime: number | null;
    duration: number;
    isRecording: boolean;
    quality: CallQuality;
  } | null;
  dialMode: DialMode;
  isMuted: boolean;
  isOnHold: boolean;
  activeConference: string | null;
  transferredCalls: string[];
  sipUser: any | null;
  session: any | null;
  error: string | null;
}

const initialState: CallState = {
  status: 'idle',
  direction: null,
  currentCall: null,
  dialMode: 'manual',
  isMuted: false,
  isOnHold: false,
  activeConference: null,
  transferredCalls: [],
  sipUser: null,
  session: null,
  error: null,
};

const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    setDialMode(state, action: PayloadAction<DialMode>) {
      state.dialMode = action.payload;
    },
    callStart(state, action: PayloadAction<{
      id: string;
      participant: CallParticipant;
      direction: CallDirection;
    }>) {
      state.status = 'connecting';
      state.direction = action.payload.direction;
      state.currentCall = {
        id: action.payload.id,
        participant: action.payload.participant,
        startTime: Date.now(),
        duration: 0,
        isRecording: false,
        quality: { mos: 0, jitter: 0, packetLoss: 0, latency: 0 },
      };
      state.error = null;
    },
    callConnected(state) {
      state.status = 'active';
      if (state.currentCall) {
        state.currentCall.startTime = Date.now();
      }
    },
    callEnded(state) {
      state.status = 'ended';
      state.currentCall = null;
      state.isMuted = false;
      state.isOnHold = false;
    },
    callHold(state) {
      state.isOnHold = !state.isOnHold;
      state.status = state.isOnHold ? 'held' : 'active';
    },
    callMute(state) {
      state.isMuted = !state.isMuted;
      state.status = state.isMuted ? 'muted' : 'active';
    },
    toggleRecording(state) {
      if (state.currentCall) {
        state.currentCall.isRecording = !state.currentCall.isRecording;
      }
    },
    updateCallQuality(state, action: PayloadAction<CallQuality>) {
      if (state.currentCall) {
        state.currentCall.quality = action.payload;
      }
    },
    updateCallDuration(state, action: PayloadAction<number>) {
      if (state.currentCall) {
        state.currentCall.duration = action.payload;
      }
    },
    startTransfer(state, action: PayloadAction<string>) {
      // transfer to number
    },
    completeTransfer(state, action: PayloadAction<string>) {
      state.transferredCalls.push(action.payload);
    },
    startConference(state, action: PayloadAction<string>) {
      state.activeConference = action.payload;
    },
    endConference(state) {
      state.activeConference = null;
    },
    setSIPUser(state, action: PayloadAction<any>) {
      state.sipUser = action.payload;
    },
    setSession(state, action: PayloadAction<any>) {
      state.session = action.payload;
    },
    callError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.status = 'idle';
    },
    clearError(state) {
      state.error = null;
    },
    resetCallState(state) {
      return initialState;
    },
  },
});

export const {
  setDialMode,
  callStart,
  callConnected,
  callEnded,
  callHold,
  callMute,
  toggleRecording,
  updateCallQuality,
  updateCallDuration,
  startTransfer,
  completeTransfer,
  startConference,
  endConference,
  setSIPUser,
  setSession,
  callError,
  clearError,
  resetCallState,
} = callSlice.actions;

export default callSlice.reducer;
