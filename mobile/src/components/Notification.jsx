import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

const Notification = ({ message, type }) => {
    if (!message) {
        return null;
    }

    const iconName = type === 'success' ? 'checkmark-circle' : 'information-circle';
    const backgroundColor = type === 'success' ? theme.COLORS.success : theme.COLORS.error;

    return (
        <View
            style={[
                styles.notification,
                { backgroundColor: backgroundColor },
            ]}
        >
            <Ionicons name={iconName} size={24} color={theme.COLORS.textLight} style={styles.icon} />
            <Text style={styles.notificationText}>{message}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    notification: {
        position: 'absolute',
        left: 20,
        right: 20,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        zIndex: 1000,
        flexDirection: 'row', // Arrange icon and text horizontally
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    icon: {
        marginRight: theme.SPACING.sm,
    },
    notificationText: {
        color: theme.COLORS.textLight,
        textAlign: 'center',
        fontWeight: 'bold',
        flexShrink: 1, // Allow text to wrap
    },
});

export default Notification;
