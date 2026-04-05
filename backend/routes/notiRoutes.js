import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { getNotis, createNoti, updateNoti, deleteNoti } from '../controllers/notiController.js';

const router = express.Router();

// Noti routes
router.use(isAuthenticated);

router.get('/', getNotis);
router.post('/', createNoti);
router.put('/:id', updateNoti);
router.delete('/:id', deleteNoti);

export default router;