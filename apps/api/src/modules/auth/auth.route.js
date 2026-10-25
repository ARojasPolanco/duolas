import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  changePassword,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} from './auth.controller.js';
import { protect } from './auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-email', verifyEmail);

router.get('/profile', protect, getProfile);
router.patch('/change-password', protect, changePassword);
router.post('/resend-verification', protect, resendVerification);

export default router;
