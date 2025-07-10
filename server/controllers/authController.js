// server/controllers/authController.js
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Client from '../models/Client.js';
import Transaction from '../models/Transaction.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        name,
        email,
        password,
        role,
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: user.generateAuthToken(),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: user.generateAuthToken(),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Get dashboard statistics
// @route   GET /api/auth/dashboard-stats
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'Pending' });
    const totalClients = await Client.countDocuments();

    const incomeTransactions = await Transaction.find({ type: 'income' });
    const totalRevenue = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);

    const recentBookings = await Booking.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('client', 'name');

    res.json({
        totalBookings,
        pendingBookings,
        totalClients,
        totalRevenue,
        recentBookings,
    });
});

export { registerUser, loginUser, getDashboardStats };