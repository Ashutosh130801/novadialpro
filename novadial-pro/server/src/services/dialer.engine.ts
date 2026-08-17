import winston from 'winston';
import type { Campaign, Lead, DialMode } from '../models/campaign.model';
import { dinstarService } from './dinstar.service';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

export interface AgentState {
  id: string;
  status: 'available' | 'in-call' | 'wrap-up' | 'paused' | 'offline';
  currentCall?: string;
  campaignId?: string;
  lastCallTime?: number;
  callsToday: number;
}

export interface CallResult {
  leadId: string;
  status: 'connected' | 'no-answer' | 'busy' | 'voicemail' | 'failed';
  duration?: number;
  disposition?: string;
  notes?: string;
}

interface PredictiveConfig {
  dialRatio: number; // agents * ratio = concurrent dials
  abandonRateTarget: number;
  maxDropRate: number;
  adjustmentInterval: number; // ms
}

class DialerEngine {
  private agents: Map<string, AgentState> = new Map();
  private campaigns: Map<string, Campaign> = new Map();
  private leads: Map<string, Lead> = new Map();
  private predictiveConfig: PredictiveConfig = {
    dialRatio: 1.5,
    abandonRateTarget: 0.03,
    maxDropRate: 0.05,
    adjustmentInterval: 30000,
  };
  private currentDialRatio: number = 1.5;
  private abandonRate: number = 0;
  private totalCalls: number = 0;
  private abandonedCalls: number = 0;

  // Agent Management
  registerAgent(agentId: string): void {
    this.agents.set(agentId, {
      id: agentId,
      status: 'available',
      callsToday: 0,
    });
    logger.info(`Agent ${agentId} registered`);
  }

