import { Router } from 'express';
import authRouter from '../modules/auth/auth.route.js';
import profilesRouter from '../modules/profiles/profile.route.js';

const router = Router();

router.get('/', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Duo LAS API v1',
  });
});

router.use('/auth', authRouter);
router.use('/profiles', profilesRouter);

export default router;
