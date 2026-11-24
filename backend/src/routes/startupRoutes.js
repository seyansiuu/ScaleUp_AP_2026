import { Router } from 'express';
import { advance, create, get, list } from '../controllers/startupController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createStartupSchema, decisionsSchema } from '../validators/startupValidators.js';

const router = Router();
router.use(authMiddleware);
router.get('/', list);
router.post('/', validate(createStartupSchema), create);
router.get('/:id', get);
router.post('/:id/turns', validate(decisionsSchema), advance);
export default router;
