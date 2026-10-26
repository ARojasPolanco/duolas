import { Router } from 'express';
import { getStreamStats, issueTicket, stream } from './events.controller.js';
import { protect, restrictTo } from '../auth/auth.middleware.js';
import { ticketLimiter } from '../../middlewares/rateLimits.js';

const router = Router();

router.post('/ticket', protect, ticketLimiter, issueTicket);
router.get('/stream', stream);
router.get('/stats', protect, restrictTo('admin'), getStreamStats);

export default router;
