import { Router, Request, Response } from 'express';

const router = Router();
const contacts: any[] = [];

// Get contacts
router.get('/', (req: Request, res: Response) => {
  res.json(contacts);
});

// Create contact
router.post('/', (req: Request, res: Response) => {
  const contact = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  contacts.push(contact);
  res.status(201).json(contact);
});

// Update contact
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = contacts.findIndex((c) => c.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  
  contacts[index] = { ...contacts[index], ...req.body, updatedAt: Date.now() };
  res.json(contacts[index]);
});

// Delete contact
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = contacts.findIndex((c) => c.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  
  contacts.splice(index, 1);
  res.json({ success: true });
});

// Import contacts (CSV/vCard)
router.post('/import', async (req: Request, res: Response) => {
  // Parse CSV or vCard
  res.json({ success: true });
});

export default router;
