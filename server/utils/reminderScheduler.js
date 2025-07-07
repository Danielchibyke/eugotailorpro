import cron from 'node-cron';
import Booking from '../models/Booking.js';
// import sendNotification from './notificationService.js'; // We'll create this later

const startReminderScheduler = () => {
    // Schedule to run every minute
    cron.schedule('* * * * *', async () => {
        console.log('Running reminder check...');
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000*48); // 48 hour from now

        try {
            const upcomingBookings = await Booking.find({
                reminderDate: { $lte: oneHourFromNow, $gt: now },
                // Add a flag to ensure notification is sent only once
                // e.g., notificationSent: false
            });
            console.log( upcomingBookings );

            for (const booking of upcomingBookings) {
                console.log(`Sending reminder for booking ${booking._id} for client ${booking.client}`);
                // In a real app, you'd send a notification here (e.g., email, SMS, push)
                // await sendNotification(booking.client, `Reminder: Your booking on ${booking.bookingDate.toDateString()} is approaching!`);

                // After sending, update the booking to prevent re-sending
                // booking.notificationSent = true;
                // await booking.save();
            }
        } catch (error) {
            console.error('Error in reminder scheduler:', error);
        }
    });
};

export default startReminderScheduler;
