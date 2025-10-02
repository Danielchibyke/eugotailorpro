// server/routes/bookingRoutes.js
import express from 'express';
import {
    createBooking,
    getBookings,
    getBookingById,
    updateBooking,
    deleteBooking,
    getReminders,
} from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../utils/permissions.js';

const router = express.Router();

router.route('/')
    .post(protect, authorize(PERMISSIONS.BOOKINGS_CREATE), createBooking)
    .get(protect, authorize(PERMISSIONS.BOOKINGS_VIEW), getBookings);

router.route('/reminders')
    .get(protect, authorize(PERMISSIONS.BOOKINGS_VIEW), getReminders);

router.route('/:id')
    .get(protect, authorize(PERMISSIONS.BOOKINGS_VIEW), getBookingById)
    .put(protect, authorize(PERMISSIONS.BOOKINGS_EDIT), updateBooking)
    .delete(protect, authorize(PERMISSIONS.BOOKINGS_DELETE), deleteBooking); // Admin only for deletion

export default router;