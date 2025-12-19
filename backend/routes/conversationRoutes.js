import express from 'express';
import {
  getConversations,
  getConversation,
  createConversation,
  createGroupConversation,
  deleteConversation,
  clearConversationMessages,
} from '../controllers/conversationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getConversations).post(createConversation);
router.route('/group').post(createGroupConversation);
router.route('/:id').get(getConversation).delete(deleteConversation);
router.route('/:id/messages').delete(clearConversationMessages);

export default router;
