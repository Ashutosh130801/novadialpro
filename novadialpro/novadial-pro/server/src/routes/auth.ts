import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

// Mock login for MVP - Replace with real DB logic
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  // TODO: Validate against DB
  const token = jwt.sign(
    { userId: '123', role: 'agent', username }, 
    process.env.JWT_SECRET || 'dev-secret', 
    { expiresIn: '24h' }
  );

  res.json({ token, user: { id: '123', username, role: 'agent' } });
});

router.post('/register', (req: Request, res: Response) => {
  // TODO: Implement registration
  res.json({ message: 'Registration endpoint ready' });
});

export default router;
