import { Router } from 'express';
import { createReport } from './report.controller.js';
import { protect, requireVerifiedEmail } from '../auth/auth.middleware.js';
import { reportLimiter } from '../../middlewares/rateLimits.js';

const router = Router();

router.use(protect, requireVerifiedEmail);

router.post('/', reportLimiter, createReport);

export default router;
