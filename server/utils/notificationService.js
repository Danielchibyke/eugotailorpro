import { Expo } from 'expo-server-sdk';

const expo = new Expo();

const sendPushNotification = async ({ expoPushToken, title, body, data, categoryId }) => {
    console.log(`🔔 Attempting to send push notification to token: ${expoPushToken}`);
    console.log(`📱 Notification details - Title: "${title}", Body: "${body}"`);

    if (!Expo.isExpoPushToken(expoPushToken)) {
        console.error(`❌ Push token ${expoPushToken} is not a valid Expo push token`);
        return { success: false, error: 'Invalid Expo push token' };
    }

    const message = {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data,
        categoryId,
    };

    console.log('📤 Sending push notification message:', JSON.stringify(message, null, 2));

    try {
        const tickets = await expo.sendPushNotificationsAsync([message]);
        console.log('✅ Notification ticket received:', tickets);

        let hasErrors = false;
        let successfulTickets = [];
        
        // Check for errors in the tickets
        tickets.forEach(ticket => {
            if (ticket.status === 'error') {
                hasErrors = true;
                console.error(`❌ Error sending notification:`, ticket.details);
                if (ticket.details && ticket.details.error === 'DeviceNotRegistered') {
                    console.error('📱 Device is not registered. Token should be removed from server.');
                }
            } else if (ticket.status === 'ok') {
                successfulTickets.push(ticket);
                console.log(`✅ Notification sent successfully with ID: ${ticket.id}`);
            }
        });

        // FIX: Always return a consistent response object
        const result = {
            success: !hasErrors,
            tickets: tickets,
            successfulTickets: successfulTickets,
            hasErrors: hasErrors
        };

     
        return result;

    } catch (error) {
        console.error(`💥 Error sending notification to token ${expoPushToken}:`, error);
        // FIX: Return consistent error response
        return { 
            success: false, 
            error: error.message,
            tickets: []
        };
    }
};

export { sendPushNotification };