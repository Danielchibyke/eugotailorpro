import express from 'express';
const router = express.Router();
import { registerPushToken, getNotifications, markAsRead, snoozeReminder } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

router.route('/register').post(protect, registerPushToken);
router.route('/').get(protect, getNotifications);
router.route('/:id/read').put(protect, markAsRead);
router.route('/snooze').post(protect, snoozeReminder);

export default router;