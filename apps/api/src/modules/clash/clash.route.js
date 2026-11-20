import { Router } from 'express';
import {
  acceptApplication,
  applyToPost,
  cancelPost,
  createPost,
  getApplications,
  getMine,
  getMyApplications,
  getPost,
  getPosts,
  rejectApplication,
  withdrawApplication,
} from './clash.controller.js';
import { protect, requireCompleteProfile, requireVerifiedEmail } from '../auth/auth.middleware.js';
import { applicationLimiter, postLimiter } from '../../middlewares/rateLimits.js';

const router = Router();

router.use(protect, requireVerifiedEmail, requireCompleteProfile);

router.get('/posts', getPosts);
router.get('/mine', getMine);
router.get('/applications', getMyApplications);
router.post('/posts', postLimiter, createPost);
router.get('/posts/:id', getPost);
router.delete('/posts/:id', cancelPost);
router.post('/posts/:id/apply', applicationLimiter, applyToPost);
router.get('/posts/:id/applications', getApplications);
router.post('/posts/:id/applications/:applicationId/accept', acceptApplication);
router.post('/posts/:id/applications/:applicationId/reject', rejectApplication);
router.delete('/posts/:id/applications/:applicationId', withdrawApplication);

export default router;
