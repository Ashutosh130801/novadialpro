import { EventEmitter } from 'events';
import { DialerConfig, DialerSession, DialerAgent, DialerLead, DialerState, DialerStats, DialMode, AMDResult, AMDResultData } from '../models/dialer.model';
import { v4 as uuidv4 } from 'uuid';

interface PacingCalculation {
  linesPerAgent: number;
  callsToPlace: number;
  estimatedDropRate: number;
}

export class PredictiveDialer extends EventEmitter {
  private sessions: Map<string, DialerSession> = new Map();
  private pacingTimers: Map<string, NodeJS.Timeout> = new Map();
  private amdWorkers: Map<string, Promise<AMDResultData>> = new Map();

  createSession(config: DialerConfig): DialerSession {
    const session: DialerSession = {
      id: uuidv4(),
      campaignId: config.campaignId,
      config,
      state: 'idle',
      agents: [],
      stats: this.initStats(),
      currentLeads: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.sessions.set(session.id, session);
    this.emit('sessionCreated', session);
    return session;
  }

  getSession(sessionId: string): DialerSession | undefined {
    return this.sessions.get(sessionId);
  }

  addAgent(sessionId: string, agent: Omit<DialerAgent, 'sessionId' | 'status' | 'callsToday' | 'talkTimeToday' | 'idleTime' | 'lastStateChange'>): DialerAgent | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const newAgent: DialerAgent = {
      ...agent,
      sessionId,
      status: 'available',
      callsToday: 0,
      talkTimeToday: 0,
      idleTime: 0,
      lastStateChange: Date.now(),
    };

    session.agents.push(newAgent);
    session.updatedAt = Date.now();
    this.emit('agentAdded', sessionId, newAgent);
    return newAgent;
  }

  removeAgent(sessionId: string, agentId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const idx = session.agents.findIndex(a => a.id === agentId);
    if (idx === -1) return false;

    session.agents.splice(idx, 1);
    session.updatedAt = Date.now();
    this.emit('agentRemoved', sessionId, agentId);
    return true;
  }

  updateAgentStatus(sessionId: string, agentId: string, status: DialerAgent['status']): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const agent = session.agents.find(a => a.id === agentId);
    if (!agent) return false;

