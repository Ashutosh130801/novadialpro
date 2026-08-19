import { Router, Request, Response } from 'express';

const router = Router();

// GET all campaigns
router.get('/', (req: Request, res: Response) => {
  res.json({ campaigns: [] });
});

// POST create campaign
router.post('/', (req: Request, res: Response) => {
  const { name, dialMode, schedule, leadListId } = req.body;
  
  if (!name || !dialMode) {
    return res.status(400).json({ error: 'Name and dial mode required' });
  }

  // TODO: Save to DB
  res.json({ 
    success: true, 
    campaign: { id: `camp-${Date.now()}`, name, dialMode }
  });
});

// POST start campaign
router.post('/:id/start', (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({ success: true, message: `Campaign ${id} started` });
});

// POST stop campaign
router.post('/:id/stop', (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({ success: true, message: `Campaign ${id} stopped` });
});

export default router;
