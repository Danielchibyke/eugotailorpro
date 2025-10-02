// server/controllers/authController.js
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Client from '../models/Client.js';
import Transaction from '../models/Transaction.js';
import { ROLE_PERMISSIONS } from '../utils/permissions.js';

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
            customPermissions: user.customPermissions,
            token: accessToken, // Access token
            refreshToken: refreshToken, // Refresh token
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});


const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        if (!user.isActive) {
            res.status(401);
            throw new Error('Your account is deactivated. Please contact support.');
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshTokens.push(refreshToken); // Store the refresh token
        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            customPermissions: user.customPermissions, // Include customPermissions
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
        if (req.body.receiveReminders !== undefined) {
            user.receiveReminders = req.body.receiveReminders;
            console.log(`User ${user._id} receiveReminders set to: ${user.receiveReminders}`);
        }
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

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin (or accessible by any authenticated user for now)
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({});
    res.json(users);
});

// @desc    Update a user's role (Admin only)
// @route   PUT /api/auth/users/:id/role
// @access  Private/Admin
const updateUserRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!role || !['admin', 'staff', 'user'].includes(role)) {
        res.status(400);
        throw new Error('Invalid role provided. Role must be admin, staff, or user.');
    }

    const userToUpdate = await User.findById(id);

    if (userToUpdate) {
        userToUpdate.role = role;
        const updatedUser = await userToUpdate.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Delete a user (Admin only)
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const userToDelete = await User.findById(id);

    if (!userToDelete) {
        res.status(404);
        throw new Error('User not found');
    }

    // Prevent admin from deleting themselves
    if (userToDelete._id.toString() === req.user._id.toString()) {
        res.status(400);
        throw new Error('Cannot delete your own account');
    }

    // Prevent admin from deleting another admin if there's only one admin left
    if (userToDelete.role === 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount <= 1) {
            res.status(400);
            throw new Error('Cannot delete the last admin user');
        }
    }

    await User.deleteOne({ _id: id });
    res.json({ message: 'User removed successfully' });
});


// @desc    Update user's expo push token
// @route   PUT /api/auth/update-pushtoken
// @access  Private
const updateUserPushToken = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const { expoPushToken } = req.body;
    console.log(`Received expoPushToken for user ${req.user._id}: ${expoPushToken}`);
    if (user) {
        user.expoPushToken = expoPushToken;
        await user.save();
        res.json({ message: 'Push token updated successfully' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update a user's active status (Admin only)
// @route   PUT /api/auth/users/:id/status
// @access  Private/Admin
const updateUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    // Validate isActive
    if (typeof isActive !== 'boolean') {
        res.status(400);
        throw new Error('Invalid "isActive" status provided. It must be a boolean.');
    }

    const userToUpdate = await User.findById(id);

    if (!userToUpdate) {
        res.status(404);
        throw new Error('User not found');
    }

    // Prevent admin from deactivating themselves
    if (userToUpdate._id.toString() === req.user._id.toString()) {
        res.status(400);
        throw new Error('You cannot deactivate your own account.');
    }

    userToUpdate.isActive = isActive;
    const updatedUser = await userToUpdate.save();

    res.json({
        _id: updatedUser.email,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
    });
});

// @desc    Update a user's custom permissions (Admin only)
// @route   PUT /api/auth/users/:id/custom-permissions
// @access  Private/Admin
const updateUserCustomPermissions = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { customPermissions } = req.body;

    // Validate customPermissions
    if (!Array.isArray(customPermissions) || !customPermissions.every(p => typeof p === 'string')) {
        res.status(400);
        throw new Error('Invalid customPermissions provided. It must be an array of strings.');
    }

    const userToUpdate = await User.findById(id);

    if (!userToUpdate) {
        res.status(404);
        throw new Error('User not found');
    }

    userToUpdate.customPermissions = customPermissions;
    const updatedUser = await userToUpdate.save();

    res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        customPermissions: updatedUser.customPermissions,
    });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            customPermissions: user.customPermissions,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});


export { registerUser, loginUser, getDashboardStats, refreshToken, updateUserProfile, getAllUsers, updateUserRole, deleteUser, updateUserPushToken, updateUserStatus, updateUserCustomPermissions, getMe };
