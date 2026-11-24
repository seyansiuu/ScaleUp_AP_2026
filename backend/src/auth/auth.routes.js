import { Router } from 'express';
import { createAuthService } from './auth.service.js';
import { createAuthController } from './auth.controller.js';
import { createAuthMiddleware } from '../middleware/auth.js';

export function createAuthRouter({ prisma, env }) {
  const router = Router();
  const authService = createAuthService({ prisma, env });
  const ctrl = createAuthController({ authService });
  const requireAuth = createAuthMiddleware({ jwtSecret: env.JWT_SECRET });

  router.post('/register', ctrl.register);
  router.post('/login', ctrl.login);
  router.get('/me', requireAuth, ctrl.me);
  router.post('/logout', requireAuth, ctrl.logout);

  return router;
}
