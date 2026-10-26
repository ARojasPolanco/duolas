import { Router } from 'express';
import {
  createPost,
  getPosts,
  getMyPosts,
  getPost,
  applyToPost,
  getApplications,
  acceptApplication,
  rejectApplication,
  withdrawApplication,
  cancelPost,
} from './duoPost.controller.js';
import { protect, requireVerifiedEmail, requireCompleteProfile } from '../auth/auth.middleware.js';

const router = Router();

router.use(protect, requireVerifiedEmail, requireCompleteProfile);

router.get('/', getPosts);
router.get('/mine', getMyPosts);
router.post('/', createPost);
router.get('/:id', getPost);
router.delete('/:id', cancelPost);
router.post('/:id/apply', applyToPost);
router.get('/:id/applications', getApplications);
router.post('/:id/applications/:applicationId/accept', acceptApplication);
router.post('/:id/applications/:applicationId/reject', rejectApplication);
router.delete('/:id/applications/:applicationId', withdrawApplication);

export default router;
