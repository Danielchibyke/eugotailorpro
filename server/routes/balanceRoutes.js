import express from 'express';
import {
    setLastBalancedDate,
    getLatestBalanceRecord,
    getAllBalanceRecords,
} from '../controllers/balanceController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, authorizeRoles('admin', 'staff'), getAllBalanceRecords);

router.route('/setLastBalancedDate')
    .post(protect, authorizeRoles('admin', 'staff'), setLastBalancedDate);

router.route('/latest')
    .get(protect, authorizeRoles('admin', 'staff'), getLatestBalanceRecord);

export default router;