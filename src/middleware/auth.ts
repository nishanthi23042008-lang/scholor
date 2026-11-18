import { Request, Response, NextFunction } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { eq } from 'drizzle-orm';
import { adminAuth } from '../lib/firebase-admin.ts';
import { db } from '../db/index.ts';
import { profiles } from '../db/schema.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  profile?: typeof profiles.$inferSelect;
}

const ADMIN_ALLOWLIST_EMAILS = new Set<string>([
  'nishanthi2319@gmail.com',
  ...(process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean) : []),
]);

export async function syncUserProfile(decoded: DecodedIdToken) {
  const email = (decoded.email || '').toLowerCase();
  const isBootstrapAdmin = email ? ADMIN_ALLOWLIST_EMAILS.has(email) : false;

  const existing = await db
    .select()
    .from(profiles)
    .where(eq(profiles.uid, decoded.uid))
    .limit(1);

  if (existing.length > 0) {
    const current = existing[0];
    const updates: Partial<typeof profiles.$inferInsert> = {};
    if (isBootstrapAdmin && current.role !== 'admin') updates.role = 'admin';
    if (!current.institution) updates.institution = 'Rajeev Institute of Technology';
    if (!current.course) updates.course = 'Computer Science';
    if (!current.gdgUrl) updates.gdgUrl = 'https://gdg.community.dev';

    if (Object.keys(updates).length > 0) {
      const updated = await db
        .update(profiles)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(profiles.uid, decoded.uid))
        .returning();
      return updated[0];
    }
    return current;
  }

  const inserted = await db
    .insert(profiles)
    .values({
      uid: decoded.uid,
      email: email || `${decoded.uid}@user.local`,
      role: isBootstrapAdmin ? 'admin' : 'student',
      fullName: decoded.name || '',
      institution: 'Rajeev Institute of Technology',
      course: 'Computer Science',
      gdgUrl: 'https://gdg.community.dev',
      consentAccepted: false,
    })
    .onConflictDoUpdate({
      target: profiles.uid,
      set: {
        email: email || `${decoded.uid}@user.local`,
        updatedAt: new Date(),
      },
    })
    .returning();

  return inserted[0];
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    req.profile = await syncUserProfile(decodedToken);
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Invalid or expired session token. Please sign in again.' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice('Bearer '.length).trim();
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    req.profile = await syncUserProfile(decodedToken);
  } catch {
    // Ignore invalid optional token for public routes
  }
  next();
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  await requireAuth(req, res, () => {
    if (!req.profile || req.profile.role !== 'admin') {
      return res.status(403).json({
        error: 'Administrator privileges required to access this resource.',
      });
    }
    next();
  });
};
