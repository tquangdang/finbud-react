import express from 'express';
import { getChats, createChat } from '../controllers/chatController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Chat routes
router.use(isAuthenticated);

router.get('/:threadId', getChats);
router.post('/:threadId', createChat);

export default router; 