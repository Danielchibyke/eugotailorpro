// server/controllers/clientController.js
import asyncHandler from 'express-async-handler';
import Client from '../models/Client.js';
import Booking from '../models/Booking.js'; // Import Booking model

// @desc    Create a new client
// @route   POST /api/clients
// @access  Private (Admin/Staff)
const createClient = asyncHandler(async (req, res) => {
    const { name, email, phone, address,measurement } = req.body;

    // Basic validation
    if (!name || !phone) {
        res.status(400);
        throw new Error('Please enter client name and phone number.');
    }

    // Check if client with this phone or email already exists (if email provided)
    const phoneExists = await Client.findOne({ phone });
    if (phoneExists) {
        res.status(400);
        throw new Error('Client with this phone number already exists.');
    }
    if (email) {
        const emailExists = await Client.findOne({ email });
        if (emailExists) {
            res.status(400);
            throw new Error('Client with this email already exists.');
        }
    }

    const client = await Client.create({
        name,
        email,
        phone,
        address,
        measurement,
        createdBy: req.user._id, // User who created the client from middleware
    });

    res.status(201).json(client);
});

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private (Admin/Staff)
const getClients = asyncHandler(async (req, res) => {
    const clients = await Client.aggregate([
        {
            $lookup: {
                from: 'bookings', // The name of the bookings collection
                localField: '_id',
                foreignField: 'client',
                as: 'bookings',
            },
        },
        {
            $addFields: {
                totalBookings: { $size: '$bookings' },
            },
        },
        {
            $project: {
                bookings: 0, // Exclude the actual bookings array if not needed on the frontend
            },
        },
    ]);

    // If you still need to populate 'createdBy', you'll need to do it after aggregation
    // or adjust the aggregation pipeline to include it.
    // For now, we'll just return the clients with totalBookings.
    res.json(clients);
});

// @desc    Get client by ID
// @route   GET /api/clients/:id
// @access  Private (Admin/Staff)
const getClientById = asyncHandler(async (req, res) => {
    const client = await Client.findById(req.params.id).populate('createdBy', 'name email');

    if (client) {
        res.json(client);
    } else {
        res.status(404);
        throw new Error('Client not found');
    }
});

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private (Admin/Staff)
const updateClient = asyncHandler(async (req, res) => {
    const { name, email, phone, address, measurement } = req.body;

    const client = await Client.findById(req.params.id);

    if (client) {
        client.name = name || client.name;
        client.email = email || client.email;
        client.phone = phone || client.phone;
        client.address = address || client.address;

        // If measurement data is provided, merge it with the existing data
        if (measurement) {
            Object.assign(client.measurement, measurement);
        }

        // Optionally, check for duplicate email/phone if they are being updated to existing ones
        if (email && email !== client.email) {
            const emailExists = await Client.findOne({ email });
            if (emailExists && String(emailExists._id) !== String(client._id)) {
                res.status(400);
                throw new Error('Client with this email already exists.');
            }
        }
        if (phone && phone !== client.phone) {
            const phoneExists = await Client.findOne({ phone });
            if (phoneExists && String(phoneExists._id) !== String(client._id)) {
                res.status(400);
                throw new Error('Client with this phone number already exists.');
            }
        }

        const updatedClient = await client.save();
        
        res.json(updatedClient);
    } else {
        res.status(404);
        throw new Error('Client not found');
    }
});

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private (Admin only, or admin/staff for own clients)
const deleteClient = asyncHandler(async (req, res) => {
    const client = await Client.findById(req.params.id);

    if (client) {
        // Optional: Add logic to check if req.user has permission to delete this client
        // E.g., if (req.user.role !== 'admin' && String(client.createdBy) !== String(req.user._id)) { ... }
        await Client.deleteOne({ _id: client._id });
        res.json({ message: 'Client removed' });
    } else {
        res.status(404);
        throw new Error('Client not found');
    }
});

export {
    createClient,
    getClients,
    getClientById,
    updateClient,
    deleteClient,
};