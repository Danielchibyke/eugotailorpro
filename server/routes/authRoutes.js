import express from 'express';
import { registerUser, loginUser, getDashboardStats, refreshToken, updateUserProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Define authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshToken); // New route for token refresh
router.get('/dashboard-stats', protect, getDashboardStats);
router.put('/profile', protect, updateUserProfile);

export default router;
