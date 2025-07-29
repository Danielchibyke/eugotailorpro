// server/controllers/authController.js
import jwt from 'jsonwebtoken';
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
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshTokens.push(refreshToken); // Store the refresh token
        await user.save();

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: accessToken, // Access token
            refreshToken: refreshToken, // Refresh token
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
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshTokens.push(refreshToken); // Store the refresh token
        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: accessToken, // Access token
            refreshToken: refreshToken, // Refresh token
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
        .populate('client', 'name measurements');

    res.json({
        totalBookings,
        pendingBookings,
        totalClients,
        totalRevenue,
        recentBookings,
    });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public (but requires a valid refresh token)
const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken: clientRefreshToken } = req.body;

    if (!clientRefreshToken) {
        res.status(401);
        throw new Error('No refresh token provided');
    }

    try {
        const decoded = jwt.verify(clientRefreshToken, process.env.JWT_REFRESH_SECRET);

        const user = await User.findById(decoded.id);

        if (!user) {
            res.status(401);
            throw new Error('User not found');
        }

        // Check if the refresh token exists in the user's stored refresh tokens
        if (!user.refreshTokens.includes(clientRefreshToken)) {
            res.status(401);
            throw new Error('Invalid refresh token');
        }

        // Generate new access and refresh tokens
        const newAccessToken = user.generateAccessToken();
        const newRefreshToken = user.generateRefreshToken();

        // Invalidate the old refresh token and add the new one
        user.refreshTokens = user.refreshTokens.filter(token => token !== clientRefreshToken);
        user.refreshTokens.push(newRefreshToken);
        await user.save();

        res.json({
            token: newAccessToken,
            refreshToken: newRefreshToken,
        });

    } catch (error) {
        res.status(401);
        throw new Error('Not authorized, refresh token failed');
    }
});


// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            token: user.generateAccessToken(),
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});
export { registerUser, loginUser, getDashboardStats, refreshToken, updateUserProfile };
