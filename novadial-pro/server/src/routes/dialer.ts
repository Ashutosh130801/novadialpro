import { Router, Request, Response } from 'express';
import { DialerConfig, DialMode, DialerState, DialerAgent } from '../models/dialer.model';
import { predictiveDialer } from '../services/predictive.dialer';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/sessions', (req: Request, res: Response) => {
  try {
    const config: DialerConfig = req.body;
    
    if (!config.campaignId || !config.mode) {
      return res.status(400).json({ error: 'campaignId and mode required' });
    }

    const validModes: DialMode[] = ['preview', 'power', 'progressive', 'predictive'];
    if (!validModes.includes(config.mode)) {
      return res.status(400).json({ error: 'Invalid dial mode' });
    }

    const session = predictiveDialer.createSession({
      ...config,
      linesPerAgent: config.linesPerAgent || 1.5,
      maxDropRate: config.maxDropRate || 0.03,
      minCallDuration: config.minCallDuration || 5,
      amdEnabled: config.amdEnabled ?? true,
      amdTimeout: config.amdTimeout || 5000,
      amdSilenceThreshold: config.amdSilenceThreshold || 100,
      amdMaxWordLength: config.amdMaxWordLength || 5000,
      amdBetweenWordsSilence: config.amdBetweenWordsSilence || 50,
      retryLogic: config.retryLogic || { maxAttempts: 3, intervalMinutes: 30, retryOn: ['no-answer', 'busy', 'failed'] },
      callingHours: config.callingHours || { start: '09:00', end: '21:00', timezone: 'UTC', days: [1,2,3,4,5] },
      callerId: config.callerId || '+15550000000',
      callerIdName: config.callerIdName || 'NovaDial',
    });

    res.status(201).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create session' });
  }
});

router.get('/sessions', (req: Request, res: Response) => {
  const sessions = predictiveDialer.getAllSessions();
  res.json({ sessions });
});

router.get('/sessions/:sessionId', (req: Request, res: Response) => {
  const session = predictiveDialer.getSession(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

router.post('/sessions/:sessionId/start', (req: Request, res: Response) => {
  const success = predictiveDialer.startSession(req.params.sessionId);
  if (!success) return res.status(400).json({ error: 'Cannot start session' });
  res.json({ success: true });
});

router.post('/sessions/:sessionId/pause', (req: Request, res: Response) => {
  const success = predictiveDialer.pauseSession(req.params.sessionId);
  if (!success) return res.status(400).json({ error: 'Cannot pause session' });
  res.json({ success: true });
});

router.post('/sessions/:sessionId/resume', (req: Request, res: Response) => {
  const success = predictiveDialer.resumeSession(req.params.sessionId);
  if (!success) return res.status(400).json({ error: 'Cannot resume session' });
  res.json({ success: true });
});

router.post('/sessions/:sessionId/stop', (req: Request, res: Response) => {
  const success = predictiveDialer.stopSession(req.params.sessionId);
  if (!success) return res.status(400).json({ error: 'Cannot stop session' });
  res.json({ success: true });
});

router.get('/sessions/:sessionId/stats', (req: Request, res: Response) => {
  const stats = predictiveDialer.getStats(req.params.sessionId);
  if (!stats) return res.status(404).json({ error: 'Session not found' });
  res.json(stats);
});

router.post('/sessions/:sessionId/agents', (req: Request, res: Response) => {
  const { userId, extension } = req.body;
  if (!userId || !extension) {
    return res.status(400).json({ error: 'userId and extension required' });
  }

  const agent = predictiveDialer.addAgent(req.params.sessionId, { 
    id: uuidv4(), 
    userId, 
    extension 
  });
  if (!agent) return res.status(404).json({ error: 'Session not found' });

  res.status(201).json({ success: true, agent });
});

router.delete('/sessions/:sessionId/agents/:agentId', (req: Request, res: Response) => {
  const success = predictiveDialer.removeAgent(req.params.sessionId, req.params.agentId);
  if (!success) return res.status(404).json({ error: 'Agent or session not found' });
  res.json({ success: true });
});

router.patch('/sessions/:sessionId/agents/:agentId/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const validStatuses: DialerAgent['status'][] = ['available', 'busy', 'wrapping', 'paused', 'offline'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const success = predictiveDialer.updateAgentStatus(req.params.sessionId, req.params.agentId, status);
  if (!success) return res.status(404).json({ error: 'Agent or session not found' });

  res.json({ success: true });
});

router.post('/sessions/:sessionId/leads', (req: Request, res: Response) => {
  const leads = req.body;
  if (!Array.isArray(leads) || leads.length === 0) {
    return res.status(400).json({ error: 'leads array required' });
  }

  const addedLeads = predictiveDialer.addLeads(req.params.sessionId, leads);
  res.status(201).json({ success: true, leads: addedLeads });
});

router.post('/sessions/:sessionId/call-result', (req: Request, res: Response) => {
  const { callId, status, duration, disposition, agentId } = req.body;
  
  if (!callId || !status || !agentId) {
    return res.status(400).json({ error: 'callId, status, agentId required' });
  }

  predictiveDialer.handleCallResult(req.params.sessionId, callId, {
    status,
    duration,
    disposition,
    agentId,
  });

  res.json({ success: true });
});

export default router;