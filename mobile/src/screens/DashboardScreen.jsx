import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import TopNavbar from '../components/TopNavbar';
import BookingCard from '../components/BookingCard';
import { theme } from '../styles/theme';
import api from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ icon, label, value, color }) => (
    <View style={[styles.statCard, { borderTopColor: color }]}>
        <Ionicons name={icon} size={40} color={color} />
        <View style={styles.statInfo}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    </View>
);

const DashboardScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [bookingsRes, clientsRes] = await Promise.all([
                api.get("/bookings"),
                api.get("/clients")
            ]);
            setBookings(bookingsRes.data || []);
            setClients(clientsRes.data || []);
        } catch (err) {
            showNotification(err.message || "An error occurred while fetching data", 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchData();
        });
        return unsubscribe;
    }, [navigation, fetchData]);

    const handleEditOrder = (booking) => {
        navigation.navigate('AddBooking', { booking: booking });
    };

    const handleDeleteOrder = async (orderId) => {
        Alert.alert(
            "Delete Booking",
            "Are you sure you want to delete this booking?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    onPress: async () => {
                        try {
                            await api.delete(`/bookings/${orderId}`);
                            setBookings(bookings.filter(b => b._id !== orderId));
                            showNotification('Booking deleted successfully!', 'success');
                        } catch (err) {
                            showNotification("Failed to delete booking.", 'error');
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const handleCompleteOrder = async (order) => {
        try {
            const { data } = await api.put(`/bookings/${order._id}`, { status: 'Completed' });
            setBookings(bookings.map(b => (b._id === order._id ? data : b)));
            showNotification('Booking marked as completed!', 'success');
        } catch (err) {
            showNotification("Failed to update booking status.", 'error');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.COLORS.primary} />
                <Text>Loading Dashboard...</Text>
            </View>
        );
    }

    const pendingBookings = bookings.filter(b => b.status === 'Pending');

    return (
        <View style={styles.container}>
            <TopNavbar />
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.summaryMetrics}>
                    <StatCard icon="ios-briefcase" label="Total Bookings" value={bookings.length} color="#4a90e2" />
                    <StatCard icon="ios-time" label="Pending" value={pendingBookings.length} color="#f5a623" />
                    <StatCard icon="ios-people" label="Total Clients" value={clients.length} color="#bd10e0" />
                    <StatCard icon="cash" label="Revenue" value="₦0" color="#7ed321" />
                </View>

                <View style={styles.quickActions}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('AddBooking')}>
                            <Ionicons name="add-circle-outline" size={24} color={theme.COLORS.primary} />
                            <Text style={styles.actionButtonText}>New Booking</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('AddClient')}>
                            <Ionicons name="person-add-outline" size={24} color={theme.COLORS.primary} />
                            <Text style={styles.actionButtonText}>New Client</Text>
                        </TouchableOpacity>
                        {user && user.role === 'admin' && (
                            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Register')}>
                                <Ionicons name="person-add-outline" size={24} color={theme.COLORS.primary} />
                                <Text style={styles.actionButtonText}>Register User</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View style={styles.recentBookings}>
                    <Text style={styles.sectionTitle}>Recent Pending Bookings</Text>
                    {pendingBookings.length > 0 ? (
                        pendingBookings.slice(0, 5).map(order => (
                            <BookingCard
                                key={order._id}
                                booking={order}
                                onView={() => navigation.navigate('BookingDetail', { bookingId: order._id })}
                                onEdit={handleEditOrder}
                                onDelete={handleDeleteOrder}
                                onComplete={handleCompleteOrder}
                            />
                        ))
                    ) : (
                        <Text>No pending bookings.</Text>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.COLORS.backgroundApp,
    },
    content: {
        padding: theme.SPACING.md,
    },
    summaryMetrics: {
        marginBottom: theme.SPACING.lg,
    },
    statCard: {
        backgroundColor: theme.COLORS.backgroundCard,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.md,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.SPACING.md,
        borderTopWidth: 4,
    },
    statInfo: {
        marginLeft: theme.SPACING.md,
    },
    statValue: {
        fontSize: theme.FONT_SIZES.h2,
        fontWeight: 'bold',
        color: theme.COLORS.textDark,
    },
    statLabel: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textMedium,
    },
    quickActions: {
        marginBottom: theme.SPACING.lg,
    },
    sectionTitle: {
        fontSize: theme.FONT_SIZES.h3,
        color: theme.COLORS.accent,
        marginBottom: theme.SPACING.md,
    },
    recentBookings: {
        // Styles for recent bookings section
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    actionButton: {
        alignItems: 'center',
    },
    actionButtonText: {
        marginTop: theme.SPACING.xs,
        color: theme.COLORS.primary,
    },
});

export default DashboardScreen;