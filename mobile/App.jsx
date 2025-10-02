
import React, { useState, useEffect, useRef } from 'react';
import { ActivityIndicator, View, Text,  } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext'; // Import useAuth
import { NotificationProvider, useNotification } from './src/context/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeOfflineManager } from './src/utils/offlineManager';
import { setNotificationHandler } from './src/utils/api'; // Import setNotificationHandler
import './src/config/firebaseConfig'; // Import Firebase initialization
import * as SplashScreen from 'expo-splash-screen'
import { useFonts } from 'expo-font';

import ErrorBoundary from './src/utils/ErrorBoundary';
import Notification from './src/components/Notification'; // Import Notification component

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const AppContent = () => {
  const { showNotification } = useNotification();

  useEffect(() => {
    initializeOfflineManager(showNotification);
  }, [showNotification]);

  useEffect(() => {
    setNotificationHandler(showNotification);
  }, [showNotification]);

  return <AppNavigator />;
}

const AppRoot = () => {
  const { notification } = useNotification();
  return (
    <View style={{ flex: 1 }}>
      <AuthProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </AuthProvider>
      {notification && <Notification message={notification.message} type={notification.type} />}
    </View>
  );
}

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
    <NotificationProvider>
      <AppRoot />
    </NotificationProvider>
  );
}