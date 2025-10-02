import express from 'express';
import { registerUser, loginUser, getDashboardStats, refreshToken, updateUserProfile, getAllUsers, updateUserRole, deleteUser, updateUserPushToken, updateUserStatus, updateUserCustomPermissions, getMe } from '../controllers/authController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../utils/permissions.js';

const router = express.Router();

// Define authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshToken); // New route for token refresh
router.get('/dashboard-stats', protect, getDashboardStats);
router.put('/profile', protect, updateUserProfile);
router.get('/me', protect, getMe); // New route to get current user's profile
router.get('/users', protect, getAllUsers);
router.put('/users/:id/role', protect, authorize(PERMISSIONS.USERS_MANAGE), updateUserRole); // New route for updating user role
router.delete('/users/:id', protect, authorize(PERMISSIONS.USERS_MANAGE), deleteUser); // New route for deleting user
router.put('/update-pushtoken', protect, updateUserPushToken);
router.put('/users/:id/status', protect, authorize(PERMISSIONS.USERS_MANAGE), updateUserStatus); // New route for updating user status
router.put('/users/:id/custom-permissions', protect, authorize(PERMISSIONS.USERS_MANAGE), updateUserCustomPermissions); // New route for updating user custom permissions


export default router;
