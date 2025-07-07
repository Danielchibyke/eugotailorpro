// server/routes/financialRoutes.js
import express from 'express';
import {
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
    getCashBookData, // Updated import
} from '../controllers/financialController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Standard transaction routes
router.route('/')
    .post(protect, authorizeRoles('admin', 'staff'), createTransaction)
    .get(protect, authorizeRoles('admin', 'staff'), getTransactions);

// New, consolidated cash book route
router.route('/cashbook')
    .get(protect, authorizeRoles('admin', 'staff'), getCashBookData);

// Routes for specific transactions by ID
router.route('/:id')
    .get(protect, authorizeRoles('admin', 'staff'), getTransactionById)
    .put(protect, authorizeRoles('admin', 'staff'), updateTransaction)
    .delete(protect, authorizeRoles('admin'), deleteTransaction); // Admin only for deletion

export default router;