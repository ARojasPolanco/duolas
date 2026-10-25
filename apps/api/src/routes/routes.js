import { Router } from 'express';
import authRouter from '../modules/auth/auth.route.js';
import profilesRouter from '../modules/profiles/profile.route.js';
import matchingRouter from '../modules/matching/matching.route.js';
import blocksRouter from '../modules/trust/block.route.js';
import notificationsRouter from '../modules/notifications/notification.route.js';

const router = Router();

router.get('/', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Duo LAS API v1',
  });
});

router.use('/auth', authRouter);
router.use('/profiles', profilesRouter);
router.use('/matching', matchingRouter);
router.use('/blocks', blocksRouter);
router.use('/notifications', notificationsRouter);

export default router;
