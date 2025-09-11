import express from 'express';
import { registerUser, loginUser, getDashboardStats, refreshToken, updateUserProfile, getAllUsers, updateUserRole, deleteUser, updateUserPushToken, updateUserStatus } from '../controllers/authController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Define authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshToken); // New route for token refresh
router.get('/dashboard-stats', protect, getDashboardStats);
router.put('/profile', protect, updateUserProfile);
router.get('/users', protect, getAllUsers);
router.put('/users/:id/role', protect, authorizeRoles('admin'), updateUserRole); // New route for updating user role
router.delete('/users/:id', protect, authorizeRoles('admin'), deleteUser); // New route for deleting user
router.put('/update-pushtoken', protect, updateUserPushToken);
router.put('/users/:id/status', protect, authorizeRoles('admin'), updateUserStatus); // New route for updating user status


export default router;
