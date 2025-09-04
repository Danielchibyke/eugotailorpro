import asyncHandler from 'express-async-handler';
import admin from 'firebase-admin';
import User from '../models/User.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (error) {
        console.error('Failed to initialize Firebase Admin SDK:', error);
        process.exit(1);
    }
}

// Utility function to send a push notification
const sendPushNotification = async ({ expoPushToken, title, body, data }) => {
    const message = {
        token: expoPushToken,
        notification: {
            title: title,
            body: body,
        },
        data: data || {}, // Optional data to send with the notification
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);
        return { success: true, response };
    } catch (error) {
        console.error('Error sending message:', error);
        return { success: false, error: error.message };
    }
};

// Express route handler to save push token (still needs req, res)
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