import asyncHandler from 'express-async-handler';
import BalanceRecord from '../models/BalanceRecord.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js'; // Import User model
import { sendPushNotification } from './notificationController.js'; // Import notification sender

// @desc    Set the last balanced date and balances
// @route   POST /api/balances/setLastBalancedDate
// @access  Private (Admin/Staff)
const setLastBalancedDate = asyncHandler(async (req, res) => {
    const { date, cashBalance, bankBalance } = req.body;
    console.log('Setting last balanced date:', date, 'Cash:', cashBalance, 'Bank:', bankBalance);   

    if (!date || cashBalance === undefined || bankBalance === undefined) {
        res.status(400);
        throw new Error('Please provide date, cashBalance, and bankBalance.');
    }

    // In a real application, you might want to ensure only one active balance record
    // or handle updates to the latest record.
    const balanceRecord = await BalanceRecord.create({
        lastBalancedDate: date,
        cashBalance,
        bankBalance,
        recordedBy: req.user._id,
    });

    if (balanceRecord) {
        const notificationTitle = 'New Balance Record!';
        const notificationBody = `New balance recorded by ${req.user.name} on ${new Date(date).toLocaleDateString()}. Cash: ${cashBalance}, Bank: ${bankBalance}.`;
        const notificationData = {
            screen: 'CashBook',
            id: balanceRecord._id.toString(),
        };

        // Get all staff and admin users
        const allRelevantUsers = await User.find({ role: { $in: ['staff', 'admin'] } });

        for (const userToNotify of allRelevantUsers) {
            // Only send notification if user has a push token and is not the current user
            if (userToNotify.expoPushToken && userToNotify._id.toString() !== req.user._id.toString()) {
                await sendPushNotification({
                    expoPushToken: userToNotify.expoPushToken,
                    title: notificationTitle,
                    body: notificationBody,
                    data: notificationData,
                });
            }
        }

        // Also send notification to the user who created the balance record (if they have a token)
        if (req.user.expoPushToken) {
            await sendPushNotification({
                expoPushToken: req.user.expoPushToken,
                title: notificationTitle,
                body: notificationBody,
                data: notificationData,
            });
        }

        res.status(201).json(balanceRecord);
    } else {
        res.status(400);
        throw new Error('Invalid balance record data');
    }
});

// @desc    Get the latest balance record
// @route   GET /api/balances/latest
// @access  Private (Admin/Staff)
const getLatestBalanceRecord = asyncHandler(async (req, res) => {
    const latestRecord = await BalanceRecord.findOne().sort({ lastBalancedDate: -1 });

    if (latestRecord) {
        res.json(latestRecord);
    } else {
        res.json({ lastBalancedDate: null, cashBalance: 0, bankBalance: 0 });
    }
});

// @desc    Get all balance records
// @route   GET /api/balances
// @access  Private (Admin/Staff)
const getAllBalanceRecords = asyncHandler(async (req, res) => {
    const records = await BalanceRecord.find({}).sort({ lastBalancedDate: 'asc' })
        .populate('recordedBy', 'name email'); // Populate recordedBy info
    res.json(records);
});

export {
    setLastBalancedDate,
    getLatestBalanceRecord,
    getAllBalanceRecords,
};