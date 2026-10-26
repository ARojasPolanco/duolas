import { Router } from 'express';
import { getPublicKey, subscribe, unsubscribe } from './push.controller.js';
import { protect } from '../auth/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/public-key', getPublicKey);
router.post('/subscribe', subscribe);
router.delete('/unsubscribe', unsubscribe);

export default router;
