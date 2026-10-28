import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  changePassword,
  deleteAccount,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} from './auth.controller.js';
import { protect } from './auth.middleware.js';
import { forgotPasswordLimiter, loginCredentialLimiter } from '../../middlewares/rateLimits.js';

const router = Router();

router.post('/register', register);
router.post('/login', loginCredentialLimiter, login);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-email', verifyEmail);

router.get('/profile', protect, getProfile);
router.patch('/change-password', protect, changePassword);
router.delete('/account', protect, deleteAccount);
router.post('/resend-verification', protect, resendVerification);

export default router;
