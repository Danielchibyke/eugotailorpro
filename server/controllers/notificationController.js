import asyncHandler from 'express-async-handler';
import { Expo } from 'expo-server-sdk';
import User from '../models/User.js';

let expo = new Expo();

const sendPushNotification = asyncHandler(async (req, res) => {
    const { userId, title, body, data } = req.body;

    // Find the user and their push token(s)
    const user = await User.findById(userId);
    if (!user || !user.expoPushToken) {
        res.status(404);
        throw new Error('User not found or no push token registered.');
    }

    // Create the messages
    let messages = [];
    if (!Expo.isExpoPushToken(user.expoPushToken)) {
        console.error(`Push token ${user.expoPushToken} is not a valid Expo push token`);
        res.status(400);
        throw new Error('Invalid Expo push token.');
    }

    messages.push({
        to: user.expoPushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data, // Optional data to send with the notification
    });

    // Send the messages
    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];
    for (let chunk of chunks) {
        try {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            console.log(ticketChunk);
            tickets.push(...ticketChunk);
        } catch (error) {
            console.error(error);
        }
    }

    res.status(200).json({ message: 'Notification sent', tickets });
});

const savePushToken = asyncHandler(async (req, res) => {
    const { expoPushToken, userId } = req.body;

    const user = await User.findById(userId);

    if (user) {
        user.expoPushToken = expoPushToken;
        await user.save();
        res.status(200).json({ message: 'Push token saved successfully.' });
    } else {
        res.status(404);
        throw new Error('User not found.');
    }
});

export { sendPushNotification, savePushToken };