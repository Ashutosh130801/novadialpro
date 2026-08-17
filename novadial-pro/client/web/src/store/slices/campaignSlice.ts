import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';
export type DialMode = 'preview' | 'power' | 'progressive' | 'predictive';

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  company?: string;
  tags: string[];
  customFields: Record<string, any>;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'dnc';
  disposition?: string;
  notes?: string;
  lastCallDate?: number;
  nextCallback?: number;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  dialMode: DialMode;
  status: CampaignStatus;
  startDate?: number;
  endDate?: number;
  timezone: string;
  callingHours: {
    start: string; // HH:mm
    end: string;   // HH:mm
    days: number[]; // 0-6 (Sunday-Saturday)
  };
  leadLists: string[];
  assignedAgents: string[];
  simPortGroup?: string[];
  rotationPolicy?: 'round-robin' | 'least-used' | 'prefix-match';
  retryLogic: {
    busyAttempts: number;
    noAnswerAttempts: number;
    intervalMinutes: number;
  };
  amdEnabled: boolean;
  abandonRateTarget: number;
  localPresenceEnabled: boolean;
  recordingEnabled: boolean;
  dispositionCodes: string[];
  script?: string;
  stats: {
    totalLeads: number;
    contacted: number;
    connected: number;
    abandoned: number;
    converted: number;
    avgTalkTime: number;
    connectRate: number;
  };
  createdAt: number;
  updatedAt: number;
}

interface CampaignState {
  campaigns: Campaign[];
  activeCampaign: Campaign | null;
  currentLead: Lead | null;
  leads: Lead[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CampaignState = {
  campaigns: [],
  activeCampaign: null,
  currentLead: null,
  leads: [],
  isLoading: false,
  error: null,
};

const campaignSlice = createSlice({
  name: 'campaign',
  initialState,
  reducers: {
    setCampaigns(state, action: PayloadAction<Campaign[]>) {
      state.campaigns = action.payload;
    },
    addCampaign(state, action: PayloadAction<Campaign>) {
      state.campaigns.push(action.payload);
    },
    updateCampaign(state, action: PayloadAction<Campaign>) {
      const index = state.campaigns.findIndex(
        (c) => c.id === action.payload.id
      );
      if (index !== -1) {
        state.campaigns[index] = action.payload;
      }
    },
    deleteCampaign(state, action: PayloadAction<string>) {
      state.campaigns = state.campaigns.filter(
        (c) => c.id !== action.payload
      );
    },
    setActiveCampaign(state, action: PayloadAction<Campaign | null>) {
      state.activeCampaign = action.payload;
    },
    setCurrentLead(state, action: PayloadAction<Lead | null>) {
      state.currentLead = action.payload;
    },
    setLeads(state, action: PayloadAction<Lead[]>) {
      state.leads = action.payload;
    },
    updateLeadStatus(state, action: PayloadAction<{
      id: string;
      status: Lead['status'];
      disposition?: string;
      notes?: string;
      nextCallback?: number;
    }>) {
      const lead = state.leads.find((l) => l.id === action.payload.id);
      if (lead) {
        lead.status = action.payload.status;
        if (action.payload.disposition) {
          lead.disposition = action.payload.disposition;
        }
        if (action.payload.notes) {
          lead.notes = action.payload.notes;
        }
        if (action.payload.nextCallback) {
          lead.nextCallback = action.payload.nextCallback;
        }
      }
    },
    importLeads(state, action: PayloadAction<Lead[]>) {
      state.leads = [...state.leads, ...action.payload];
      // Update campaign stats
      if (state.activeCampaign) {
        state.activeCampaign.stats.totalLeads = state.leads.length;
      }
    },
    startCampaign(state, action: PayloadAction<string>) {
      const campaign = state.campaigns.find((c) => c.id === action.payload);
      if (campaign) {
        campaign.status = 'active';
      }
    },
    pauseCampaign(state, action: PayloadAction<string>) {
      const campaign = state.campaigns.find((c) => c.id === action.payload);
      if (campaign) {
        campaign.status = 'paused';
      }
    },
    stopCampaign(state, action: PayloadAction<string>) {
      const campaign = state.campaigns.find((c) => c.id === action.payload);
      if (campaign) {
        campaign.status = 'completed';
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
  setCampaigns,
  addCampaign,
  updateCampaign,
  deleteCampaign,
  setActiveCampaign,
  setCurrentLead,
  setLeads,
  updateLeadStatus,
  importLeads,
  startCampaign,
  pauseCampaign,
  stopCampaign,
  setLoading,
  setError,
} = campaignSlice.actions;

export default campaignSlice.reducer;
