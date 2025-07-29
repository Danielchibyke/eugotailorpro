
import React, { useState, useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, setAuthLogoutCallback, useAuth } from './src/context/AuthContext'; // Import useAuth
import { NotificationProvider } from './src/context/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { RealmProvider } from './src/config/realmConfig';
import './src/config/firebaseConfig'; // Import Firebase initialization
import { setApiLogoutCallback } from './src/utils/api'; // Import setApiLogoutCallback

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Ionicons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
  });

  // Ref to store the logout function
  const logoutRef = useRef(null);

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

  // Set the logout callback once AuthProvider is mounted
  useEffect(() => {
    if (logoutRef.current) {
      setAuthLogoutCallback(logoutRef.current);
      setApiLogoutCallback(logoutRef.current); // Set the logout callback for the API interceptor
    }
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={async () => {
      await SplashScreen.hideAsync();
    }}>
      <RealmProvider
        fallback={() => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
          </View>
        )}
      >
        <AuthProvider>
          {/* Pass the logout function to a ref so it can be set globally */}
          <AuthContextConsumer>{({ logout }) => {
            logoutRef.current = logout;
            return null;
          }}</AuthContextConsumer>
          <NotificationProvider>
            <AppNavigator />
          </NotificationProvider>
        </AuthProvider>
      </RealmProvider>
    </View>
  );
}

// Helper component to access AuthContext within the render tree
const AuthContextConsumer = ({ children }) => {
  const auth = useAuth();
  return children(auth);
};