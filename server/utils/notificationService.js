import { Expo } from 'expo-server-sdk';

const expo = new Expo();

const sendPushNotification = async ({ expoPushToken, title, body, data }) => {
    if (!Expo.isExpoPushToken(expoPushToken)) {
        console.error(`Push token ${expoPushToken} is not a valid Expo push token`);
        return;
    }

    const message = {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data,
    };

    try {
        await expo.sendPushNotificationsAsync([message]);
        console.log(`Notification sent to token ${expoPushToken}`);
    } catch (error) {
        console.error(`Error sending notification to token ${expoPushToken}:`, error);
    }
};

export { sendPushNotification };