import { Router } from 'express';
import authRouter from '../modules/auth/auth.route.js';
import profilesRouter from '../modules/profiles/profile.route.js';
import matchingRouter from '../modules/matching/matching.route.js';
import blocksRouter from '../modules/trust/block.route.js';
import notificationsRouter from '../modules/notifications/notification.route.js';
import availabilityRouter from '../modules/availability/availability.route.js';
import invitesRouter from '../modules/invites/invite.route.js';
import duoPostsRouter from '../modules/duoPosts/duoPost.route.js';
import feedbackRouter from '../modules/trust/feedback.route.js';
import reportsRouter from '../modules/trust/report.route.js';
import adminRouter from '../modules/admin/admin.route.js';

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
router.use('/availability', availabilityRouter);
router.use('/invites', invitesRouter);
router.use('/duo-posts', duoPostsRouter);
router.use('/feedback', feedbackRouter);
router.use('/reports', reportsRouter);
router.use('/admin', adminRouter);

export default router;
