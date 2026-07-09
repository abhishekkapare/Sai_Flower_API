import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

/**
 * POST /api/auth/login
 * Body: { password: string }
 * Returns: { token: string }
 */
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    res.status(500).json({ error: 'Server misconfiguration: admin credentials not set.' });
    return;
  }

  if (
    !email ||
    !password ||
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
   ) {
  res.status(401).json({ error: 'Incorrect email or password.' });
  return;
}

  const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
  const token = jwt.sign({ admin: true }, secret, { expiresIn: '7d' });
  console.info('[auth] Admin login successful');
  res.json({ token });
});

export default router;
