import { Router } from 'express';
import { createBlock, removeBlock, listBlocks } from './block.controller.js';
import { protect, requireVerifiedEmail } from '../auth/auth.middleware.js';

const router = Router();

router.use(protect, requireVerifiedEmail);

router.get('/', listBlocks);
router.post('/', createBlock);
router.delete('/:userId', removeBlock);

export default router;
