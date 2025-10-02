import React, { useEffect } from 'react';
import { registerForPushNotificationsAsync } from '../utils/notificationService';
import { getApi } from '../utils/api';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ClientsScreen from '../screens/ClientsScreen';
import AddClientScreen from '../screens/AddClientScreen';
import ClientDetailScreen from '../screens/ClientDetailScreen';
import BookingsScreen from '../screens/BookingsScreen';
import AddBookingScreen from '../screens/AddBookingScreen';
import BookingDetailScreen from '../screens/BookingDetailScreen';
import FinancialsScreen from '../screens/FinancialsScreen';
import CashBookScreen from '../screens/CashBookScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ViewMeasurementsScreen from '../screens/ViewMeasurementsScreen';
import AddEditMeasurementScreen from '../screens/AddEditMeasurementScreen';
import GalleryScreen from '../screens/GalleryScreen';
import MeasurementTemplatesScreen from '../screens/MeasurementTemplatesScreen';
import RemindersScreen from '../screens/RemindersScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

import ProtectedRoute from '../components/ProtectedRoute';

import { COLORS } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

import TopNavbar from '../components/TopNavbar';
import NotificationHandler from '../components/NotificationHandler';
import UserManagementScreen from '../screens/UserManagementScreen'; // Import the new screen

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
);

const MainTabs = () => (
    <Tab.Navigator
        screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused, color, size }) => {
                let iconName;

                if (route.name === 'Dashboard') {
                    iconName = focused ? 'home' : 'home-outline';
                }
                else if (route.name === 'Bookings') {
                    iconName = focused ? 'calendar' : 'calendar-outline';
                }
                else if (route.name === 'Clients') {
                    iconName = focused ? 'people' : 'people-outline';
                }
                else if (route.name === 'Financials') {
                    iconName = focused ? 'cash' : 'cash-outline';
                }
                else if (route.name === 'Gallery') {
                    iconName = focused ? 'images' : 'images-outline';
                }

                return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textMedium,
        })}
    >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Bookings" component={BookingsScreen} />
        <Tab.Screen name="Clients" component={ClientsScreen} />
        <Tab.Screen name="Financials" component={FinancialsScreen} />
        <Tab.Screen name="Gallery" component={GalleryScreen} />
    </Tab.Navigator>
);

const MainStack = () => (
    <View style={{ flex: 1 }}>
        <TopNavbar />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="AddClient" component={AddClientScreen} />
            <Stack.Screen name="ClientDetail" component={ClientDetailScreen} />
            <Stack.Screen name="AddBooking" component={AddBookingScreen} />
            <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
            <Stack.Screen name="CashBook" component={CashBookScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Register">
                {() => (
                    <ProtectedRoute allowedRoles={['admin']}>
                        <RegisterScreen />
                    </ProtectedRoute>
                )}
            </Stack.Screen>
            <Stack.Screen name="ViewMeasurements" component={ViewMeasurementsScreen} />
            <Stack.Screen name="AddEditMeasurement" component={AddEditMeasurementScreen} />
            <Stack.Screen name="MeasurementTemplates" component={MeasurementTemplatesScreen} />
            <Stack.Screen name="Gallery" component={GalleryScreen} />
            <Stack.Screen name="UserManagement" component={UserManagementScreen} />
            <Stack.Screen name="Reminders" component={RemindersScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            
        </Stack.Navigator>
    </View>
);

const AppNavigator = () => {
    const { user, loading } = useAuth();

    return (
        <NavigationContainer>
            {user ? <MainStack /> : <AuthStack />}
            <NotificationHandler />
        </NavigationContainer>
    );
};

export default AppNavigator;
