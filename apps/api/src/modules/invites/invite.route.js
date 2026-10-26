import { Router } from 'express';
import { getInvites, acceptInvite, declineInvite, cancelInvite } from './invite.controller.js';
import { protect, requireVerifiedEmail, requireCompleteProfile } from '../auth/auth.middleware.js';

const router = Router();

router.use(protect, requireVerifiedEmail, requireCompleteProfile);

router.get('/', getInvites);
router.post('/:id/accept', acceptInvite);
router.post('/:id/decline', declineInvite);
router.post('/:id/cancel', cancelInvite);

export default router;
