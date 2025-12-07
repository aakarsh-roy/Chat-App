import express from 'express';
import {
  sendMessage,
  getMessages,
  markAsRead,
  deleteMessage,
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', upload.single('file'), sendMessage);
router.get('/:conversationId', getMessages);
router.put('/:messageId/read', markAsRead);
router.delete('/:messageId', deleteMessage);

export default router;
