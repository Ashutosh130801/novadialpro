import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type PortStatus = 'online' | 'offline' | 'busy' | 'error';
export type SIMStatus = 'active' | 'blocked' | 'low-balance' | 'expiring';

export interface SIMPort {
  id: string;
  portNumber: number;
  gatewayId: string;
  status: PortStatus;
  simStatus: SIMStatus;
  carrier?: string;
  phoneNumber?: string;
  signalStrength: number; // RSSI 0-31
  balance?: number;
  callsToday: number;
  callsTotal: number;
  smsToday: number;
  lastActivity?: number;
  temperature?: number;
}

export interface Gateway {
  id: string;
  name: string;
  model: 'DWG2000' | 'DAG2000' | 'UC2000' | 'UC8000';
  ipAddress: string;
  firmwareVersion: string;
  status: 'online' | 'offline' | 'warning';
  ports: SIMPort[];
  totalPorts: number;
  activePorts: number;
  uptime: number; // seconds
  lastSeen: number;
}

export interface SIMRotationPolicy {
  id: string;
  name: string;
  type: 'round-robin' | 'least-used' | 'prefix-match';
  simPortGroup: string[];
  perSimCapPerHour?: number;
  prefixRules?: Array<{
    prefix: string;
    portIds: string[];
  }>;
  restTimerMinutes: number;
  warmupSchedule?: {
    enabled: boolean;
    maxCallsDay1: number;
    maxCallsDay2: number;
    maxCallsDay3: number;
  };
}

export interface SMSMessage {
  id: string;
  portId: string;
  recipient: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: number;
  deliveredAt?: number;
  direction: 'outbound' | 'inbound';
}

interface GatewayState {
  gateways: Gateway[];
  selectedGateway: Gateway | null;
  rotationPolicies: SIMRotationPolicy[];
  smsMessages: SMSMessage[];
  alerts: Array<{
    id: string;
    type: 'signal' | 'balance' | 'blocked' | 'port-down';
    severity: 'info' | 'warning' | 'critical';
    message: string;
    portId?: string;
    gatewayId?: string;
    createdAt: number;
    acknowledged: boolean;
  }>;
  isLoading: boolean;
  error: string | null;
}

const initialState: GatewayState = {
  gateways: [],
  selectedGateway: null,
  rotationPolicies: [],
  smsMessages: [],
  alerts: [],
  isLoading: false,
  error: null,
};

const gatewaySlice = createSlice({
  name: 'gateway',
  initialState,
  reducers: {
    setGateways(state, action: PayloadAction<Gateway[]>) {
      state.gateways = action.payload;
    },
    updateGateway(state, action: PayloadAction<Gateway>) {
      const index = state.gateways.findIndex(
        (g) => g.id === action.payload.id
      );
      if (index !== -1) {
        state.gateways[index] = action.payload;
      }
    },
    setSelectedGateway(state, action: PayloadAction<Gateway | null>) {
      state.selectedGateway = action.payload;
    },
    updatePortStatus(state, action: PayloadAction<{
      gatewayId: string;
      portNumber: number;
      status: Partial<SIMPort>;
    }>) {
      const gateway = state.gateways.find(
        (g) => g.id === action.payload.gatewayId
      );
      if (gateway) {
        const port = gateway.ports.find(
          (p) => p.portNumber === action.payload.portNumber
        );
        if (port) {
          Object.assign(port, action.payload.status);
        }
      }
    },
    setRotationPolicies(state, action: PayloadAction<SIMRotationPolicy[]>) {
      state.rotationPolicies = action.payload;
    },
    addRotationPolicy(state, action: PayloadAction<SIMRotationPolicy>) {
      state.rotationPolicies.push(action.payload);
    },
    updateRotationPolicy(state, action: PayloadAction<SIMRotationPolicy>) {
      const index = state.rotationPolicies.findIndex(
        (p) => p.id === action.payload.id
      );
      if (index !== -1) {
        state.rotationPolicies[index] = action.payload;
      }
    },
    deleteRotationPolicy(state, action: PayloadAction<string>) {
      state.rotationPolicies = state.rotationPolicies.filter(
        (p) => p.id !== action.payload
      );
    },
    setSMSMessages(state, action: PayloadAction<SMSMessage[]>) {
      state.smsMessages = action.payload;
    },
    addSMSMessage(state, action: PayloadAction<SMSMessage>) {
      state.smsMessages.unshift(action.payload);
    },
    setAlerts(state, action: PayloadAction<typeof initialState.alerts>) {
      state.alerts = action.payload;
    },
    addAlert(state, action: PayloadAction<typeof initialState.alerts[0]>) {
      state.alerts.unshift(action.payload);
    },
    acknowledgeAlert(state, action: PayloadAction<string>) {
      const alert = state.alerts.find((a) => a.id === action.payload);
      if (alert) {
        alert.acknowledged = true;
      }
    },
    rebootPort(state, action: PayloadAction<{
      gatewayId: string;
      portNumber: number;
    }>) {
      // Handled by backend
    },
    sendUSSD(state, action: PayloadAction<{
      gatewayId: string;
      portNumber: number;
      code: string;
    }>) {
      // Handled by backend
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
  setGateways,
  updateGateway,
  setSelectedGateway,
  updatePortStatus,
  setRotationPolicies,
  addRotationPolicy,
  updateRotationPolicy,
  deleteRotationPolicy,
  setSMSMessages,
  addSMSMessage,
  setAlerts,
  addAlert,
  acknowledgeAlert,
  rebootPort,
  sendUSSD,
  setLoading,
  setError,
} = gatewaySlice.actions;

export default gatewaySlice.reducer;
