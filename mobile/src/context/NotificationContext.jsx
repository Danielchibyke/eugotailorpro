import React, { createContext, useState, useContext } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '../styles/theme';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notification, setNotification] = useState(null);
    const fadeAnim = useState(new Animated.Value(0))[0];

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setTimeout(() => {
                hideNotification();
            }, 3000);
        });
    };

    const hideNotification = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setNotification(null);
        });
    };

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
        marginTop: 40,
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        zIndex: 1000,
    },
    notificationText: {
        color: '#fff',
        textAlign: 'center',
    },
});