import { Router } from 'express';
import { getReports, resolveReport, warnUser, suspendUser } from './admin.controller.js';
import { protect, restrictTo } from '../auth/auth.middleware.js';

const router = Router();

router.use(protect, restrictTo('admin'));

router.get('/reports', getReports);
router.post('/reports/:id/resolve', resolveReport);
router.post('/users/:id/warn', warnUser);
router.post('/users/:id/suspend', suspendUser);

export default router;
