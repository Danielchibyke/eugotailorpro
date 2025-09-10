
import cron from 'node-cron';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { sendPushNotification } from './notificationService.js';

const startReminderScheduler = () => {
    // Schedule to run every hour
    cron.schedule('0 * * * *', async () => {
        console.log('Running reminder check...');
        const now = new Date();
        const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        try {
            const upcomingBookings = await Booking.find({
                reminderDate: { $lte: fortyEightHoursFromNow, $gt: now },
                notificationSent: { $ne: true }, // Ensure we don't send it again
            }).populate('client', 'name');

            if (upcomingBookings.length > 0) {
                console.log(`Found ${upcomingBookings.length} upcoming bookings to notify.`);
            }

            for (const booking of upcomingBookings) {
                const clientName = booking.client ? booking.client.name : 'a client';
                
                const userToNotify = await User.findById(booking.bookedBy);

                if (userToNotify && userToNotify.expoPushToken) {
                    console.log(`Sending reminder for booking ${booking._id} to user ${userToNotify.email}`);
                    await sendPushNotification({
                        expoPushToken: userToNotify.expoPushToken,
                        title: 'Upcoming Booking Reminder',
                        body: `Your booking for ${clientName} on ${booking.bookingDate.toDateString()} is approaching!`,
                        data: { screen: 'BookingDetail', id: booking._id.toString() },
                    });

                    booking.notificationSent = true;
                    await booking.save();
                    console.log(`Booking ${booking._id} marked as notification sent.`);
                } else {
                    console.log(`User for booking ${booking._id} not found or has no push token.`);
                }
            }
        } catch (error) {
            console.error('Error in reminder scheduler:', error);
        }
    });
};

export default startReminderScheduler;
