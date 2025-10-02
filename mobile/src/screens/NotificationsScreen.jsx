
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

import BackgroundContainer from '../components/BackgroundContainer';
import { useNotification } from '../context/NotificationContext';
import { getApi } from '../utils/api';
import { theme } from '../styles/theme';

const NotificationCard = ({ notification, onPress, onMarkAsRead }) => {
    return (
        <TouchableOpacity style={[styles.card, !notification.read && styles.unreadCard]} onPress={onPress}>
            <View style={styles.cardIcon}>
                <Ionicons name={notification.read ? "mail-open-outline" : "mail-unread-outline"} size={24} color={theme.COLORS.primary} />
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{notification.title}</Text>
                <Text style={styles.cardMessage}>{notification.message}</Text>
                <Text style={styles.cardDate}>{dayjs(notification.createdAt).format('MMM D, YYYY, h:mm A')}</Text>
            </View>
            {!notification.read && (
                <TouchableOpacity onPress={onMarkAsRead} style={styles.markAsReadButton}>
                    <Ionicons name="checkmark-circle" size={24} color={theme.COLORS.success} />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
};

const NotificationsScreen = ({ navigation }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showNotification, fetchUnreadCount } = useNotification(); // Get fetchUnreadCount from context
    const api = getApi();

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data);
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to fetch notifications.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification, api]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', fetchNotifications);
        return unsubscribe;
    }, [navigation, fetchNotifications]);

    const handleMarkAsRead = async (notificationId) => {
        try {
            await api.put(`/notifications/${notificationId}/read`);
            setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, read: true } : n));
            fetchUnreadCount(); // Update global unread count after marking as read
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to mark notification as read.', 'error');
        }
    };

    const handleNotificationPress = (notification) => {
        if (notification.screen && notification.itemId) {
            navigation.navigate(notification.screen, { id: notification.itemId });
        }
        if (!notification.read) {
            handleMarkAsRead(notification._id);
        }
    };

    const renderItem = ({ item }) => (
        <NotificationCard
            notification={item}
            onPress={() => handleNotificationPress(item)}
            onMarkAsRead={() => handleMarkAsRead(item._id)}
        />
    );

    if (loading) {
        return (
            <BackgroundContainer>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.COLORS.primary} />
                </View>
            </BackgroundContainer>
        );
    }

    return (
        <BackgroundContainer>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Notifications</Text>
            </View>
            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyStateContainer}>
                        <Text style={styles.emptyStateText}>No notifications.</Text>
                    </View>
                }
            />
        </BackgroundContainer>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: theme.COLORS.primary,
        padding: theme.SPACING.lg,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTitle: {
        fontSize: theme.FONT_SIZES.h2,
        fontWeight: 'bold',
        color: theme.COLORS.textLight,
        textAlign: 'center',
    },
    list: {
        padding: theme.SPACING.md,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyStateText: {
        fontSize: theme.FONT_SIZES.lg,
        color: theme.COLORS.textMedium,
    },
    card: {
        backgroundColor: theme.COLORS.lightGray,
        borderRadius: theme.BORDERRADIUS.md,
        padding: theme.SPACING.md,
        marginBottom: theme.SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
        ...theme.SHADOWS.sm,
    },
    unreadCard: {
        backgroundColor: theme.COLORS.white,
        borderLeftWidth: 4,
        borderLeftColor: theme.COLORS.primary,
    },
    cardIcon: {
        marginRight: theme.SPACING.md,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: theme.FONT_SIZES.lg,
        fontWeight: 'bold',
        color: theme.COLORS.textDark,
    },
    cardMessage: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textDark,
        marginTop: theme.SPACING.xs,
    },
    cardDate: {
        fontSize: theme.FONT_SIZES.sm,
        color: theme.COLORS.textMedium,
        marginTop: theme.SPACING.sm,
    },
    markAsReadButton: {
        marginLeft: theme.SPACING.md,
    },
});

export default NotificationsScreen;
