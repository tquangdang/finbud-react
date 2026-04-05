import express from 'express';
import { getProfile, updateProfile } from '../controllers/userController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// User routes
router.use(isAuthenticated);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router;