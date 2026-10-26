import { Router } from 'express';
import {
  createFeedback,
  getPendingFeedback,
  getConnectionFeedback,
} from './feedback.controller.js';
import { protect, requireVerifiedEmail } from '../auth/auth.middleware.js';

const router = Router();

router.use(protect, requireVerifiedEmail);

router.get('/pending', getPendingFeedback);
router.get('/connection/:connectionId', getConnectionFeedback);
router.post('/', createFeedback);

export default router;
