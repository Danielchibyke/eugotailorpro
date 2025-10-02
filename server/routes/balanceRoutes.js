import express from 'express';
import {
    setLastBalancedDate,
    getLatestBalanceRecord,
    getAllBalanceRecords,
} from '../controllers/balanceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../utils/permissions.js';

const router = express.Router();

router.route('/')
    .get(protect, authorize(PERMISSIONS.FINANCIALS_VIEW), getAllBalanceRecords);

router.route('/setLastBalancedDate')
    .post(protect, authorize(PERMISSIONS.FINANCIALS_MANAGE), setLastBalancedDate);

router.route('/latest')
    .get(protect, authorize(PERMISSIONS.FINANCIALS_VIEW), getLatestBalanceRecord);

export default router;