import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { theme } from '../styles/theme';

const { height } = Dimensions.get('window');

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notification, setNotification] = useState(null);
    const fadeAnim = useRef(new Animated.Value(0)).current; // Initial value for opacity: 0
    const slideAnim = useRef(new Animated.Value(-height)).current; // Initial value for slide: off-screen top

    const showNotification = useCallback((message, type = 'success') => {
        setNotification({ message, type });
        // Reset animation values before starting
        fadeAnim.setValue(0);
        slideAnim.setValue(-height);

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0, // Slide to top of screen
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setTimeout(() => {
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(slideAnim, {
                        toValue: -height, // Slide back off-screen top
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    setNotification(null);
                });
            }, 3000); // Notification visible for 3 seconds
        });
    }, [fadeAnim, slideAnim]);

    // Clear notification when component unmounts or notification changes unexpectedly
    useEffect(() => {
        return () => {
            fadeAnim.setValue(0);
            slideAnim.setValue(-height);
            if (notification) {
                setNotification(null);
            }
        };
    }, [notification, fadeAnim, slideAnim]);

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            {notification && (
                <Animated.View
                    style={[
                        styles.notification,
                        {
                            backgroundColor: notification.type === 'success' ? theme.COLORS.success : theme.COLORS.error,
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <Text style={styles.notificationText}>{notification.message}</Text>
                </Animated.View>
            )}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);

const styles = StyleSheet.create({
    notification: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: theme.SPACING.md,
        paddingTop: theme.SPACING.xxl,
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