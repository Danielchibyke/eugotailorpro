// server/controllers/bookingController.js
import asyncHandler from 'express-async-handler';
import Booking from '../models/Booking.js';
import Client from '../models/Client.js'; // Needed to validate client existence

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (Admin/Staff)
const createBooking = asyncHandler(async (req, res) => {
    const { client, bookingDate, deliveryDate, status, notes, design, price, payment, reminderDate } = req.body;

    // Basic validation
    if (!client || !bookingDate ) {
        res.status(400);
        throw new Error('Please provide client, service type, date, and time for the booking.');
    }

    // Validate if client exists
    const existingClient = await Client.findById(client);
    if (!existingClient) {
        res.status(404);
        throw new Error('Client not found. Please create the client first.');
    }

    const booking = await Booking.create({
        client,
        bookingDate,
        deliveryDate,
        status,
        notes,
        bookedBy: req.user._id, // User who created the booking
        design,
        price,
        payment,
        reminderDate
    });

    res.status(201).json(booking);
});

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private (Admin/Staff)
const getBookings = asyncHandler(async (req, res) => {
    const { client: clientId } = req.query;
    const filter = clientId ? { client: clientId } : {};
   
    const bookings = await Booking.find(filter)
        .populate('client', 'name email phone') // Populate client info
        .populate('bookedBy', 'name email'); // Populate booker info
    res.json(bookings);
});

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private (Admin/Staff)
const getBookingById = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id)
        .populate('client', 'name email phone')
        .populate('bookedBy', 'name email');

    if (booking) {
        res.json(booking);
    } else {
        res.status(404);
        throw new Error('Booking not found');
    }
});

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private (Admin/Staff)
const updateBooking = asyncHandler(async (req, res) => {
    const { client, bookingDate, status, notes, deliveryDate, design, price, payment, reminderDate } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (booking) {
        booking.client = client || booking.client;
        booking.bookingDate = bookingDate || booking.bookingDate;
        booking.deliveryDate = deliveryDate || booking.deliveryDate;
        booking.status = status || booking.status;
        booking.notes = notes || booking.notes;
        booking.reminderDate = reminderDate || booking.reminderDate;
        design && (booking.design = design); // Update design if provided
        booking.price = price || booking.price;
        booking.payment = payment || booking.payment;

        const updatedBooking = await booking.save();
        res.json(updatedBooking);
    } else {
        res.status(404);
        throw new Error('Booking not found');
    }
});

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private (Admin only)
const deleteBooking = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);

    if (booking) {
        await Booking.deleteOne({ _id: booking._id });
        res.json({ message: 'Booking removed' });
    } else {
        res.status(404);
        throw new Error('Booking not found');
    }
});

export {
    createBooking,
    getBookings,
    getBookingById,
    updateBooking,
    deleteBooking,
};