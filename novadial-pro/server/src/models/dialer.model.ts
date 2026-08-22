export type DialMode = 'preview' | 'power' | 'progressive' | 'predictive';
export type DialerState = 'idle' | 'starting' | 'running' | 'paused' | 'stopping' | 'stopped';
export type AMDResult = 'human' | 'machine' | 'fax' | 'silence' | 'unknown';

export interface DialerConfig {
  campaignId: string;
  mode: DialMode;
  linesPerAgent: number;
  maxDropRate: number;
  minCallDuration: number;
  amdEnabled: boolean;
  amdTimeout: number;
  amdSilenceThreshold: number;
  amdMaxWordLength: number;
  amdBetweenWordsSilence: number;
  retryLogic: {
    maxAttempts: number;
    intervalMinutes: number;
    retryOn: ('no-answer' | 'busy' | 'failed' | 'machine')[];
  };
  callingHours: {
    start: string;
    end: string;
    timezone: string;
    days: number[];
  };
  callerId: string;
  callerIdName: string;
}

export interface DialerSession {
  id: string;
  campaignId: string;
  config: DialerConfig;
  state: DialerState;
  agents: DialerAgent[];
  stats: DialerStats;
  currentLeads: DialerLead[];
  startedAt?: number;
  pausedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface DialerAgent {
  id: string;
  sessionId: string;
  userId: string;
  extension: string;
  status: 'available' | 'busy' | 'wrapping' | 'paused' | 'offline';
  currentCallId?: string;
  callsToday: number;
  talkTimeToday: number;
  idleTime: number;
  lastStateChange: number;
}

export interface DialerLead {
  id: string;
  campaignId: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  priority: number;
  attempts: number;
  lastAttempt?: number;
  nextAttempt?: number;
  status: 'new' | 'calling' | 'callback' | 'dnc' | 'completed' | 'failed';
  timezone: string;
  customFields: Record<string, any>;
}

export interface DialerStats {
  totalCalls: number;
  connectedCalls: number;
  answeredByHuman: number;
  answeredByMachine: number;
  droppedCalls: number;
  dropRate: number;
  avgCallDuration: number;
  avgWaitTime: number;
  agentsLoggedIn: number;
  agentsAvailable: number;
  callsPerHour: number;
  lastUpdated: number;
}

export interface AMDResultData {
  result: AMDResult;
  confidence: number;
  silenceDuration: number;
  voiceDuration: number;
  analysisTime: number;
}