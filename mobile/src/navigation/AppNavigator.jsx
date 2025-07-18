import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';

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

import { COLORS } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
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
                } else if (route.name === 'Bookings') {
                    iconName = focused ? 'calendar' : 'calendar-outline';
                } else if (route.name === 'Clients') {
                    iconName = focused ? 'people' : 'people-outline';
                } else if (route.name === 'Financials') {
                    iconName = focused ? 'cash' : 'cash-outline';
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
    </Tab.Navigator>
);

import TopNavbar from '../components/TopNavbar';
import { View } from 'react-native';
import NotificationHandler from '../components/NotificationHandler'; // Import NotificationHandler

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
        </Stack.Navigator>
    </View>
);

const AppNavigator = () => {
    const { user } = useAuth();
    console.log('AppNavigator user:', user);
    return (
        <NavigationContainer>
            {user ? <MainStack /> : <AuthStack />}
            <NotificationHandler />{/* Render NotificationHandler here */}
        </NavigationContainer>
    );
};

export default AppNavigator;