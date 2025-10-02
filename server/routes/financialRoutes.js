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
import { protect, authorize } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../utils/permissions.js';

const router = express.Router();

// Standard transaction routes
router.route('/')
    .post(protect, authorize(PERMISSIONS.FINANCIALS_MANAGE), createTransaction)
    .get(protect, authorize(PERMISSIONS.FINANCIALS_VIEW), getTransactions);

// New, consolidated cash book route
router.route('/cashbook')
    .get(protect, authorize(PERMISSIONS.FINANCIALS_VIEW), getCashBookData);

// Routes for specific transactions by ID
router.route('/:id')
    .get(protect, authorize(PERMISSIONS.FINANCIALS_VIEW), getTransactionById)
    .put(protect, authorize(PERMISSIONS.FINANCIALS_MANAGE), updateTransaction)
    .delete(protect, authorize(PERMISSIONS.FINANCIALS_MANAGE), deleteTransaction); // Admin only for deletion

export default router;