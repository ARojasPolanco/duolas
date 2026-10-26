import { Router } from 'express';
import { getPublicKey, subscribe, unsubscribe } from './push.controller.js';
import { protect } from '../auth/auth.middleware.js';
import { pushLimiter } from '../../middlewares/rateLimits.js';

const router = Router();

router.use(protect);

router.get('/public-key', getPublicKey);
router.post('/subscribe', pushLimiter, subscribe);
router.delete('/unsubscribe', unsubscribe);

export default router;
