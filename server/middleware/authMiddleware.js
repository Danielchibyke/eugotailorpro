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

// Middleware to check user roles (optional, but good for fine-grained access control)
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403); // Forbidden
            throw new Error(`User role ${req.user ? req.user.role : 'unauthenticated'} is not authorized to access this route`);
        }
        next();
    };
};

export { protect, authorizeRoles };