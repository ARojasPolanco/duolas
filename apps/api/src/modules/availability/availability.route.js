import { Router } from 'express';
import {
  createAvailability,
  closeAvailability,
  getMyAvailability,
  listAvailability,
  invitePlayer,
} from './availability.controller.js';
import { protect, requireVerifiedEmail, requireCompleteProfile } from '../auth/auth.middleware.js';

const router = Router();

router.use(protect, requireVerifiedEmail, requireCompleteProfile);

router.get('/', listAvailability);
router.get('/me', getMyAvailability);
router.post('/', createAvailability);
router.delete('/', closeAvailability);
router.post('/:id/invite', invitePlayer);

export default router;
