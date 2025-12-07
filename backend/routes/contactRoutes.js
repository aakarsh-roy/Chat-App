import express from 'express';
import {
  addContact,
  getContacts,
  removeContact,
} from '../controllers/contactController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getContacts).post(addContact);
router.delete('/:contactId', removeContact);

export default router;
