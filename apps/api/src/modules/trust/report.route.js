import { Router } from 'express';
import { createReport } from './report.controller.js';
import { protect, requireVerifiedEmail } from '../auth/auth.middleware.js';

const router = Router();

router.use(protect, requireVerifiedEmail);

router.post('/', createReport);

export default router;
