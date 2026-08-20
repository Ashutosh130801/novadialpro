export type DialMode = 'preview' | 'power' | 'progressive' | 'predictive';

export interface Campaign {
  id: string;
  name: string;
  dialMode: DialMode;
  status: 'draft' | 'active' | 'paused' | 'completed';
  priority: number;
  retryLogic: {
    maxAttempts: number;
    intervalMinutes: number;
  };
  callingHours: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
    timezone: string;
    days: number[]; // 0-6, where 0 is Sunday
  };
  rotationPolicy: 'round-robin' | 'least-used' | 'prefix-match';
}

export interface Lead {
  id: string;
  campaignId?: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  status: 'new' | 'contacted' | 'dnc' | 'converted' | 'invalid';
  disposition?: string;
  notes?: string;
  lastCallDate?: number;
  callCount?: number;
}
