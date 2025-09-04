// server/models/Booking.js
import mongoose from 'mongoose';

const bookingSchema = mongoose.Schema(
    {
        client: { // Reference to the client who made the booking
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Client',
        },
       
        bookingDate: {
            type: Date,
            required: true,
        },
        deliveryDate: {
            type: Date,
        },
        reminderDate: {
            type: Date,
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
        
        designs: {
            type: [String], //url for the design image
            required: true,
        },
        price: {
            type: Number,
            default: 0,
        },
        payment: {
            type: Number,
            default: 0,
        },
        notificationSent: {
            type: Boolean,
            default: false,
        }
    },
    {
        timestamps: true,
    }
);

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;