    agent.status = status;
    agent.lastStateChange = Date.now();
    session.updatedAt = Date.now();
    this.emit('agentStatusChanged', sessionId, agent);
    return true;
  }

  addLeads(sessionId: string, leads: Omit<DialerLead, 'id' | 'attempts' | 'status' | 'campaignId'>[]): DialerLead[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const newLeads: DialerLead[] = leads.map(lead => ({
      ...lead,
      id: uuidv4(),
      campaignId: session.campaignId,
      attempts: 0,
      status: 'new',
      timezone: lead.timezone || 'UTC',
      customFields: lead.customFields || {},
    }));

    session.currentLeads.push(...newLeads);
    session.updatedAt = Date.now();
    this.emit('leadsAdded', sessionId, newLeads);
    return newLeads;
  }

  startSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.state !== 'idle') return false;

    session.state = 'starting';
    session.startedAt = Date.now();
    session.updatedAt = Date.now();

    setTimeout(() => {
      session.state = 'running';
      session.updatedAt = Date.now();
      this.emit('sessionStarted', sessionId);
      this.startPacing(sessionId);
    }, 1000);

    return true;
  }

  pauseSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.state !== 'running') return false;

    session.state = 'paused';
    session.pausedAt = Date.now();
    session.updatedAt = Date.now();
    this.stopPacing(sessionId);
    this.emit('sessionPaused', sessionId);
    return true;
  }

  resumeSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.state !== 'paused') return false;

    session.state = 'running';
    session.pausedAt = undefined;
    session.updatedAt = Date.now();
    this.startPacing(sessionId);
    this.emit('sessionResumed', sessionId);
    return true;
  }

  stopSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.state === 'stopped') return false;

    session.state = 'stopping';
    this.stopPacing(sessionId);
    
    setTimeout(() => {
      session.state = 'stopped';
      session.updatedAt = Date.now();
      this.emit('sessionStopped', sessionId);
    }, 2000);

    return true;
  }

  private startPacing(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session || session.state !== 'running') return;

    const pacing = this.calculatePacing(session);
    const interval = Math.max(1000, 60000 / Math.max(1, pacing.callsToPlace));

    const timer = setInterval(() => {
      if (session.state !== 'running') {
        this.stopPacing(sessionId);
        return;
      }
      this.placeCalls(sessionId, pacing.callsToPlace);
    }, interval);

    this.pacingTimers.set(sessionId, timer);
  }

  private stopPacing(sessionId: string): void {
    const timer = this.pacingTimers.get(sessionId);
    if (timer) {
      clearInterval(timer);
      this.pacingTimers.delete(sessionId);
    }
  }

  private calculatePacing(session: DialerSession): PacingCalculation {
    const availableAgents = session.agents.filter(a => a.status === 'available').length;
    const busyAgents = session.agents.filter(a => a.status === 'busy').length;
    
    if (session.config.mode === 'preview') {
      return { linesPerAgent: 1, callsToPlace: availableAgents, estimatedDropRate: 0 };
    }

    const { linesPerAgent, maxDropRate } = session.config;
    const targetLines = availableAgents * linesPerAgent;
    
    const recentCalls = session.stats.totalCalls || 1;
    const recentDrops = session.stats.droppedCalls || 0;
    const currentDropRate = recentCalls > 0 ? recentDrops / recentCalls : 0;

    let callsToPlace = targetLines;
    
    if (session.config.mode === 'predictive') {
      const safetyFactor = 1 - (currentDropRate / maxDropRate);
      callsToPlace = Math.floor(targetLines * Math.max(0.5, safetyFactor));
    } else if (session.config.mode === 'progressive') {
      callsToPlace = availableAgents;
    } else if (session.config.mode === 'power') {
      callsToPlace = targetLines;
    }

    return {
      linesPerAgent,
      callsToPlace: Math.max(0, callsToPlace),
      estimatedDropRate: currentDropRate,
    };
  }

  private async placeCalls(sessionId: string, maxCalls: number): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || maxCalls <= 0) return;

    const availableLeads = session.currentLeads
      .filter(l => l.status === 'new' || (l.status === 'callback' && l.nextAttempt && l.nextAttempt <= Date.now()))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, maxCalls);

    for (const lead of availableLeads) {
      const availableAgent = session.agents.find(a => a.status === 'available');
      if (!availableAgent) break;

      lead.status = 'calling';
      lead.attempts++;
      lead.lastAttempt = Date.now();
      
      availableAgent.status = 'busy';
      availableAgent.lastStateChange = Date.now();

      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      availableAgent.currentCallId = callId;

      this.emit('callPlaced', {
        sessionId,
        callId,
        lead,
        agent: availableAgent,
        config: session.config,
      });

      if (session.config.amdEnabled) {
        this.runAMD(callId, session.config);
      }
    }

    session.updatedAt = Date.now();
  }

  private async runAMD(callId: string, config: DialerConfig): Promise<void> {
    const amdPromise = this.simulateAMD(config);
    this.amdWorkers.set(callId, amdPromise);

    try {
      const result = await amdPromise;
      this.amdWorkers.delete(callId);
      this.emit('amdComplete', { callId, result });
    } catch (error) {
      this.amdWorkers.delete(callId);
      this.emit('amdError', { callId, error });
    }
  }

  private simulateAMD(config: DialerConfig): Promise<AMDResultData> {
    return new Promise((resolve) => {
      const analysisTime = Math.random() * (config.amdTimeout - 1000) + 1000;
      
      setTimeout(() => {
        const rand = Math.random();
        let result: AMDResult;
        let confidence: number;

        if (rand < 0.6) {
          result = 'human';
          confidence = 0.85 + Math.random() * 0.1;
        } else if (rand < 0.8) {
          result = 'machine';
          confidence = 0.8 + Math.random() * 0.15;
        } else if (rand < 0.9) {
          result = 'silence';
          confidence = 0.7 + Math.random() * 0.2;
        } else {
          result = 'fax';
          confidence = 0.9;
        }

        resolve({
          result,
          confidence,
          silenceDuration: Math.random() * 5000,
          voiceDuration: Math.random() * 30000,
          analysisTime,
        });
      }, analysisTime);
    });
  }

  handleCallResult(sessionId: string, callId: string, result: {
    status: 'completed' | 'failed' | 'busy' | 'no-answer';
    duration: number;
    disposition?: string;
    agentId: string;
    amdResult?: 'human' | 'machine' | 'fax' | 'silence' | 'unknown';
    isDropped?: boolean;
  }): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const agent = session.agents.find(a => a.id === result.agentId);
    if (agent) {
      agent.status = 'wrapping';
      agent.currentCallId = undefined;
      agent.callsToday++;
      agent.talkTimeToday += result.duration;
      agent.lastStateChange = Date.now();

      setTimeout(() => {
        agent.status = 'available';
        agent.lastStateChange = Date.now();
        this.emit('agentAvailable', sessionId, agent);
      }, 15000);
    }

    const lead = session.currentLeads.find(l => l.id === callId);
    if (lead) {
      if (result.status === 'completed') {
        lead.status = 'completed';
      } else if (result.status === 'no-answer' || result.status === 'busy') {
        if (lead.attempts >= session.config.retryLogic.maxAttempts) {
          lead.status = 'failed';
        } else {
          lead.status = 'callback';
          const retryInterval = session.config.retryLogic.intervalMinutes * 60 * 1000;
          lead.nextAttempt = Date.now() + retryInterval;
        }
      } else {
        lead.status = 'failed';
      }
    }

    this.updateStats(session, result);
    session.updatedAt = Date.now();
    this.emit('callResult', sessionId, callId, result);
  }

  private updateStats(session: DialerSession, result: any): void {
    session.stats.totalCalls++;
    session.stats.lastUpdated = Date.now();

    if (result.status === 'completed') {
      session.stats.connectedCalls++;
      session.stats.avgCallDuration = 
        (session.stats.avgCallDuration * (session.stats.connectedCalls - 1) + result.duration) / session.stats.connectedCalls;
    }

    if (result.amdResult === 'human') session.stats.answeredByHuman++;
    if (result.amdResult === 'machine') session.stats.answeredByMachine++;
    if (result.isDropped) session.stats.droppedCalls++;

    session.stats.dropRate = session.stats.totalCalls > 0 
      ? session.stats.droppedCalls / session.stats.totalCalls 
      : 0;

    const availableAgents = session.agents.filter(a => a.status === 'available').length;
    session.stats.agentsAvailable = availableAgents;
    session.stats.agentsLoggedIn = session.agents.length;
  }

  private initStats(): DialerStats {
    return {
      totalCalls: 0,
      connectedCalls: 0,
      answeredByHuman: 0,
      answeredByMachine: 0,
      droppedCalls: 0,
      dropRate: 0,
      avgCallDuration: 0,
      avgWaitTime: 0,
      agentsLoggedIn: 0,
      agentsAvailable: 0,
      callsPerHour: 0,
      lastUpdated: Date.now(),
    };
  }

  getStats(sessionId: string): DialerStats | null {
    return this.sessions.get(sessionId)?.stats || null;
  }

  getAllSessions(): DialerSession[] {
    return Array.from(this.sessions.values());
  }
}

export const predictiveDialer = new PredictiveDialer();