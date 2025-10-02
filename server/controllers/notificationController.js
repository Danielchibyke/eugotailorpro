
import asyncHandler from 'express-async-handler';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { agenda } from '../utils/agenda.js';

// @desc    Register a push notification token
// @route   POST /api/notifications/register
// @access  Private
const registerPushToken = asyncHandler(async (req, res) => {
    const { token } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
        user.expoPushToken = token;
        await user.save();
        res.json({ message: 'Push token registered successfully' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get all notifications for the current user
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ user: req.user._id })
        .sort({ createdAt: -1 });
  
    res.json(notifications);
});

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (notification && notification.user.toString() === req.user._id.toString()) {
        notification.read = true;
        await notification.save();
        res.json({ message: 'Notification marked as read' });
    } else {
        res.status(404);
        throw new Error('Notification not found');
    }
});

// @desc    Create a new notification
// @access  Private (used internally)
const createNotification = async (userId, title, message, screen, itemId) => {
    try {
        await Notification.create({
            user: userId,
            title,
            message,
            screen,
            itemId,
        });
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
};

// @desc    Snooze a reminder
// @route   POST /api/notifications/snooze
// @access  Private
const snoozeReminder = asyncHandler(async (req, res) => {
    const { bookingId } = req.body;
    const snoozeTime = new Date(new Date().getTime() + 60 * 60 * 1000); // 1 hour from now

    await agenda.schedule(snoozeTime, 'send booking reminder', { bookingId });

    res.json({ message: 'Reminder snoozed for 1 hour' });
});

export { registerPushToken, getNotifications, markAsRead, createNotification, snoozeReminder };
