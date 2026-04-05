import express from 'express';
import { signup, login, logout, getCurrentUser } from '../controllers/authController.js';
import { googleAuth, googleCallback } from '../controllers/authController.js';

const router = express.Router();

// Auth routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/current-user', getCurrentUser);

// Google authentication routes
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
export default router;