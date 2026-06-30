import express from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import {
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  handleValidation,
} from '../middleware/validators.js';

const router = express.Router();

router.post('/register', registerRules, handleValidation, register);
router.post('/login', loginRules, handleValidation, login);
router.post('/refresh-token', refreshToken); // no body to validate - reads cookie
router.post('/logout', logout);
router.post('/logout-all', protect, logoutAll);
router.post('/forgot-password', forgotPasswordRules, handleValidation, forgotPassword);
router.post('/reset-password/:token', resetPasswordRules, handleValidation, resetPassword);

export default router;
