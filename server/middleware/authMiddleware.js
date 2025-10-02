// server/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js'; // Ensure you have your User model correctly imported

const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Check for token in 'Authorization' header (Bearer token)
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Find user by ID from token payload and attach to request
            req.user = await User.findById(decoded.id).select('-password'); // Exclude password field
            next(); // Move to the next middleware/route handler

        } catch (error) {
            console.error(error);
            res.status(401); // Unauthorized
            throw new Error('Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

import { ROLES, ROLE_PERMISSIONS, getUserEffectivePermissions } from '../utils/permissions.js';

const authorize = (...requiredPermissions) => {
    return (req, res, next) => {
        // Get effective permissions for the user, combining role-based and custom permissions
        const userEffectivePermissions = getUserEffectivePermissions(req.user);
        const hasPermission = requiredPermissions.every(p => userEffectivePermissions.includes(p));

        if (!req.user || !hasPermission) {
            res.status(403); // Forbidden
            throw new Error(`Access Denied: You do not have the required permissions.`);
        }
        next();
    };
};


export { protect, authorize };