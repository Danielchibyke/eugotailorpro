import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../utils/notificationService';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const NotificationHandler = () => {
  const { user } = useAuth();
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    if (user) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          // Send the token to your backend
          api.post('/notifications/save-token', { expoPushToken: token, userId: user._id })
            .then(res => console.log('Push token saved on server:', res.data))
            .catch(err => console.error('Failed to save push token on server:', err));
        }
      });

      // This listener is fired whenever a notification is received while the app is foregrounded
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
        // You can add logic here to display an in-app notification or update UI
      });

      // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification tapped:', response);
        // You can add navigation logic here based on notification data
      });

      return () => {
        Notifications.removeNotificationSubscription(notificationListener.current);
        Notifications.removeNotificationSubscription(responseListener.current);
      };
    }
  }, [user]); // Run when user object changes (e.g., on login)

  return null; // This component doesn't render any UI directly
};

export default NotificationHandler;