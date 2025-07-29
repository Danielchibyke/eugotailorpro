import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import messaging, { getMessaging } from '@react-native-firebase/messaging';
import { registerForPushNotificationsAsync } from '../utils/notificationService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext'; // Import useNotification
import api from '../utils/api';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation

const NotificationHandler = () => {
  const { user, loading } = useAuth(); // Get loading state from useAuth
  const { showNotification } = useNotification(); // Use the hook
  const navigation = useNavigation(); // Get navigation object

  useEffect(() => {
    console.log('NotificationHandler useEffect: user status', user ? 'defined' : 'undefined', 'loading:', loading);
    if (!loading && user && api.defaults.headers.common['Authorization']) { // Only proceed if not loading, user is defined, and auth header is set
      registerForPushNotificationsAsync().then(token => {
        // console.log('Generated FCM Push Token:', token);
        if (token) {
          // Send the token to your backend
          api.post('/notifications/save-token', { expoPushToken: token, userId: user._id }) // Keep expoPushToken field name for now
            .then(res => console.log('FCM token saved on server'))
            .catch(err => console.error('Failed to save FCM token on server:', err.response?.data || err.message));
        }
      });

      // Handle foreground messages
      const unsubscribeOnMessage = getMessaging().onMessage(async remoteMessage => {
        // console.log('FCM Message received in foreground:', remoteMessage);
        // Display in-app notification
        showNotification(remoteMessage.notification.title + ': ' + remoteMessage.notification.body);
      });

      // Handle messages when the app is in the background or quit and opened by tapping a notification
      const unsubscribeOnNotificationOpenedApp = getMessaging().onNotificationOpenedApp(remoteMessage => {
        // console.log('FCM Notification opened app from background state:', remoteMessage);
        const { screen, id } = remoteMessage.data || {};
        if (screen && navigation) {
          const mainTabsScreens = ['Dashboard', 'Bookings', 'Clients', 'Financials'];
          if (mainTabsScreens.includes(screen)) {
            navigation.navigate('MainTabs', { screen: screen, params: { id } });
          } else {
            navigation.navigate(screen, { id });
          }
        } else if (navigation) {
          navigation.navigate('MainTabs', { screen: 'Dashboard' });
        }
      });

      // Check if app was opened from a quit state by a notification
      getMessaging().getInitialNotification().then(remoteMessage => {
        if (remoteMessage) {
          // console.log('FCM Notification opened app from quit state:', remoteMessage);
          const { screen, id } = remoteMessage.data || {};
          if (screen && navigation) {
            const mainTabsScreens = ['Dashboard', 'Bookings', 'Clients', 'Financials'];
            if (mainTabsScreens.includes(screen)) {
              navigation.navigate('MainTabs', { screen: screen, params: { id } });
            } else {
              navigation.navigate(screen, { id });
            }
          } else if (navigation) {
            navigation.navigate('MainTabs', { screen: 'Dashboard' });
          }
        }
      });

      return () => {
        unsubscribeOnMessage();
        unsubscribeOnNotificationOpenedApp();
      };
    }
  }, [user, loading, showNotification, navigation]); // Add loading to dependency array

  return null; // This component doesn't render any UI directly
};

export default NotificationHandler;