import { Router } from 'express';
import {
  getOverview,
  getReports,
  getUserDetail,
  getUsers,
  resolveReport,
  warnUser,
  suspendUser,
} from './admin.controller.js';
import { getMetricsSummary } from '../metrics/metrics.controller.js';
import {
  approveUsernameRequest,
  createUsernameRequest,
  rejectUsernameRequest,
} from '../usernameChanges/usernameChange.controller.js';
import { protect, restrictTo } from '../auth/auth.middleware.js';

const router = Router();

router.use(protect, restrictTo('admin'));

router.get('/overview', getOverview);
router.get('/users', getUsers);
router.get('/users/:id', getUserDetail);
router.post('/users/:id/warn', warnUser);
router.post('/users/:id/suspend', suspendUser);
router.post('/users/:id/username-request', createUsernameRequest);
router.post('/username-changes/:id/approve', approveUsernameRequest);
router.post('/username-changes/:id/reject', rejectUsernameRequest);
router.get('/reports', getReports);
router.post('/reports/:id/resolve', resolveReport);
router.get('/metrics/summary', getMetricsSummary);

export default router;
