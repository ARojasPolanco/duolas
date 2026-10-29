import { Router } from 'express';
import { getMyUsernameChange, suggestUsername } from './usernameChange.controller.js';
import { protect } from '../auth/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/mine', getMyUsernameChange);
router.post('/:id/suggest', suggestUsername);

export default router;
