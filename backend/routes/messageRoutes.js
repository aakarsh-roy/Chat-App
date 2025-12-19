import express from 'express';
import {
  sendMessage,
  getMessages,
  markAsRead,
  deleteMessage,
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { messageLimiter, uploadLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.use(protect);

// Send message with rate limiting (higher limit for file uploads)
router.post('/', (req, res, next) => {
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    uploadLimiter(req, res, next);
  } else {
    messageLimiter(req, res, next);
  }
}, upload.single('file'), sendMessage);

router.get('/:conversationId', getMessages);
router.put('/:messageId/read', markAsRead);
router.delete('/:messageId', deleteMessage);

export default router;
