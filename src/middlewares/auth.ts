import { Request, Response, NextFunction } from 'express';
import { auth } from "../lib/firebase-admin.js";
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized - no token' });
    return;
  }

  const token = header.slice(7);

  try {
    const decoded = await auth.verifyIdToken(token);
    if (decoded.email !== process.env.ADMIN_EMAIL) {
      res.status(403).json({ error: 'Forbidden - not admin' });
      return;
    }

    next();
  }  catch (err: any) {
  console.error("Firebase Verify Error:", err);
  res.status(401).json({
    error: err.message,
  });
}
}