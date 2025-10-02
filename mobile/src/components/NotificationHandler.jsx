import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from '../utils/notificationService';
import { useAuth } from '../context/AuthContext';
import { getApi } from '../utils/api';
import { useNavigation } from '@react-navigation/native';
import { useNotification } from '../context/NotificationContext';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log('📱 Notification received in handler:', notification);
    
    // Show alert when app is in foreground
    return {
      shouldShowAlert: true, // This shows the native notification even in foreground
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

Notifications.setNotificationCategoryAsync('booking_reminder', [
  {
    identifier: 'view_booking',
    buttonTitle: 'View Booking',
    options: {
      opensAppToForeground: true,
    },
  },
]);

const NotificationHandler = () => {
  const { user, loading } = useAuth();
  const navigation = useNavigation();
  const { showNotification } = useNotification();
  const responseListener = useRef();
  const receivedListener = useRef();

  useEffect(() => {
    console.log('🔔 NotificationHandler mounted');

    // Request permissions on component mount
    const setupNotifications = async () => {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.log('❌ Notification permissions not granted');
          return;
        }
        
        console.log('✅ Notification permissions granted');
      } catch (error) {
        console.error('💥 Error setting up notifications:', error);
      }
    };

    setupNotifications();

    // Listener for when notifications are received while app is foregrounded
    receivedListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📥 Notification received (foreground):', notification);
      
      // Show our custom in-app notification banner
      if (notification.request.content.body) {
        showNotification(notification.request.content.body, 'info');
      }
    });

    // Listener for when a user taps on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      const { screen, id, type } = response.notification.request.content.data;
      
      if (screen && navigation) {
        console.log(`🔄 Navigating to ${screen} with id: ${id}`);
        if (id) {
          navigation.navigate(screen, { id });
        } else {
          navigation.navigate(screen);
        }
      }
    });

    // This part runs when the user logs in
    if (!loading && user) {
      const managePushToken = async () => {
        try {
          console.log('🔑 User logged in, managing push token...');
          const token = await registerForPushNotificationsAsync();
          
          if (!token) {
            console.log('❌ No push token available');
            return;
          }

          const storedToken = await AsyncStorage.getItem('expoPushToken');
          console.log(`📱 New token: ${token}, Stored token: ${storedToken}`);

          if (token !== storedToken) {
            console.log(`🔄 New or updated push token, updating server...`);
            try {
              await getApi().put('/auth/update-pushtoken', { expoPushToken: token });
              await AsyncStorage.setItem('expoPushToken', token);
              console.log('✅ Push token updated successfully');
            } catch (err) {
              console.error('❌ Failed to update push token on server:', err.response?.data || err.message);
            }
          } else {
            console.log('✅ Push token is up to date');
          }
        } catch (err) {
          console.error('💥 Failed to manage push token:', err);
        }
      };

      managePushToken();
    }

    return () => {
      console.log('🔔 NotificationHandler unmounted');
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      if (receivedListener.current) {
        Notifications.removeNotificationSubscription(receivedListener.current);
      }
    };
  }, [user, loading, navigation, showNotification]);

  return null;
};

export default NotificationHandler;