  updateAgentStatus(agentId: string, status: AgentState['status'], campaignId?: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      if (campaignId) agent.campaignId = campaignId;
      if (status === 'in-call') {
        agent.lastCallTime = Date.now();
        agent.callsToday++;
      }
      this.agents.set(agentId, agent);
    }
  }

  getAvailableAgents(campaignId?: string): AgentState[] {
    return Array.from(this.agents.values()).filter(
      (a) => a.status === 'available' && (!campaignId || a.campaignId === campaignId)
    );
  }

  // Lead Management
  addLead(lead: Lead): void {
    this.leads.set(lead.id, lead);
  }

  getNextLead(campaign: Campaign): Lead | null {
    const campaignLeads = Array.from(this.leads.values()).filter(
      (l) => !l.campaignId || l.campaignId === campaign.id
    );

    // Filter by calling hours
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const { start, end, days } = campaign.callingHours;
    
    const [startHour] = start.split(':').map(Number);
    const [endHour] = end.split(':').map(Number);
    
    if (!days.includes(day) || hour < startHour || hour >= endHour) {
      return null; // Outside calling hours
    }

    // Get eligible leads (not called recently, not DNC)
    const eligible = campaignLeads.filter((l) => {
      if (l.status === 'dnc' || l.status === 'converted') return false;
      if (!l.lastCallDate) return true;
      
      const hoursSinceLastCall = (Date.now() - l.lastCallDate) / 3600000;
      return hoursSinceLastCall >= campaign.retryLogic.intervalMinutes / 60;
    });

    return eligible[0] || null;
  }

  // Dialing Logic
  async makeCall(agentId: string, lead: Lead, campaign: Campaign): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent || agent.status !== 'available') {
      return false;
    }

    // Select SIM port based on rotation policy
    const ports = await dinstarService.getPortStatus('gw-001');
    const availablePorts = ports.filter(p => p.status === 'online');
    
    let selectedPort: typeof ports[0] | undefined;
    switch (campaign.rotationPolicy) {
      case 'round-robin':
        selectedPort = availablePorts[Math.floor(Math.random() * availablePorts.length)];
        break;
      case 'least-used':
        selectedPort = availablePorts.sort((a, b) => a.callsToday - b.callsToday)[0];
        break;
      case 'prefix-match':
        // Match area code logic here
        selectedPort = availablePorts[0];
        break;
      default:
        selectedPort = availablePorts[0];
    }

    if (!selectedPort) {
      logger.warn('No available SIM ports for dialing');
      return false;
    }

    // Update agent status
    this.updateAgentStatus(agentId, 'in-call', campaign.id);
    this.totalCalls++;

    // Originate call via Dinstar
    try {
      const success = await dinstarService.originateCall(
        agentId,
        lead.phone,
        'gw-001',
        selectedPort.portNumber
      );

      if (success) {
        logger.info(`Call initiated: Agent ${agentId} -> ${lead.phone} via Port ${selectedPort.portNumber}`);
        return true;
      } else {
        this.handleCallResult(lead.id, 'failed');
        this.updateAgentStatus(agentId, 'available');
        return false;
      }
    } catch (error) {
      logger.error('Call initiation failed', { error });
      this.handleCallResult(lead.id, 'failed');
      this.updateAgentStatus(agentId, 'available');
      return false;
    }
  }

  handleCallResult(leadId: string, status: CallResult['status'], duration?: number, disposition?: string): void {
    const lead = this.leads.get(leadId);
    if (lead) {
      lead.lastCallDate = Date.now();
      if (status === 'connected') {
        lead.status = 'contacted';
      }
      if (disposition) {
        lead.disposition = disposition;
      }
      this.leads.set(leadId, lead);
    }

    if (status === 'no-answer' || status === 'failed') {
      this.abandonedCalls++;
      this.abandonRate = this.abandonedCalls / this.totalCalls;
      
      // Adjust dial ratio if abandon rate exceeds target
      if (this.abandonRate > this.predictiveConfig.abandonRateTarget) {
        this.currentDialRatio = Math.max(1.0, this.currentDialRatio - 0.1);
        logger.info(`Reduced dial ratio to ${this.currentDialRatio} due to abandon rate ${this.abandonRate}`);
      }
    }
  }

  // Dial Mode Implementations
  async executePreviewDial(agentId: string, campaign: Campaign): Promise<void> {
    const lead = this.getNextLead(campaign);
    if (lead) {
      // Show lead info to agent, wait for manual dial
      logger.info(`Preview lead ready for agent ${agentId}: ${lead.phone}`);
    }
  }

  async executePowerDial(agentId: string, campaign: Campaign): Promise<void> {
    const lead = this.getNextLead(campaign);
    if (lead) {
      await this.makeCall(agentId, lead, campaign);
    }
  }

  async executeProgressiveDial(agentId: string, campaign: Campaign): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent?.status === 'available') {
      const lead = this.getNextLead(campaign);
      if (lead) {
        await this.makeCall(agentId, lead, campaign);
      }
    }
  }

  async executePredictiveDial(campaign: Campaign): Promise<void> {
    const availableAgents = this.getAvailableAgents(campaign.id);
    if (availableAgents.length === 0) return;

    // Calculate number of concurrent dials
    const numDials = Math.floor(availableAgents.length * this.currentDialRatio);
    
    for (let i = 0; i < numDials; i++) {
      const agent = availableAgents[i];
      if (agent) {
        const lead = this.getNextLead(campaign);
        if (lead) {
          await this.makeCall(agent.id, lead, campaign);
        }
      }
    }

    // Schedule next dial cycle
    setTimeout(() => this.executePredictiveDial(campaign), this.predictiveConfig.adjustmentInterval);
  }

  // Answering Machine Detection
  detectAnsweringMachine(audioStream: any): Promise<boolean> {
    // In production: use ML model or AMD service
    return Promise.resolve(false);
  }

  // Campaign Management
  addCampaign(campaign: Campaign): void {
    this.campaigns.set(campaign.id, campaign);
    logger.info(`Campaign ${campaign.name} added with dial mode: ${campaign.dialMode}`);
  }

  startCampaign(campaignId: string): void {
    const campaign = this.campaigns.get(campaignId);
    if (campaign) {
      campaign.status = 'active';
      this.campaigns.set(campaignId, campaign);
      
      // Start dialing loop based on mode
      if (campaign.dialMode === 'predictive') {
        this.executePredictiveDial(campaign);
      }
      
      logger.info(`Campaign ${campaign.name} started`);
    }
  }

  pauseCampaign(campaignId: string): void {
    const campaign = this.campaigns.get(campaignId);
    if (campaign) {
      campaign.status = 'paused';
      this.campaigns.set(campaignId, campaign);
      logger.info(`Campaign ${campaign.name} paused`);
    }
  }

  // Statistics
  getStats(): {
    totalAgents: number;
    availableAgents: number;
    activeCalls: number;
    totalCallsToday: number;
    abandonRate: number;
    currentDialRatio: number;
  } {
    const agents = Array.from(this.agents.values());
    return {
      totalAgents: agents.length,
      availableAgents: agents.filter(a => a.status === 'available').length,
      activeCalls: agents.filter(a => a.status === 'in-call').length,
      totalCallsToday: agents.reduce((sum, a) => sum + a.callsToday, 0),
      abandonRate: this.abandonRate,
      currentDialRatio: this.currentDialRatio,
    };
  }
}

export const dialerEngine = new DialerEngine();
export default dialerEngine;
