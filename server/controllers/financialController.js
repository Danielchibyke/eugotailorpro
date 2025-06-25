// server/controllers/financialController.js
import asyncHandler from 'express-async-handler';
import Transaction from '../models/Transaction.js';
import Client from '../models/Client.js'; // Needed to validate client existence

// @desc    Create a new transaction
// @route   POST /api/transactions
// @access  Private (Admin/Staff)
const createTransaction = asyncHandler(async (req, res) => {
    const { client, type, amount, currency, description, date } = req.body;

    // Basic validation
    if (!client || !type || !amount) {
        res.status(400);
        throw new Error('Please provide client, type, and amount for the transaction.');
    }

    // Validate if client exists
    const existingClient = await Client.findById(client);
    if (!existingClient) {
        res.status(404);
        throw new Error('Client not found. Cannot record transaction without a valid client.');
    }

    const transaction = await Transaction.create({
        client,
        type,
        amount,
        currency,
        description,
        date,
        recordedBy: req.user._id, // User who recorded the transaction
    });

    res.status(201).json(transaction);
});

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private (Admin/Staff)
const getTransactions = asyncHandler(async (req, res) => {
    // Optionally filter by client, type, date range etc.
    const transactions = await Transaction.find({})
        .populate('client', 'name email phone') // Populate client info
        .populate('recordedBy', 'name email'); // Populate recorder info
    res.json(transactions);
});

// @desc    Get transaction by ID
// @route   GET /api/transactions/:id
// @access  Private (Admin/Staff)
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

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private (Admin/Staff)
const updateTransaction = asyncHandler(async (req, res) => {
    const { client, type, amount, currency, description, date } = req.body;

    const transaction = await Transaction.findById(req.params.id);

    if (transaction) {
        transaction.client = client || transaction.client;
        transaction.type = type || transaction.type;
        transaction.amount = amount || transaction.amount;
        transaction.currency = currency || transaction.currency;
        transaction.description = description || transaction.description;
        transaction.date = date || transaction.date;

        const updatedTransaction = await transaction.save();
        res.json(updatedTransaction);
    } else {
        res.status(404);
        throw new Error('Transaction not found');
    }
});

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private (Admin only)
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
};