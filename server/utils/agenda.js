import Agenda from 'agenda';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { sendPushNotification } from './notificationService.js';

const agenda = new Agenda({
  processEvery: '1 minute',
  maxConcurrency: 10,
});

// Define the reminder job
// In your agenda.js file, update the job definition:
agenda.define('send booking reminder', async (job) => {
    console.log('📨 Send booking reminder job started');
    const { bookingId, userIdToNotify } = job.attrs.data;
    console.log(`Agenda job 'send booking reminder' picked up for booking: ${bookingId}, user: ${userIdToNotify}`);

    try {
        const booking = await Booking.findById(bookingId)
            .populate('client', 'name')
            .populate('bookedBy');

        if (!booking) {
            console.log(`❌ Booking ${bookingId} not found, cancelling job.`);
            await job.remove();
            return;
        }

        // Check if booking is cancelled
        if (booking.status === 'Cancelled') {
            console.log(`❌ Booking ${bookingId} is cancelled, cancelling job.`);
            await job.remove();
            return;
        }

        // Check if delivery date has already passed
        const now = new Date();
        const deliveryDate = new Date(booking.deliveryDate);
        if (deliveryDate < now) {
            console.log(`📅 Delivery date for booking ${bookingId} has passed, cancelling job.`);
            await job.remove();
            return;
        }

        let userToNotifyFinal;
        if (userIdToNotify) {
            userToNotifyFinal = await User.findById(userIdToNotify);
        } else {
            // Fallback for old reminders or default reminders without a specific user
            userToNotifyFinal = booking.bookedBy;
        }

        console.log(`👤 User to notify: ${userToNotifyFinal ? userToNotifyFinal.email : 'NOT FOUND'}`);
        console.log(`📱 User push token: ${userToNotifyFinal ? userToNotifyFinal.expoPushToken : 'NO TOKEN'}`);
        
        if (userToNotifyFinal && userToNotifyFinal.expoPushToken) {
            const clientName = booking.client ? booking.client.name : 'a client';
            const deliveryDateFormatted = deliveryDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            const reminderBody = `Reminder: The booking for ${clientName} is due for delivery on ${deliveryDateFormatted}.`;

            console.log(`📲 Sending reminder for booking ${booking._id} to user ${userToNotifyFinal.email}`);
            
            const result = await sendPushNotification({
                expoPushToken: userToNotifyFinal.expoPushToken,
                title: 'Upcoming Delivery Reminder',
                body: reminderBody,
                data: { 
                    screen: 'BookingDetail', 
                    id: booking._id.toString(),
                    type: 'booking_reminder'
                },
            });

            if (result && result.success) {
                console.log(`✅ Reminder sent successfully for booking ${booking._id}`);
            } else {
                console.log(`❌ Failed to send reminder for booking ${booking._id}`);
            }
            
            // Remove the job after execution (success or failure)
            await job.remove();
        } else {
            console.log(`⚠️ Notification not sent for booking ${booking._id}:`, {
                userExists: !!userToNotifyFinal,
                hasToken: !!(userToNotifyFinal?.expoPushToken),
                userId: userToNotifyFinal?._id,
            });
            // Remove job if no user/token found
            await job.remove();
        }

    } catch (error) {
        console.error(`💥 Error processing reminder for booking ${bookingId}:`, error);
        
        // Implement retry logic
        const failedCount = job.attrs.failCount || 0;
        if (failedCount < 3) {
            const retryDelayMinutes = [5, 15, 30][failedCount] || 30;
            console.log(`🔄 Retrying job in ${retryDelayMinutes} minutes (attempt ${failedCount + 1})`);
            await job.schedule(`${retryDelayMinutes} minutes from now`);
            await job.save();
        } else {
            console.log(`💥 Job failed after 3 attempts, giving up`);
            await job.fail(error);
        }
    }
});
// Function to schedule reminder jobs
const scheduleBookingReminder = async (bookingId, reminderDate, userIdToNotify = null) => {
    try {
        // Validate inputs
        if (!bookingId) {
            throw new Error('bookingId is required');
        }
        
        if (!reminderDate || !(reminderDate instanceof Date)) {
            throw new Error('Valid reminderDate is required');
        }

        // Don't schedule reminders for past dates
        if (reminderDate <= new Date()) {
            console.log(`⏰ Not scheduling reminder for past date: ${reminderDate}`);
            return null;
        }

        // Cancel any existing reminders for this booking to avoid duplicates
        await agenda.cancel({
            name: 'send booking reminder',
            'data.bookingId': bookingId
        });

        const jobData = {
            bookingId,
            userIdToNotify,
            scheduledAt: new Date().toISOString(),
            reminderDate: reminderDate.toISOString()
        };

        const job = await agenda.schedule(reminderDate, 'send booking reminder', jobData);

        console.log(`✅ Reminder scheduled for booking ${bookingId} at ${reminderDate}${userIdToNotify ? ` for user ${userIdToNotify}` : ''}`);
        return job;
    } catch (error) {
        console.error('❌ Failed to schedule reminder:', error);
        throw error;
    }
};

