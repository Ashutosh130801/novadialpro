import { Router, Request, Response } from 'express';

const router = Router();

// GET all contacts
router.get('/', (req: Request, res: Response) => {
  res.json({ contacts: [] });
});

// POST create contact
router.post('/', (req: Request, res: Response) => {
  const { name, phone, email, company } = req.body;
  
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone required' });
  }

  // TODO: Save to DB
  res.json({ 
    success: true, 
    contact: { id: `cont-${Date.now()}`, name, phone, email, company }
  });
});

// PUT update contact
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({ success: true, message: `Contact ${id} updated` });
});

// DELETE contact
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({ success: true, message: `Contact ${id} deleted` });
});

export default router;
