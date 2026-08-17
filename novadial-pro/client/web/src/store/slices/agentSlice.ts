import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AgentStatus = 'offline' | 'available' | 'in-call' | 'wrap-up' | 'paused';

export interface Agent {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: AgentStatus;
  extension: string;
  teamId?: string;
  currentCallId?: string;
  callsToday: number;
  talkTimeToday: number; // seconds
  lastActivity?: number;
  wrapUpTimer?: number;
}

export interface WallboardMetrics {
  activeCalls: number;
  callsPerHour: number;
  connectRate: number;
  avgTalkTime: number;
  abandonRate: number;
  agentsOnline: number;
  agentsInCall: number;
  agentsAvailable: number;
  agentsPaused: number;
  totalCallsToday: number;
  convertedToday: number;
}

interface AgentState {
  agents: Agent[];
  currentAgent: Agent | null;
  status: AgentStatus;
  metrics: WallboardMetrics;
  isLoading: boolean;
  error: string | null;
}

const initialState: AgentState = {
  agents: [],
  currentAgent: null,
  status: 'offline',
  metrics: {
    activeCalls: 0,
    callsPerHour: 0,
    connectRate: 0,
    avgTalkTime: 0,
    abandonRate: 0,
    agentsOnline: 0,
    agentsInCall: 0,
    agentsAvailable: 0,
    agentsPaused: 0,
    totalCallsToday: 0,
    convertedToday: 0,
  },
  isLoading: false,
  error: null,
};

const agentSlice = createSlice({
  name: 'agent',
  initialState,
  reducers: {
    setAgents(state, action: PayloadAction<Agent[]>) {
      state.agents = action.payload;
    },
    updateAgent(state, action: PayloadAction<Agent>) {
      const index = state.agents.findIndex(
        (a) => a.id === action.payload.id
      );
      if (index !== -1) {
        state.agents[index] = action.payload;
      }
    },
    setCurrentAgent(state, action: PayloadAction<Agent | null>) {
      state.currentAgent = action.payload;
    },
    setStatus(state, action: PayloadAction<AgentStatus>) {
      state.status = action.payload;
      if (state.currentAgent) {
        state.currentAgent.status = action.payload;
      }
    },
    setMetrics(state, action: PayloadAction<WallboardMetrics>) {
      state.metrics = action.payload;
    },
    updateMetric(state, action: PayloadAction<{
      key: keyof WallboardMetrics;
      value: number;
    }>) {
      state.metrics[action.payload.key] = action.payload.value as any;
    },
    incrementCallsToday(state) {
      if (state.currentAgent) {
        state.currentAgent.callsToday += 1;
      }
      state.metrics.totalCallsToday += 1;
    },
    updateTalkTime(state, action: PayloadAction<number>) {
      if (state.currentAgent) {
        state.currentAgent.talkTimeToday += action.payload;
      }
    },
    setWrapUpTimer(state, action: PayloadAction<number>) {
      if (state.currentAgent) {
        state.currentAgent.wrapUpTimer = action.payload;
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  setAgents,
  updateAgent,
  setCurrentAgent,
  setStatus,
  setMetrics,
  updateMetric,
  incrementCallsToday,
  updateTalkTime,
  setWrapUpTimer,
  setLoading,
  setError,
} = agentSlice.actions;

export default agentSlice.reducer;
