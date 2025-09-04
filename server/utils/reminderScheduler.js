import cron from 'node-cron';
import Booking from '../models/Booking.js';
import Client from '../models/Client.js'; // Import the Client model
import sendNotification from './notificationService.js';

const startReminderScheduler = () => {
    // Schedule to run every hour
    cron.schedule('0 * * * *', async () => {
        console.log('Running reminder check...');
        const now = new Date();
        const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        try {
            const upcomingBookings = await Booking.find({
                reminderDate: { $lte: fortyEightHoursFromNow, $gt: now },
                notificationSent: false, // Only fetch bookings for which a notification has not been sent
            }).populate('client'); // Populate the client details

            console.log('Upcoming bookings to notify:', upcomingBookings);

            for (const booking of upcomingBookings) {
                const clientName = booking.client ? booking.client.name : 'a client';
                console.log(`Sending reminder for booking ${booking._id} for client ${clientName}`);

                // Send notification to the user who booked it
                await sendNotification(
                    booking.bookedBy,
                    'Upcoming Booking Reminder',
                    `Your booking for ${clientName} on ${booking.bookingDate.toDateString()} is approaching!`,
                    { bookingId: booking._id } // Optional data payload
                );

                // After sending, update the booking to prevent re-sending
                booking.notificationSent = true;
                await booking.save();
                console.log(`Booking ${booking._id} marked as notification sent.`);
            }
        } catch (error) {
            console.error('Error in reminder scheduler:', error);
        }
    });
};

export default startReminderScheduler;