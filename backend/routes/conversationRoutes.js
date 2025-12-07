import express from 'express';
import {
  getConversations,
  getConversation,
  createConversation,
  createGroupConversation,
  deleteConversation,
} from '../controllers/conversationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getConversations).post(createConversation);
router.route('/group').post(createGroupConversation);
router.route('/:id').get(getConversation).delete(deleteConversation);

export default router;
