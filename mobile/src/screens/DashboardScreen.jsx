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

const StatCard = ({ icon, label, value, color, onPress }) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
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
            setRecentBookings(data.recentBookings || []);
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
                    <StatCard icon="people-outline" label="Total Clients" value={stats.totalClients} color="#bd10e0" onPress={() => navigation.navigate('Clients')} />
                    <StatCard icon="cash-outline" label="Revenue" value={`₦${stats.totalRevenue.toFixed(2)}`} color="#7ed321" onPress={() => navigation.navigate('Financials')} />
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
        paddingBottom: 40,
    },
    header: {
        backgroundColor: theme.COLORS.primary,
        paddingHorizontal: theme.SPACING.lg,
        paddingTop: theme.SPACING.xl,
        paddingBottom: theme.SPACING.xxl,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
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
        justifyContent: 'space-between',
        paddingHorizontal: theme.SPACING.md,
        marginTop: -theme.SPACING.xxl, // Overlap header
    },
    statCard: {
        width: '48%',
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.md,
        padding: theme.SPACING.md,
        marginBottom: theme.SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.SPACING.md,
    },
    statValue: {
        fontSize: theme.FONT_SIZES.h3,
        fontWeight: 'bold',
        color: theme.COLORS.textDark,
    },
    statLabel: {
        fontSize: theme.FONT_SIZES.sm,
        color: theme.COLORS.textMedium,
    },
    section: {
        marginTop: theme.SPACING.md,
        paddingHorizontal: theme.SPACING.md,
    },
    sectionTitle: {
        fontSize: theme.FONT_SIZES.h3,
        fontWeight: 'bold',
        color: theme.COLORS.textDark,
        marginBottom: theme.SPACING.md,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.md,
        paddingVertical: theme.SPACING.md,
    },
    quickActionButton: {
        alignItems: 'center',
        flex: 1,
    },
    quickActionLabel: {
        marginTop: theme.SPACING.xs,
        fontSize: theme.FONT_SIZES.sm,
        color: theme.COLORS.primary,
        fontWeight: '600',
    },
    emptyStateText: {
        textAlign: 'center',
        color: theme.COLORS.textMedium,
        padding: theme.SPACING.lg,
    },
});

export default DashboardScreen;
