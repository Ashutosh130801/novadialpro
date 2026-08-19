import { Router, Request, Response } from 'express';

const router = Router();

// GET all calls
router.get('/', (req: Request, res: Response) => {
  res.json({ calls: [] });
});

// POST originate call via Dinstar
router.post('/originate', (req: Request, res: Response) => {
  const { destination, callerId, gatewayId } = req.body;
  
  if (!destination) {
    return res.status(400).json({ error: 'Destination required' });
  }

  // TODO: Integrate with Dinstar AMI/SIP
  res.json({ 
    success: true, 
    callId: `call-${Date.now()}`,
    message: 'Call initiated' 
  });
});

// POST end call
router.post('/end', (req: Request, res: Response) => {
  const { callId } = req.body;
  res.json({ success: true, message: 'Call ended' });
});

// POST transfer call
router.post('/transfer', (req: Request, res: Response) => {
  const { callId, target } = req.body;
  res.json({ success: true, message: `Transferred to ${target}` });
});

export default router;
