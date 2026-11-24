import jwt from 'jsonwebtoken';
import { z } from 'zod';

const uuid = z.string().uuid();
const BEARER = /^Bearer +([A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)$/i;

/**
 * Express middleware factory — verifies the `Authorization: Bearer <jwt>`
 * header and attaches `req.userId` (and `req.token`).
 */
export function createAuthMiddleware({ jwtSecret }) {
  if (!jwtSecret) throw new Error('createAuthMiddleware: jwtSecret is required');

  return function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header) {
      return res.status(401).json({ message: 'Authentication required', code: 'NO_TOKEN' });
    }

    const match = BEARER.exec(header.trim());
    if (!match) {
      return res.status(401).json({ message: 'Malformed Authorization header', code: 'BAD_AUTH_HEADER' });
    }

    try {
      const payload = jwt.verify(match[1], jwtSecret, { algorithms: ['HS256'] });
      const parsed = uuid.safeParse(payload.userId ?? payload.sub);
      if (!parsed.success) {
        return res.status(401).json({ message: 'Invalid token', code: 'INVALID_TOKEN' });
      }
      req.userId = parsed.data;
      req.token = match[1];
      return next();
    } catch (err) {
      if (err?.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Session expired, please sign in again', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ message: 'Invalid token', code: 'INVALID_TOKEN' });
    }
  };
}
