
import React, { useState, useEffect, useRef } from 'react';
import { ActivityIndicator, View, Text,  } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext'; // Import useAuth
import { NotificationProvider, useNotification } from './src/context/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeOfflineManager } from './src/utils/offlineManager';
import './src/config/firebaseConfig'; // Import Firebase initialization
import * as SplashScreen from 'expo-splash-screen'
import { useFonts } from 'expo-font';

import ErrorBoundary from './src/utils/ErrorBoundary';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const AppContent = () => {
  const { showNotification } = useNotification();

  useEffect(() => {
    initializeOfflineManager(showNotification);
  }, [showNotification]);

  return <AppNavigator />;
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
    <View style={{ flex: 1 }} onLayout={async () => {
      await SplashScreen.hideAsync();
    }}>
        <NotificationProvider>
          <AuthProvider>
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
          </AuthProvider>
        </NotificationProvider>
    </View>
  );
}