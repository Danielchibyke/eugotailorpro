import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import BackgroundContainer from '../components/BackgroundContainer';
import BookingCard from '../components/BookingCard';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';
import { useDashboardData } from '../hooks/useDashboardData';
import { getApi } from '../utils/api';


const StatCard = ({ icon, label, value, color, onPress, fullWidth }) => (
    <TouchableOpacity style={[styles.statCard, fullWidth && styles.fullWidthStatCard]} onPress={onPress}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
            <Ionicons name={icon} size={24} color={theme.COLORS.textLight} />
        </View>
        <View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    </TouchableOpacity>
);

const QuickActionButton = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
        <Ionicons name={icon} size={28} color={theme.COLORS.primary} />
        <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
);

const DashboardScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { stats, recentBookings, loading, error, refresh } = useDashboardData();
    const { showNotification } = useNotification();
    const api = getApi();

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', refresh);
        return unsubscribe;
    }, [navigation, refresh]);

    const handleEditBooking = useCallback((booking) => {
        navigation.navigate('AddBooking', { booking: booking });
    }, [navigation]);

    const handleDeleteBooking = useCallback(async (item) => {
        Alert.alert(
            'Delete Booking',
            'Are you sure you want to delete this booking?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/bookings/${item._id}`);
                            // setRecentBookings(prev => prev.filter(b => b._id !== item._id)); // This will be handled by the refresh
                            showNotification('Booking deleted successfully!', 'success');
                            refresh(); // Refresh data after deletion
                        } catch (err) {
                            showNotification(err.response?.data?.msg || 'Failed to delete booking.', 'error');
                        }
                    },
                },
            ],
        );
    }, [showNotification, refresh, api]);

    const handleCompleteBooking = useCallback(async (item) => {
        try {
            const updatedBooking = { ...item, status: 'Completed' };
            await api.put(`/bookings/${item._id}`, updatedBooking);
            // setRecentBookings(prev => prev.map(b => b._id === item._id ? updatedBooking : b)); // This will be handled by the refresh
            showNotification('Booking marked as completed!', 'success');
            refresh(); // Refresh data after completion
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to update booking status.', 'error');
        }
    }, [showNotification, refresh, api]);

    const renderBookingCard = useCallback(({ item }) => (
        <BookingCard
            booking={item}
            onView={() => navigation.navigate('BookingDetail', { bookingId: item._id })}
            onEdit={() => handleEditBooking(item)}
            onDelete={() => handleDeleteBooking(item)}
            onComplete={() => handleCompleteBooking(item)}
        />
    ), [navigation, handleEditBooking, handleDeleteBooking, handleCompleteBooking]);

    return (
        <BackgroundContainer>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={refresh}
                        tintColor={theme.COLORS.primary}
                    />
                }
            >
                <View style={styles.header}>
                    <Text style={styles.headerGreeting}>Hello, {user && user.name ? user.name : 'User'}!</Text>
                    <Text style={styles.headerSlogan}>🙌🙌</Text>
                </View>

                <View style={styles.statsGrid}>
                    <StatCard icon="briefcase-outline" label="Total Bookings" value={stats.totalBookings} color={theme.COLORS.primary} onPress={() => navigation.navigate('Bookings')} />
                    <StatCard icon="time-outline" label="Pending" value={stats.pendingBookings} color={theme.COLORS.accent} onPress={() => navigation.navigate('Bookings')} />
                    <StatCard icon="people-outline" label="Total Clients" value={stats.totalClients} color={theme.COLORS.darkPrimary} onPress={() => navigation.navigate('Clients')}  fullWidth={true}/>
                    <StatCard icon="cash-outline" label="Revenue" value={`₦${stats.totalRevenue.toFixed(2)}`} color={theme.COLORS.success} onPress={() => navigation.navigate('Financials')} fullWidth={true} />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.quickActionsGrid}>
                        <QuickActionButton icon="add-circle-outline" label="New Booking" onPress={() => navigation.navigate('AddBooking')} />
                        <QuickActionButton icon="person-add-outline" label="New Client" onPress={() => navigation.navigate('AddClient')} />
                        <QuickActionButton icon="swap-horizontal-outline" label="Add Transaction" onPress={() => navigation.navigate('Financials', { openModal: true })} />
                        {user?.role === 'admin' && (
                            <QuickActionButton icon="person-add-outline" label="Register User" onPress={() => navigation.navigate('Register')} />
                        )}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    {recentBookings.length > 0 ? (
                        <FlatList
                            data={recentBookings}
                            renderItem={renderBookingCard}
                            keyExtractor={(item) => item._id}
                            scrollEnabled={false}
                        />
                    ) : (
                        <Text style={styles.emptyStateText}>No recent bookings to show.</Text>
                    )}
                </View>
            </ScrollView>
        </BackgroundContainer>
    );
};
const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.COLORS.backgroundApp,
    },
    content: {
        paddingBottom: 10,
    },
    header: {
        backgroundColor: theme.COLORS.primary,
        paddingHorizontal: theme.SPACING.lg,
        paddingTop: theme.SPACING.sm,
        paddingBottom: theme.SPACING.xl,
        borderBottomLeftRadius: theme.BORDERRADIUS.xxxl,
        borderBottomRightRadius: theme.BORDERRADIUS.xxxl,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.SPACING.md,
    },
    headerGreeting: {
        fontSize: theme.FONT_SIZES.h1,
        fontWeight: 'bold',
        color: theme.COLORS.textLight,
    },
    headerSlogan: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textLight,
        marginTop: theme.SPACING.xs,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        paddingHorizontal: theme.SPACING.sm,
        marginTop: -theme.SPACING.xxl, // Overlap header
        marginBottom: theme.SPACING.md,
    },
    statCard: {
        width: '45%', // Slightly smaller width
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.sm, // Smaller border radius
        padding: theme.SPACING.sm, // Reduced padding
        marginBottom: theme.SPACING.sm, // Reduced margin
        flexDirection: 'row',
        alignItems: 'center',
        ...theme.SHADOWS.sm,
        textAlign: 'left',
    },
    iconContainer: {
        width: 30, // Smaller icon container
        height: 30,
        borderRadius: theme.BORDERRADIUS.xl,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.SPACING.sm, // Reduced margin
    },
    statValue: {
        fontSize: theme.FONT_SIZES.body, // Smaller font size
        fontWeight: 'bold',
        color: theme.COLORS.textDark,
    },
    statLabel: {
        fontSize: theme.FONT_SIZES.xs, // Smaller font size
        color: theme.COLORS.textMedium,
    },
    fullWidthStatCard: {
        width: '95%', // Take full width with some horizontal padding
        marginBottom: theme.SPACING.md, // Ensure consistent spacing
        marginHorizontal: '2.5%'
    },
    section: {
        marginTop: theme.SPACING.xs,
        paddingHorizontal: theme.SPACING.md,
    },
    sectionTitle: {
        fontSize: theme.FONT_SIZES.h4, // Smaller title for quick actions
        fontWeight: 'bold',
        color: theme.COLORS.textLight,
        marginBottom: theme.SPACING.sm,
        textAlign: 'center',
    },
    quickActionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.sm, // Smaller border radius
        paddingVertical: theme.SPACING.sm, // Reduced padding
        width: '100%',
        flexWrap: 'wrap',
        alignItems: 'center',
        marginBottom: theme.SPACING.md,
        ...theme.SHADOWS.sm,
        paddingHorizontal: theme.SPACING.xs, // Adjusted padding
        marginTop: theme.SPACING.sm,
    },
    quickActionButton: {
        alignItems: 'center',
        flex: 1,
        padding: theme.SPACING.xs, // Reduced padding
        marginHorizontal: theme.SPACING.xs, // Reduced margin
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.sm, // Even smaller border radius
        ...theme.SHADOWS.sm,
        justifyContent: 'center',
        flexDirection: 'column',
        height: 80, // Smaller height
        maxWidth: '23%', // Adjust for 4 items per row, with some spacing
        minWidth: 70, // Minimum width to prevent squishing
        paddingVertical: theme.SPACING.xs,
        marginBottom: theme.SPACING.sm,
    },
    quickActionLabel: {
        marginTop: theme.SPACING.xs,
        fontSize: theme.FONT_SIZES.xs, // Smaller font size
        color: theme.COLORS.primary,
        fontWeight: '600',
        textAlign: 'center',
    },
    emptyStateText: {
        textAlign: 'center',
        color: theme.COLORS.textMedium,
        padding: theme.SPACING.lg,
    },
});

export default DashboardScreen;
