import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from '../utils/notificationService';
import { useAuth } from '../context/AuthContext';
import { getApi } from '../utils/api';
import { useNavigation } from '@react-navigation/native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const NotificationHandler = () => {
  const { user, loading } = useAuth();
  const navigation = useNavigation();
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    if (!loading && user) {
      const managePushToken = async () => {
        try {
          const newPushToken = await registerForPushNotificationsAsync();
          if (!newPushToken) return; // Exit if no token could be generated

          const currentToken = await AsyncStorage.getItem('expoPushToken');

          if (newPushToken !== currentToken) {
            console.log(`New or updated push token [${newPushToken}], updating server.`);
            await getApi().put('/auth/update-pushtoken', { expoPushToken: newPushToken });
            await AsyncStorage.setItem('expoPushToken', newPushToken);
            console.log('Successfully saved new push token.');
          } else {
            console.log('Push token is already up-to-date.');
          }
        } catch (err) {
          console.error('Failed to manage push token:', err.response?.data || err.message);
        }
      };

      managePushToken();

      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received while app is foregrounded:', notification);
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification tapped:', response);
        const { screen, id } = response.notification.request.content.data;
        if (screen && navigation) {
          const mainTabsScreens = ['Dashboard', 'Bookings', 'Clients', 'Financials', 'Gallery'];
          if (mainTabsScreens.includes(screen)) {
            navigation.navigate('MainTabs', { screen, params: { id } });
          } else {
            navigation.navigate(screen, { id });
          }
        }
      });

      Notifications.getLastNotificationResponseAsync().then(response => {
        if (response) {
          console.log('App launched by notification:', response);
          const { screen, id } = response.notification.request.content.data;
          if (screen && navigation) {
            setTimeout(() => {
              const mainTabsScreens = ['Dashboard', 'Bookings', 'Clients', 'Financials', 'Gallery'];
              if (mainTabsScreens.includes(screen)) {
                navigation.navigate('MainTabs', { screen, params: { id } });
              } else {
                navigation.navigate(screen, { id });
              }
            }, 1000);
          }
        }
      });

      return () => {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
      };
    }
  }, [user, loading, navigation]);

  return null;
};

export default NotificationHandler;