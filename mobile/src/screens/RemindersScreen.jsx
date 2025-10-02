
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { getUserEffectivePermissions, PERMISSIONS } from '../config/permissions';

const ReminderCard = ({ reminder, onPress }) => {
    const { booking } = reminder;
    const clientName = booking?.client?.name || 'No Client';
    const deliveryDate = booking?.deliveryDate;
    const reminderDate = reminder?.date;

    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={styles.cardIcon}>
                <Ionicons name="notifications-outline" size={24} color={theme.COLORS.primary} />
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Reminder for {clientName}</Text>
                {deliveryDate && (
                    <Text style={styles.cardText}>
                        Delivery Date: {dayjs(deliveryDate).format('MMM D, YYYY')}
                    </Text>
                )}
                {reminderDate && (
                    <Text style={styles.cardText}>
                        Reminder Date: {dayjs(reminderDate).format('MMM D, YYYY')}
                    </Text>
                )}
                {reminder.message && (
                    <Text style={styles.cardMessage}>{reminder.message}</Text>
                )}
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.COLORS.textMedium} />
        </TouchableOpacity>
    );
};

const RemindersScreen = ({ navigation }) => {
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const { user, refreshUser } = useAuth();

    const permissions = useMemo(() => getUserEffectivePermissions(user), [user]);
    const canViewBookings = permissions.includes(PERMISSIONS.BOOKINGS_VIEW);

    const fetchReminders = useCallback(async () => {
        if (!canViewBookings) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            // This endpoint doesn't exist yet, we will create it.
            const { data } = await getApi().get('/bookings/reminders');
            setReminders(data);
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to fetch reminders.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification, canViewBookings]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            refreshUser();
        });
        return unsubscribe;
    }, [navigation, refreshUser]);

    useEffect(() => {
        if (canViewBookings) {
            fetchReminders();
        }
    }, [canViewBookings, fetchReminders]);

    const renderItem = ({ item }) => (
        <ReminderCard
            reminder={item}
            onPress={() => navigation.navigate('BookingDetail', { id: item.booking._id })}
        />
    );

    if (!canViewBookings) {
        return (
            <BackgroundContainer>
                <View style={styles.loadingContainer}>
                    <Text style={styles.emptyStateText}>Access Denied</Text>
                    <Text style={styles.emptyStateSubText}>You do not have permission to view reminders.</Text>
                </View>
            </BackgroundContainer>
        );
    }

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
                <Text style={styles.headerTitle}>Upcoming Reminders</Text>
            </View>
            <FlatList
                data={reminders}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyStateContainer}>
                        <Text style={styles.emptyStateText}>No upcoming reminders.</Text>
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
    emptyStateSubText: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textMedium,
        marginTop: theme.SPACING.xs,
        textAlign: 'center',
    },
    card: {
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.md,
        padding: theme.SPACING.md,
        marginBottom: theme.SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
        ...theme.SHADOWS.sm,
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
    cardText: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textMedium,
        marginTop: theme.SPACING.xs,
    },
    cardMessage: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textDark,
        fontStyle: 'italic',
        marginTop: theme.SPACING.sm,
    },
});

export default RemindersScreen;