// Function to cancel reminder jobs when booking is deleted or cancelled
const cancelBookingReminders = async (bookingId) => {
    try {
        if (!bookingId) {
            throw new Error('bookingId is required');
        }

        const result = await agenda.cancel({
            name: 'send booking reminder',
            'data.bookingId': bookingId
        });
        
        console.log(`🗑️ Cancelled ${result} reminder jobs for booking ${bookingId}`);
        return result;
    } catch (error) {
        console.error('❌ Failed to cancel reminders:', error);
        throw error;
    }
};

// Function to get scheduled reminders for a booking
const getScheduledReminders = async (bookingId) => {
    try {
        const jobs = await agenda.jobs({
            name: 'send booking reminder',
            'data.bookingId': bookingId
        });
        
        return jobs;
    } catch (error) {
        console.error('❌ Failed to get scheduled reminders:', error);
        throw error;
    }
};

// Start Agenda
const startAgenda = async (mongoUri) => {
    try {
        console.log('🚀 Starting Agenda...');
        
        if (!mongoUri) {
            throw new Error('MongoDB connection URI is required');
        }

        await agenda.database(mongoUri, 'agendaJobs');
        
        // Wait for agenda to be ready
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Agenda startup timeout'));
            }, 30000);

            agenda.on('ready', () => {
                clearTimeout(timeout);
                resolve();
            });
            
            agenda.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
        
        await agenda.start();
        console.log('✅ Agenda started successfully');
        
        // Clean up any stuck jobs on startup
        const stuckJobs = await agenda.cancel({ 
            nextRunAt: { $exists: true }, 
            lockedAt: { $exists: true },
            lastFinishedAt: null 
        });
        
        console.log(`🧹 Cleaned up ${stuckJobs} stuck jobs on startup`);
        
        return agenda;
    } catch (error) {
        console.error('❌ Failed to start Agenda:', error);
        throw error;
    }
};

// Graceful shutdown
const gracefulShutdown = async () => {
    console.log('🛑 Stopping Agenda gracefully...');
    try {
        await agenda.stop();
        console.log('✅ Agenda stopped gracefully');
    } catch (error) {
        console.error('❌ Error during Agenda shutdown:', error);
        throw error;
    }
};

// Health check function
const getAgendaStatus = async () => {
    try {
        const runningJobs = await agenda.jobs({ nextRunAt: { $exists: true } });
        const failedJobs = await agenda.jobs({ lastRunAt: { $exists: true }, lastFinishedAt: null });
        
        return {
            status: 'healthy',
            runningJobs: runningJobs.length,
            failedJobs: failedJobs.length,
            totalJobs: runningJobs.length + failedJobs.length
        };
    } catch (error) {
        return {
            status: 'error',
            error: error.message
        };
    }
};

export { 
    agenda, 
    startAgenda, 
    gracefulShutdown, 
    scheduleBookingReminder, 
    cancelBookingReminders,
    getScheduledReminders,
    getAgendaStatus
};