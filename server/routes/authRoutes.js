// server/routes/authRoutes.js
import express from 'express';
import { registerUser, loginUser, getDashboardStats } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Define authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/dashboard-stats', protect, getDashboardStats);

export default router;
