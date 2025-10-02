// server/controllers/bookingController.js
import asyncHandler from 'express-async-handler';
import Booking from '../models/Booking.js';
import Client from '../models/Client.js';
import User from '../models/User.js';
import { sendPushNotification } from '../utils/notificationService.js';
import { createNotification } from './notificationController.js';
import { agenda, scheduleBookingReminder, cancelBookingReminders } from '../utils/agenda.js'; // Import the new functions
import dayjs from 'dayjs';

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (Admin/Staff)
const createBooking = asyncHandler(async (req, res) => {
    console.log('createBooking function called');
    const { client, bookingDate, deliveryDate, status, notes, designs, price, payment, reminderDates } = req.body;
    console.log('Server-side received reminderDates (create):', reminderDates);
    console.log('Server current UTC time (at create request):', new Date().toISOString());

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

    // Process reminderDates to ensure they are valid Date objects
    const processedReminderDates = (reminderDates || []).map(reminder => {
        try {
            // Parse with dayjs and ensure it's a valid date
            const date = dayjs(reminder.date).toDate();
            if (isNaN(date.getTime())) {
                console.warn(`Invalid reminder date string received: ${reminder.date}. Skipping.`);
                return null;
            }
            if (!reminder.user) {
                console.warn(`Reminder object missing user. Skipping.`);
                return null;
            }
            return { date, user: reminder.user };
        } catch (error) {
            console.warn(`Error processing reminder date: ${reminder.date}`, error);
            return null;
        }
    }).filter(date => date !== null);
    
    console.log('Processed reminder dates (create):', processedReminderDates);

    const booking = await Booking.create({
        client,
        bookingDate,
        deliveryDate,
        status,
        notes,
        bookedBy: req.user._id,
        designs,
        price,
        payment,
        reminderDates: processedReminderDates
    });

    if (booking) {
        const notificationTitle = 'New Booking Created!';
        const notificationBody = `Booking for ${existingClient.name} on ${new Date(bookingDate).toLocaleDateString()} has been created.`;
        const notificationData = {
            screen: 'BookingDetail',
            id: booking._id.toString(),
        };

        // Get all staff and admin users
        const allRelevantUsers = await User.find({ role: { $in: ['staff', 'admin'] } });

        for (const userToNotify of allRelevantUsers) {
            if (userToNotify.expoPushToken && userToNotify._id.toString() !== req.user._id.toString()) {
                await sendPushNotification({
                    expoPushToken: userToNotify.expoPushToken,
                    title: notificationTitle,
                    body: notificationBody,
                    data: notificationData,
                });
                await createNotification(userToNotify._id, notificationTitle, notificationBody, 'BookingDetail', booking._id);
            }
        }

        // Also send notification to the user who created the booking
        if (req.user.expoPushToken) {
            await sendPushNotification({
                expoPushToken: req.user.expoPushToken,
                title: notificationTitle,
                body: notificationBody,
                data: notificationData,
            });
        }

        // SCHEDULE REMINDERS - FIXED VERSION
        if (processedReminderDates && processedReminderDates.length > 0) {
            console.log(`Scheduling ${processedReminderDates.length} reminders for booking ${booking._id}`);
            
            for (const reminder of processedReminderDates) {
                const reminderDate = new Date(reminder.date);
                const now = new Date();
                
                console.log(`Reminder date: ${reminderDate}, Current time: ${now}`);
                
                // Only schedule if reminder is in the future
                if (reminderDate > now) {
                    try {
                        console.log(`Attempting to schedule reminder for booking ${booking._id} at ${reminderDate}`);
                        
                        // Use the proper scheduling function
                        await scheduleBookingReminder(
                            booking._id.toString(),
                            reminderDate,
                            reminder.user.toString()
                        );
                        
                        console.log(`✅ Reminder scheduled successfully for booking ${booking._id} on ${reminderDate} for user ${reminder.user}`);
                    } catch (error) {
                        console.error(`❌ Failed to schedule reminder for booking ${booking._id}:`, error);
                    }
                } else {
                    console.log(`⏰ Reminder date ${reminderDate} is in the past, skipping scheduling`);
                }
            }
        } else if (booking.deliveryDate) {
            // Default reminder if no reminderDates are provided
            const deliveryDate = new Date(booking.deliveryDate);
            const reminderDateToSchedule = new Date(deliveryDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours before
            
            if (reminderDateToSchedule > new Date()) {
                try {
                    await scheduleBookingReminder(booking._id.toString(), reminderDateToSchedule);
                    console.log(`✅ Default reminder scheduled for booking ${booking._id} on ${reminderDateToSchedule}`);
                } catch (error) {
                    console.error(`❌ Failed to schedule default reminder:`, error);
                }
            }
        }

        // Populate the booking before sending response
        const populatedBooking = await Booking.findById(booking._id)
            .populate('client', 'name email phone')
            .populate('bookedBy', 'name email');

        res.status(201).json(populatedBooking);
    } else {
        res.status(400);
        throw new Error('Invalid booking data');
    }
});

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private (Admin/Staff)
const getBookings = asyncHandler(async (req, res) => {
    const { client: clientId } = req.query;
    const filter = clientId ? { client: clientId } : {};
   
    const bookings = await Booking.find(filter)
        .populate('client', 'name email phone createdBy')
        .populate('bookedBy', 'name email')
        .select('+designs');
    res.json(bookings);
});

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private (Admin/Staff)
const getBookingById = asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id)
        .populate('client', 'name email phone')
        .populate('bookedBy', 'name email')
        .select('+designs');

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
    console.log('updateBooking function called');
    const { client, bookingDate, status, notes, deliveryDate, designs, price, payment, reminderDates } = req.body;

    const booking = await Booking.findById(req.params.id).populate('client', 'name');

    if (booking) {
        let clientName = booking.client ? booking.client.name : 'N/A';

        if (client) {
            const newClient = await Client.findById(client);
            if (!newClient) {
                res.status(404);
                throw new Error('Client not found. Cannot update booking with an invalid client.');
            }
            booking.client = client;
            clientName = newClient.name;
        }

        booking.bookingDate = bookingDate || booking.bookingDate;
        booking.deliveryDate = deliveryDate || booking.deliveryDate;
        booking.status = status || booking.status;
        booking.notes = notes || booking.notes;
        
        // Process reminderDates to ensure they are valid Date objects
        const processedReminderDates = (reminderDates || []).map(reminder => {
            try {
                const date = dayjs(reminder.date).toDate();
                if (isNaN(date.getTime())) {
                    console.warn(`Invalid reminder date string received: ${reminder.date}. Skipping.`);
                    return null;
                }
                if (!reminder.user) {
                    console.warn(`Reminder object missing user. Skipping.`);
                    return null;
                }
                return { date, user: reminder.user };
            } catch (error) {
                console.warn(`Error processing reminder date: ${reminder.date}`, error);
                return null;
            }
        }).filter(date => date !== null);
        
        console.log('Processed reminder dates (update):', processedReminderDates);

        booking.reminderDates = processedReminderDates;
        booking.designs = designs || booking.designs;
        booking.price = price || booking.price;
        booking.payment = payment || booking.payment;

        const updatedBooking = await booking.save();

        if (updatedBooking) {
            // CANCEL AND RESCHEDULE REMINDERS - FIXED VERSION
            console.log(`Cancelling and rescheduling reminders for booking ${updatedBooking._id}`);
            
            try {
                // Cancel all existing reminders for this booking
                await cancelBookingReminders(updatedBooking._id.toString());
                console.log(`✅ Cancelled existing reminders for booking ${updatedBooking._id}`);
                
                // Schedule new reminders if any
                if (processedReminderDates && processedReminderDates.length > 0) {
                    console.log(`Scheduling ${processedReminderDates.length} new reminders`);
                    
                    for (const reminder of processedReminderDates) {
                        const reminderDate = new Date(reminder.date);
                        const now = new Date();
                        
                        if (reminderDate > now) {
                            try {
                                await scheduleBookingReminder(
                                    updatedBooking._id.toString(),
                                    reminderDate,
                                    reminder.user.toString()
                                );
                                console.log(`✅ Rescheduled reminder for booking ${updatedBooking._id} on ${reminderDate}`);
                            } catch (error) {
                                console.error(`❌ Failed to reschedule reminder:`, error);
                            }
                        }
                    }
                } else if (updatedBooking.deliveryDate && updatedBooking.status !== 'Cancelled') {
                    // Default reminder if no reminderDates are provided
                    const deliveryDate = new Date(updatedBooking.deliveryDate);
                    const reminderDateToSchedule = new Date(deliveryDate.getTime() - 24 * 60 * 60 * 1000);
                    
                    if (reminderDateToSchedule > new Date()) {
                        try {
                            await scheduleBookingReminder(updatedBooking._id.toString(), reminderDateToSchedule);
                            console.log(`✅ Rescheduled default reminder for booking ${updatedBooking._id}`);
                        } catch (error) {
                            console.error(`❌ Failed to reschedule default reminder:`, error);
                        }
                    }
                }
                
                // Cancel all reminders if booking is cancelled
                if (updatedBooking.status === 'Cancelled') {
                    await cancelBookingReminders(updatedBooking._id.toString());
                    console.log(`✅ Cancelled all reminders for cancelled booking ${updatedBooking._id}`);
                }
            } catch (error) {
                console.error(`❌ Error managing reminders for booking ${updatedBooking._id}:`, error);
            }

            // Send notification about update
            const notificationTitle = 'Booking Updated!';
            const notificationBody = `Booking for ${clientName} on ${new Date(updatedBooking.bookingDate).toLocaleDateString()} has been updated.`;
            const notificationData = {
                screen: 'BookingDetail',
                id: updatedBooking._id.toString(),
            };

            const allRelevantUsers = await User.find({ role: { $in: ['staff', 'admin'] } });

            for (const userToNotify of allRelevantUsers) {
                if (userToNotify.expoPushToken && userToNotify._id.toString() !== req.user._id.toString()) {
                    await sendPushNotification({
                        expoPushToken: userToNotify.expoPushToken,
                        title: notificationTitle,
                        body: notificationBody,
                        data: notificationData,
                    });
                    await createNotification(userToNotify._id, notificationTitle, notificationBody, 'BookingDetail', updatedBooking._id);
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

            // Populate the updated booking before sending response
            const populatedUpdatedBooking = await Booking.findById(updatedBooking._id)
                .populate('client', 'name email phone')
                .populate('bookedBy', 'name email');

            res.json(populatedUpdatedBooking);
        } else {
            res.status(400);
            throw new Error('Invalid booking data');
        }
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
        // Cancel all reminders before deleting
        await cancelBookingReminders(booking._id.toString());
        console.log(`✅ Cancelled reminders for deleted booking ${booking._id}`);
        
        await Booking.deleteOne({ _id: booking._id });
        res.json({ message: 'Booking removed' });
    } else {
        res.status(404);
        throw new Error('Booking not found');
    }
});

