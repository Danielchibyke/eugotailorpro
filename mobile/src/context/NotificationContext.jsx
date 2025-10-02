import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../styles/theme';
import { getApi } from '../utils/api'; // Import getApi

const { height } = Dimensions.get('window');

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notification, setNotification] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0); // New state for unread count

    const api = getApi(); // Get the API instance

    const fetchUnreadCount = useCallback(async () => {
        try {
            const { data } = await api.get('/notifications');
            const count = data.filter(n => !n.read).length;
            setUnreadCount(count);
        } catch (error) {
            console.error('Failed to fetch unread notifications count:', error);
        }
    }, [api]);

    const showNotification = useCallback((message, type = 'success') => {
        setNotification({ message, type });

        setTimeout(() => {
            setNotification(null);
        }, 5000); // Notification visible for 5 seconds
    }, []);

    // Clear notification when component unmounts or notification changes unexpectedly
    useEffect(() => {
        return () => {
            if (notification) {
                setNotification(null);
            }
        };
    }, [notification]);

    // Fetch unread count on initial load
    useEffect(() => {
        fetchUnreadCount();
    }, [fetchUnreadCount]);

    return (
        <NotificationContext.Provider value={{ notification, showNotification, unreadCount, fetchUnreadCount }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);

const styles = StyleSheet.create({
    notification: {
        position: 'absolute',
        left: 0,
        right: 0,
        padding: theme.SPACING.md,
        height: 80, // Fixed height
        borderRadius: theme.BORDERRADIUS.sm,
        zIndex: 1000,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    notificationText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: 'bold',
    },
});