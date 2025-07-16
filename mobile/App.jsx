
import React, { useState, useEffect } from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
import * as Notifications from 'expo-notifications';
import NotificationHandler from './src/components/NotificationHandler'; // Import the new component

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Set up notification handler for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [fontsLoaded] = useFonts({
    'Ionicons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={async () => {
      await SplashScreen.hideAsync();
    }}>
      <AuthProvider>
        <NotificationProvider>
          <AppNavigator />
          <NotificationHandler />{/* Render the NotificationHandler here */}
        </NotificationProvider>
      </AuthProvider>
    </View>
  );
}