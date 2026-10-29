import { Router } from 'express';
import {
  getCandidates,
  getMatchReminder,
  likeUser,
  unlikeUser,
  getOutgoingLikes,
  getMatches,
  getMatchDetail,
  archiveMatch,
} from './matching.controller.js';
import { protect, requireVerifiedEmail, requireCompleteProfile } from '../auth/auth.middleware.js';
import { likeLimiter } from '../../middlewares/rateLimits.js';

const router = Router();

router.use(protect, requireVerifiedEmail, requireCompleteProfile);

router.get('/candidates', getCandidates);
router.get('/reminder', getMatchReminder);
router.post('/likes', likeLimiter, likeUser);
router.delete('/likes/:targetUserId', unlikeUser);
router.get('/likes', getOutgoingLikes);
router.get('/matches', getMatches);
router.get('/matches/:id', getMatchDetail);
router.post('/matches/:id/archive', archiveMatch);

export default router;
