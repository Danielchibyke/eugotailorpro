import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

import BackgroundContainer from '../components/BackgroundContainer';
import BookingCard from '../components/BookingCard';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { theme } from '../styles/theme';

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
    const [stats, setStats] = useState({
        totalBookings: 0,
        pendingBookings: 0,
        totalClients: 0,
        totalRevenue: 0,
    });
    const [recentBookings, setRecentBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            // Assuming an API endpoint that fetches dashboard stats
            const { data } = await api.get('/auth/dashboard-stats'); 
            setStats({
                totalBookings: data.totalBookings || 0,
                pendingBookings: data.pendingBookings || 0,
                totalClients: data.totalClients || 0,
                totalRevenue: data.totalRevenue || 0,
            });
            setRecentBookings(data.recentBookings.filter(booking => booking.status === 'Pending') || []);
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to fetch dashboard data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', fetchData);
        return unsubscribe;
    }, [navigation, fetchData]);

    const handleEditBooking = (booking) => {
        navigation.navigate('AddBooking', { booking: booking });
    };

    


    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.COLORS.primary} />
            </View>
        );
    }

    return (
        <BackgroundContainer>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.headerGreeting}>Hello, {user?.name || 'User'}!</Text>
                    <Text style={styles.headerSlogan}>Your business at a glance.</Text>
                </View>

                <View style={styles.statsGrid}>
                    <StatCard icon="briefcase-outline" label="Total Bookings" value={stats.totalBookings} color="#4a90e2" onPress={() => navigation.navigate('Bookings')} />
                    <StatCard icon="time-outline" label="Pending" value={stats.pendingBookings} color="#f5a623" onPress={() => navigation.navigate('Bookings')} />
                    <StatCard icon="people-outline" label="Total Clients" value={stats.totalClients} color="#bd10e0" onPress={() => navigation.navigate('Clients')}  fullWidth={true}/>
                    <StatCard icon="cash-outline" label="Revenue" value={`₦${stats.totalRevenue.toFixed(2)}`} color="#7ed321" onPress={() => navigation.navigate('Financials')} fullWidth={true} />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.quickActionsGrid}>
                        <QuickActionButton icon="add-circle-outline" label="New Booking" onPress={() => navigation.navigate('AddBooking')} />
                        <QuickActionButton icon="person-add-outline" label="New Client" onPress={() => navigation.navigate('AddClient')} />
                        <QuickActionButton icon="receipt-outline" label="Add Expense" onPress={() => navigation.navigate('Financials', { openModal: true, type: 'expense' })} />
                        <QuickActionButton icon="cash-outline" label="Add Income" onPress={() => navigation.navigate('Financials', { openModal: true, type: 'income' })} />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    {recentBookings.length > 0 ? (
                        <FlatList
                            data={recentBookings}
                            renderItem={({ item }) => (
                                <BookingCard
                                    booking={item}
                                    onView={() => navigation.navigate('BookingDetail', { bookingId: item._id })}
                                    onEdit={() => handleEditBooking(item)}
                                    onDelete={() =>
                                        Alert.alert(
                                            'Delete Booking',
                                            
                                            'Are you sure you want to delete this booking?',
                                            [
                                                {
                                                    text: 'Cancel',
                                                    style: 'cancel',
                                                },
                                                {
                                                    text: 'Delete',
                                                    style: 'destructive',
                                                    onPress: async () => {
                                                        try {
                                                            await api.delete(`/bookings/${item._id}`);
                                                            setRecentBookings(recentBookings.filter(b => b._id !== item._id));
                                                            showNotification('Booking deleted successfully!', 'success');
                                                        } catch (err) {
                                                            showNotification(err.response?.data?.msg || 'Failed to delete booking.', 'error');
                                                        }
                                                    },
                                                },
                                            ],
                                        )

                                                }
                                    
                                    onComplete={() => {
                                        const updatedBooking = { ...item, status: 'Completed' };
                                        api.put(`/bookings/${item._id}`, updatedBooking)
                                            .then(({ data }) => {
                                                setRecentBookings(recentBookings.map(b => (b._id === item._id ? data : b)));
                                                showNotification('Booking marked as completed!', 'success');
                                            })
                                            .catch(err => {
                                                showNotification(err.response?.data?.msg || 'Failed to update booking status.', 'error');
                                            });
                                    }
                                    }

                                />
                            )}
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
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
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
        elevation: 2, // Slightly less shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        textAlign: 'left',
    },
    iconContainer: {
        width: 30, // Smaller icon container
        height: 30,
        borderRadius: 15,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
        paddingHorizontal: theme.SPACING.xs, // Adjusted padding
        marginTop: theme.SPACING.sm,
    },
    quickActionButton: {
        alignItems: 'center',
        flex: 1,
        padding: theme.SPACING.xs, // Reduced padding
        marginHorizontal: theme.SPACING.xs, // Reduced margin
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.xs, // Even smaller border radius
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
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