// @desc    Get upcoming reminders
// @route   GET /api/bookings/reminders
// @access  Private (Admin/Staff)
const getReminders = asyncHandler(async (req, res) => {
    try {
        const jobs = await agenda.jobs({
            name: 'send booking reminder',
            nextRunAt: { $gte: new Date() },
        });

        console.log(`Found ${jobs.length} upcoming reminder jobs`);

        if (!jobs || jobs.length === 0) {
            return res.json([]);
        }

        const bookingIds = jobs.map(job => job.attrs.data.bookingId).filter(id => id);

        const bookings = await Booking.find({ _id: { $in: bookingIds } })
            .populate('client', 'name')
            .populate('bookedBy', 'name email');

        const bookingsMap = bookings.reduce((map, booking) => {
            map[booking._id.toString()] = booking;
            return map;
        }, {});

        const formattedReminders = jobs.map(job => {
            const booking = bookingsMap[job.attrs.data.bookingId];
            if (!booking) {
                return null;
            }
            return {
                _id: job.attrs._id.toString(),
                date: job.attrs.nextRunAt,
                message: `Reminder for ${booking.client ? booking.client.name : 'a client'}`,
                booking: booking,
                userIdToNotify: job.attrs.data.userIdToNotify
            };
        }).filter(reminder => reminder !== null);

        console.log(`Returning ${formattedReminders.length} formatted reminders`);
        res.json(formattedReminders);
    } catch (error) {
        console.error('Error getting reminders:', error);
        res.status(500).json({ error: 'Failed to get reminders' });
    }
});

// @desc    Debug agenda jobs
// @route   GET /api/bookings/debug/jobs
// @access  Private (Admin only)
const debugAgendaJobs = asyncHandler(async (req, res) => {
    try {
        const allJobs = await agenda.jobs({});
        const reminderJobs = await agenda.jobs({ name: 'send booking reminder' });
        
        const debugInfo = {
            totalJobs: allJobs.length,
            reminderJobs: reminderJobs.length,
            reminderJobsDetails: reminderJobs.map(job => ({
                id: job.attrs._id.toString(),
                name: job.attrs.name,
                nextRunAt: job.attrs.nextRunAt,
                lastRunAt: job.attrs.lastRunAt,
                data: job.attrs.data,
                failedAt: job.attrs.failedAt,
                failCount: job.attrs.failCount
            })),
            agendaStatus: 'running' // Basic check
        };
        
        res.json(debugInfo);
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ error: error.message });
    }
});

export {
    createBooking,
    getBookings,
    getBookingById,
    updateBooking,
    deleteBooking,
    getReminders,
    debugAgendaJobs
};