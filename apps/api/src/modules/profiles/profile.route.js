import { Router } from 'express';
import { getMyProfile, updateMyProfile, getPublicProfile } from './profile.controller.js';
import { protect } from '../auth/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/me', getMyProfile);
router.patch('/me', updateMyProfile);
router.get('/:id', getPublicProfile);

export default router;
