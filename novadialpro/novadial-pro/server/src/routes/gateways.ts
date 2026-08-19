import { Router, Request, Response } from 'express';

const router = Router();

// GET gateway status
router.get('/status', (req: Request, res: Response) => {
  // Mock Dinstar gateway status
  res.json({
    gateways: [
      {
        id: 'gw-1',
        model: 'UC2000',
        ip: '192.168.1.100',
        status: 'online',
        ports: [
          { port: 1, status: 'active', signal: -65, carrier: 'Verizon', simBalance: '$10.50' },
          { port: 2, status: 'active', signal: -72, carrier: 'AT&T', simBalance: '$5.20' },
          { port: 3, status: 'idle', signal: -80, carrier: 'T-Mobile', simBalance: '$2.00' }
        ]
      }
    ]
  });
});

// POST send SMS via SIM
router.post('/sms/send', (req: Request, res: Response) => {
  const { portId, destination, message } = req.body;
  
  if (!portId || !destination || !message) {
    return res.status(400).json({ error: 'Port ID, destination, and message required' });
  }

  // TODO: Integrate with Dinstar SMS API
  res.json({ 
    success: true, 
    messageId: `sms-${Date.now()}`,
    message: 'SMS sent successfully' 
  });
});

// POST execute USSD command
router.post('/ussd', (req: Request, res: Response) => {
  const { portId, command } = req.body;
  
  if (!portId || !command) {
    return res.status(400).json({ error: 'Port ID and USSD command required' });
  }

  // TODO: Integrate with Dinstar USSD API
  res.json({ 
    success: true, 
    result: '*100# Balance: $10.50'
  });
});

// POST reboot port
router.post('/port/:id/reboot', (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({ success: true, message: `Port ${id} rebooted` });
});

export default router;
