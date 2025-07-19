import asyncHandler from 'express-async-handler';
import Transaction from '../models/Transaction.js';
import Client from '../models/Client.js';
import BalanceRecord from '../models/BalanceRecord.js';
import User from '../models/User.js'; // Import User model
import { sendPushNotification } from './notificationController.js'; // Import notification sender

// ... (createTransaction, getTransactions, etc. - no changes needed there)
const createTransaction = asyncHandler(async (req, res) => {
    const { client, type, amount, currency, description, date, paymentMethod, voucherNo } = req.body;

    // Basic validation
    if (!type || !amount) {
        res.status(400);
        throw new Error('Please provide type and amount for the transaction.');
    }

    // Validate if client exists if provided
    let clientName = 'N/A';
    if (client) {
        const existingClient = await Client.findById(client);
        if (!existingClient) {
            res.status(404);
            throw new Error('Client not found. Cannot record transaction with an invalid client.');
        }
        clientName = existingClient.name;
    }

    const transaction = await Transaction.create({
        client,
        type,
        amount,
        currency,
        description,
        voucherNo,
        date,
        paymentMethod,
        recordedBy: req.user._id, // User who recorded the transaction
    });

    if (transaction) {
        const notificationTitle = 'New Transaction Recorded!';
        const notificationBody = `${type} of ${amount} ${currency} for ${clientName} recorded by ${req.user.name}.`;
        const notificationData = {
            screen: 'CashBook',
            id: transaction._id.toString(),
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

        // Also send notification to the user who created the transaction (if they have a token)
        if (req.user.expoPushToken) {
            await sendPushNotification({
                expoPushToken: req.user.expoPushToken,
                title: notificationTitle,
                body: notificationBody,
                data: notificationData,
            });
        }

        res.status(201).json(transaction);
    } else {
        res.status(400);
        throw new Error('Invalid transaction data');
    }
});
const getTransactions = asyncHandler(async (req, res) => {
    // Optionally filter by client, type, date range etc.
    const transactions = await Transaction.find({})
        .populate('client', 'name email phone') // Populate client info
        .populate('recordedBy', 'name email'); // Populate recorder info
    res.json(transactions);
});
const getTransactionById = asyncHandler(async (req, res) => {
    const transaction = await Transaction.findById(req.params.id)
        .populate('client', 'name email phone')
        .populate('recordedBy', 'name email');

    if (transaction) {
        res.json(transaction);
    } else {
        res.status(404);
        throw new Error('Transaction not found');
    }
});
const updateTransaction = asyncHandler(async (req, res) => {
    const { client, type, amount, currency, description, date, paymentMethod, voucherNo } = req.body;

    const transaction = await Transaction.findById(req.params.id);

    if (transaction) {
        if (client) {
            const existingClient = await Client.findById(client);
            if (!existingClient) {
                res.status(404);
                throw new Error('Client not found. Cannot update transaction with an invalid client.');
            }
            transaction.client = client;
        } else {
            transaction.client = undefined; // Set to undefined to remove the field if client is not provided
        }
        transaction.type = type || transaction.type;
        transaction.amount = amount || transaction.amount;
        transaction.currency = currency || transaction.currency;
        transaction.description = description || transaction.description;
        transaction.voucherNo = voucherNo || transaction.voucherNo;
        transaction.date = date || transaction.date;

        const updatedTransaction = await transaction.save();
        res.json(updatedTransaction);
    } else {
        res.status(404);
        throw new Error('Transaction not found');
    }
});

// @desc    Get all data for the cash book for a specific period
// @route   GET /api/transactions/cashbook
// @access  Private (Admin/Staff)
const getCashBookData = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        res.status(400);
        throw new Error('Please provide both startDate and endDate.');
    }

   

 

    let openingCashBalance = 0;
    let openingBankBalance = 0;
    let lastBalancedDate = null;

    // Find the most recent balance record that occurred ON or BEFORE the periodStartDate
    const relevantBalanceRecord = await BalanceRecord.findOne({
        lastBalancedDate: { $lte: periodStartDate },
    }).sort({ lastBalancedDate: -1 });

    let calculationStartPoint = new Date(0); // Default to epoch start

    if (relevantBalanceRecord) {
        openingCashBalance = relevantBalanceRecord.cashBalance;
        openingBankBalance = relevantBalanceRecord.bankBalance;
        calculationStartPoint = relevantBalanceRecord.lastBalancedDate;
        lastBalancedDate = relevantBalanceRecord.lastBalancedDate; // This is the last time a balance was explicitly set
    }

    // Sum transactions from the calculationStartPoint up to (but not including) the periodStartDate
    const transactionsBeforePeriod = await Transaction.find({
        date: { $gt: calculationStartPoint, $lt: periodStartDate },
    });

    transactionsBeforePeriod.forEach(transaction => {
        if (transaction.type === 'Income') {
            if (transaction.paymentMethod === 'Cash') openingCashBalance += transaction.amount;
            else if (transaction.paymentMethod === 'Bank Transfer' || transaction.paymentMethod === 'Card') openingBankBalance += transaction.amount;
        } else if (transaction.type === 'Expense') {
            if (transaction.paymentMethod === 'Cash') openingCashBalance -= transaction.amount;
            else if (transaction.paymentMethod === 'Bank Transfer' || transaction.paymentMethod === 'Card') openingBankBalance -= transaction.amount;
        }
    });

    // Get all transactions within the specified period.
    const entries = await Transaction.find({
        date: { $gte: periodStartDate, $lte: periodEndDate },
    })
    .populate('client', 'name')
    .sort({ date: 1 });

    res.json({
        openingCashBalance,
        openingBankBalance,
        entries,
        lastBalancedDate: lastBalancedDate,
    });
});
const deleteTransaction = asyncHandler(async (req, res) => {
    const transaction = await Transaction.findById(req.params.id);

    if (transaction) {
        await Transaction.deleteOne({ _id: transaction._id });
        res.json({ message: 'Transaction removed' });
    } else {
        res.status(404);
        throw new Error('Transaction not found');
    }
});

export {
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
    getCashBookData,
}
