import { Expo } from 'expo-server-sdk';
import User from '../models/User.js';

const expo = new Expo();

const sendNotification = async (userId, title, body, data) => {
    try {
        const user = await User.findById(userId);
        if (!user || !user.expoPushToken) {
            console.log(`User ${userId} not found or has no push token.`);
            return;
        }

        const pushToken = user.expoPushToken;

        if (!Expo.isExpoPushToken(pushToken)) {
            console.error(`Push token ${pushToken} is not a valid Expo push token`);
            return;
        }

        const message = {
            to: pushToken,
            sound: 'default',
            title,
            body,
            data,
        };

        await expo.sendPushNotificationsAsync([message]);
        console.log(`Notification sent to user ${userId}`);
    } catch (error) {
        console.error('Error sending notification:', error);
    }
};

export default sendNotification;
