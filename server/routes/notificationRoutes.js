import express from 'express';
import { sendPushNotification, savePushToken } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/send').post(protect, sendPushNotification);
router.route('/save-token').post(protect, savePushToken); // New route to save push token

export default router;