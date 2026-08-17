import { Router, Request, Response } from 'express';

const router = Router();

// Mock calls data
const calls: any[] = [];

// Get call history
router.get('/history', (req: Request, res: Response) => {
  res.json(calls);
});

// Initiate outbound call via Dinstar AMI/SIP
router.post('/outbound', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, agentId, campaignId } = req.body;
    
    // In production: Use Dinstar AMI to originate call
    // Action: Originate
    // Channel: SIP/agent-extension
    // Exten: phoneNumber
    // Context: from-internal
    // Priority: 1
    
    const call = {
      id: Date.now().toString(),
      phoneNumber,
      agentId,
      campaignId,
      status: 'initiated',
      direction: 'outbound',
      startTime: Date.now(),
    };
    
    calls.push(call);
    
    res.json({ success: true, call });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initiate call' });
  }
});

// End call
router.post('/:callId/end', (req: Request, res: Response) => {
  const { callId } = req.params;
  const call = calls.find((c) => c.id === callId);
  
  if (!call) {
    return res.status(404).json({ error: 'Call not found' });
  }
  
  call.status = 'completed';
  call.endTime = Date.now();
  call.duration = Math.floor((call.endTime - call.startTime) / 1000);
  
  res.json({ success: true, call });
});

// Call recording
router.get('/:callId/recording', (req: Request, res: Response) => {
  const { callId } = req.params;
  // Return recording URL
  res.json({ url: `/recordings/${callId}.wav` });
});

export default router;
