import asyncHandler from 'express-async-handler';
import BalanceRecord from '../models/BalanceRecord.js';
import Transaction from '../models/Transaction.js';

// @desc    Set the last balanced date and balances
// @route   POST /api/balances/setLastBalancedDate
// @access  Private (Admin/Staff)
const setLastBalancedDate = asyncHandler(async (req, res) => {
    const { date, cashBalance, bankBalance } = req.body;

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

    res.status(201).json(balanceRecord);
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
    const records = await BalanceRecord.find({}).sort({ lastBalancedDate: 'asc' });
    res.json(records);
});

export {
    setLastBalancedDate,
    getLatestBalanceRecord,
    getAllBalanceRecords,
};