import { Router, Request, Response } from 'express';

const router = Router();

// Mock campaigns
const campaigns: any[] = [];

// Get all campaigns
router.get('/', (req: Request, res: Response) => {
  res.json(campaigns);
});

// Create campaign
router.post('/', async (req: Request, res: Response) => {
  try {
    const campaign = {
      id: Date.now().toString(),
      ...req.body,
      stats: {
        totalLeads: 0,
        contacted: 0,
        connected: 0,
        abandoned: 0,
        converted: 0,
        avgTalkTime: 0,
        connectRate: 0,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    campaigns.push(campaign);
    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Update campaign
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = campaigns.findIndex((c) => c.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Campaign not found' });
  }
  
  campaigns[index] = { ...campaigns[index], ...req.body, updatedAt: Date.now() };
  res.json(campaigns[index]);
});

// Delete campaign
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = campaigns.findIndex((c) => c.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Campaign not found' });
  }
  
  campaigns.splice(index, 1);
  res.json({ success: true });
});

// Import leads
router.post('/:id/leads/import', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { leads } = req.body;
  
  // Process CSV/Excel leads
  res.json({ success: true, imported: leads.length });
});

export default router;
