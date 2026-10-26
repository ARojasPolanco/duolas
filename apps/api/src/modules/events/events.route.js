import { Router } from 'express';
import { getStreamStats, issueTicket, stream } from './events.controller.js';
import { protect, restrictTo } from '../auth/auth.middleware.js';

const router = Router();

router.post('/ticket', protect, issueTicket);
router.get('/stream', stream);
router.get('/stats', protect, restrictTo('admin'), getStreamStats);

export default router;
