import express from 'express';
import {
  addContact,
  getContacts,
  removeContact,
  searchUsers,
} from '../controllers/contactController.js';
import { protect } from '../middleware/authMiddleware.js';
import { searchLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/search', searchLimiter, searchUsers);
router.route('/').get(getContacts).post(addContact);
router.delete('/:contactId', removeContact);

export default router;
