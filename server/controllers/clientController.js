
import asyncHandler from 'express-async-handler';
import Client from '../models/Client.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { sendPushNotification } from '../utils/notificationService.js';

const createClient = asyncHandler(async (req, res) => {
    const { name, email, phone, address, measurements } = req.body;

    if (!name || !phone) {
        res.status(400);
        throw new Error('Please enter client name and phone number.');
    }

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
        measurements,
        createdBy: req.user._id,
    });

    if (client) {
        const notificationTitle = 'New Client Created!';
        const notificationBody = `A new client, ${name}, was added by ${req.user.name}.`;
        const notificationData = { screen: 'ClientDetail', id: client._id.toString() };

        const allRelevantUsers = await User.find({ role: { $in: ['staff', 'admin'] } });

        for (const userToNotify of allRelevantUsers) {
            if (userToNotify.expoPushToken && userToNotify._id.toString() !== req.user._id.toString()) {
                await sendPushNotification({
                    expoPushToken: userToNotify.expoPushToken,
                    title: notificationTitle,
                    body: notificationBody,
                    data: notificationData,
                });
            }
        }

        if (req.user.expoPushToken) {
            await sendPushNotification({
                expoPushToken: req.user.expoPushToken,
                title: notificationTitle,
                body: notificationBody,
                data: notificationData,
            });
        }

        res.status(201).json(client);
    } else {
        res.status(400);
        throw new Error('Invalid client data');
    }
});

const getClients = asyncHandler(async (req, res) => {
    const clients = await Client.find({}).populate('createdBy', 'name email').lean();
    const clientsWithBookingCounts = await Promise.all(
        clients.map(async (client) => {
            const bookingCount = await Booking.countDocuments({ client: client._id });
            return { ...client, totalBookings: bookingCount };
        })
    );
    res.json(clientsWithBookingCounts);
});

const getClientById = asyncHandler(async (req, res) => {
    const client = await Client.findById(req.params.id).populate('createdBy', 'name email');
    if (client) {
        res.json(client);
    } else {
        res.status(404);
        throw new Error('Client not found');
    }
});

const updateClient = asyncHandler(async (req, res) => {
    const { name, email, phone, address, measurements } = req.body;
    const client = await Client.findById(req.params.id);

    if (client) {
        client.name = name || client.name;
        client.email = email || client.email;
        client.phone = phone || client.phone;
        client.address = address || client.address;
        if (measurements) {
            client.measurements = measurements;
        }

        const updatedClient = await client.save();

        const notificationTitle = 'Client Profile Updated!';
        const notificationBody = `${client.name}'s profile was updated by ${req.user.name}.`;
        const notificationData = { screen: 'ClientDetail', id: client._id.toString() };

        const allRelevantUsers = await User.find({ role: { $in: ['staff', 'admin'] } });

        for (const userToNotify of allRelevantUsers) {
            if (userToNotify.expoPushToken && userToNotify._id.toString() !== req.user._id.toString()) {
                await sendPushNotification({
                    expoPushToken: userToNotify.expoPushToken,
                    title: notificationTitle,
                    body: notificationBody,
                    data: notificationData,
                });
            }
        }

        if (req.user.expoPushToken) {
            await sendPushNotification({
                expoPushToken: req.user.expoPushToken,
                title: notificationTitle,
                body: notificationBody,
                data: notificationData,
            });
        }

        res.json(updatedClient);
    } else {
        res.status(404);
        throw new Error('Client not found');
    }
});

const deleteClient = asyncHandler(async (req, res) => {
    const client = await Client.findById(req.params.id);
    if (client) {
        await Client.deleteOne({ _id: client._id });
        res.json({ message: 'Client removed' });
    } else {
        res.status(404);
        throw new Error('Client not found');
    }
});

const updateClientMeasurements = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const measurements = req.body;
    const updatedClient = await Client.findOneAndUpdate(
        { _id: id },
        { $set: { measurements: measurements } },
        { new: true, runValidators: true }
    );

    if (updatedClient) {
        res.json(updatedClient);
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
    updateClientMeasurements,
};