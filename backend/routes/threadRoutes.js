import express from 'express';
import { getThreads, createThread, updateThread, deleteThread } from '../controllers/threadController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Thread routes
router.use(isAuthenticated);

router.get('/', getThreads);
router.post('/', createThread);
router.put('/:id', updateThread);
router.delete('/:id', deleteThread);

export default router; 