// server/models/Booking.js
import mongoose from 'mongoose';

const bookingSchema = mongoose.Schema(
    {
        client: { // Reference to the client who made the booking
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Client',
        },
        serviceType: { // e.g., 'Consultation', 'Custom Design', 'Fitting', 'Alteration'
            type: String,
            required: true,
        },
        bookingDate: {
            type: Date,
            required: true,
        },
        bookingTime: { // Store time as a string for simplicity, or use a more complex time type
            type: String,
            required: true,
        },
        status: { // e.g., 'Pending', 'Confirmed', 'Completed', 'Cancelled'
            type: String,
            required: true,
            default: 'Pending',
        },
        notes: { // Any specific notes for this booking
            type: String,
        },
        // Reference to the user (staff/admin) who created this booking record
        bookedBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;