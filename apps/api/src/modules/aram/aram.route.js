import { Router } from 'express';
import {
  acceptApplication,
  applyToPost,
  cancelPost,
  createPost,
  getMine,
  getPosts,
  rejectApplication,
  withdrawApplication,
} from './aram.controller.js';
import { protect, requireCompleteProfile, requireVerifiedEmail } from '../auth/auth.middleware.js';
import { applicationLimiter, postLimiter } from '../../middlewares/rateLimits.js';

const router = Router();

router.use(protect, requireVerifiedEmail, requireCompleteProfile);

router.get('/', getPosts);
router.post('/', postLimiter, createPost);
router.get('/mine', getMine);
router.delete('/:id', cancelPost);
router.post('/:id/applications', applicationLimiter, applyToPost);
router.post('/:postId/applications/:applicationId/accept', acceptApplication);
router.post('/:postId/applications/:applicationId/reject', rejectApplication);
router.delete('/:postId/applications/:applicationId', withdrawApplication);

export default router;
