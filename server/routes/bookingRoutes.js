// server/routes/bookingRoutes.js
import express from 'express';
import {
    createBooking,
    getBookings,
    getBookingById,
    updateBooking,
    deleteBooking,
} from '../controllers/bookingController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, authorizeRoles('admin', 'staff'), createBooking)
    .get(protect, authorizeRoles('admin', 'staff'), getBookings);

router.route('/:id')
    .get(protect, authorizeRoles('admin', 'staff'), getBookingById)
    .put(protect, authorizeRoles('admin', 'staff'), updateBooking)
    .delete(protect, authorizeRoles('admin'), deleteBooking); // Admin only for deletion

export default router;