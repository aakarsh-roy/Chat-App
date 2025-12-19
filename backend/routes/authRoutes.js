import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getMe,
  updateProfile,
  uploadAvatar,
  searchUsers,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadAvatar as uploadMiddleware } from '../middleware/uploadMiddleware.js';
import { authLimiter, uploadLimiter, searchLimiter } from '../middleware/rateLimitMiddleware.js';
import { validateInput } from '../middleware/sanitizationMiddleware.js';

const router = express.Router();

// Public routes with strict rate limiting
router.post(
  '/register',
  authLimiter,
  validateInput,
  [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
  ],
  register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/upload-avatar', protect, uploadLimiter, uploadMiddleware.single('avatar'), uploadAvatar);
router.get('/search', protect, searchLimiter, searchUsers);

export default router;
