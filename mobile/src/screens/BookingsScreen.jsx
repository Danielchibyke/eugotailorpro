import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import BackgroundContainer from '../components/BackgroundContainer';
import BookingCard from '../components/BookingCard';
import { useNotification } from '../context/NotificationContext';
import api from '../utils/api';
import { theme } from '../styles/theme';

const BookingsScreen = ({ navigation }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();

    const fetchBookings = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/bookings');
            // Sort bookings by creation date, newest first
            setBookings(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to fetch bookings.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', fetchBookings);
        return unsubscribe;
    }, [navigation, fetchBookings]);

    const handleEditBooking = (booking) => {
        navigation.navigate('AddBooking', { booking: booking });
    };

    const handleDeleteBooking = (bookingId) => {
        Alert.alert(
            "Delete Booking",
            "Are you sure you want to delete this booking?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    onPress: async () => {
                        try {
                            await api.delete(`/bookings/${bookingId}`);
                            setBookings(bookings.filter(b => b._id !== bookingId));
                            showNotification('Booking deleted successfully!', 'success');
                        } catch (err) {
                            showNotification(err.response?.data?.msg || "Failed to delete booking.", 'error');
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const handleCompleteBooking = async (booking) => {
        try {
            const updatedBooking = { ...booking, status: 'Completed' };
            const { data } = await api.put(`/bookings/${booking._id}`, updatedBooking);
            setBookings(bookings.map(b => (b._id === booking._id ? data : b)));
            showNotification('Booking marked as completed!', 'success');
        } catch (err) {
            showNotification(err.response?.data?.msg || "Failed to update booking status.", 'error');
        }
    };

    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(b => b.status === 'Pending').length;
    const completedBookings = bookings.filter(b => b.status === 'Completed').length;

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Bookings Overview</Text>
            <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>Total Bookings</Text>
                <Text style={styles.balanceValue}>{totalBookings}</Text>
            </View>
            <View style={styles.summaryContainer}>
                <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Pending</Text>
                    <Text style={[styles.summaryValue, { color: theme.COLORS.warning }]}>{pendingBookings}</Text>
                </View>
                <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Completed</Text>
                    <Text style={[styles.summaryValue, { color: theme.COLORS.success }]}>{completedBookings}</Text>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.COLORS.primary} />
            </View>
        );
    }

    return (
        <BackgroundContainer>
            <FlatList
                data={bookings}
                renderItem={({ item }) => (
                    <BookingCard
                        booking={item}
                        onView={() => navigation.navigate('BookingDetail', { bookingId: item._id })}
                        onEdit={() => handleEditBooking(item)}
                        onDelete={() => handleDeleteBooking(item._id)}
                        onComplete={() => handleCompleteBooking(item)}
                    />
                )}
                keyExtractor={(item) => item._id}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyStateContainer}>
                        <Text style={styles.emptyStateText}>No bookings yet.</Text>
                        <Text style={styles.emptyStateSubText}>Tap the '+' button to add one!</Text>
                    </View>
                }
            />
            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddBooking')}>
                <Ionicons name="add" size={30} color={theme.COLORS.textLight} />
            </TouchableOpacity>
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
    list: {
        paddingBottom: 80, // Space for FAB
    },
    headerContainer: {
        backgroundColor: theme.COLORS.primary,
        padding: theme.SPACING.lg,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: theme.SPACING.md,
    },
    headerTitle: {
        fontSize: theme.FONT_SIZES.h2,
        fontWeight: 'bold',
        color: theme.COLORS.textLight,
        textAlign: 'center',
        marginBottom: theme.SPACING.md,
    },
    balanceContainer: {
        alignItems: 'center',
        marginBottom: theme.SPACING.md,
    },
    balanceLabel: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textLight,
    },
    balanceValue: {
        fontSize: 42,
        fontWeight: 'bold',
        color: theme.COLORS.textLight,
    },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: theme.BORDERRADIUS.md,
        padding: theme.SPACING.md,
    },
    summaryBox: {
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: theme.FONT_SIZES.sm,
        color: theme.COLORS.textLight,
    },
    summaryValue: {
        fontSize: theme.FONT_SIZES.h3,
        fontWeight: '600',
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
        paddingHorizontal: theme.SPACING.lg,
    },
    emptyStateText: {
        fontSize: theme.FONT_SIZES.lg,
        fontWeight: 'bold',
        color: theme.COLORS.textMedium,
        textAlign: 'center',
    },
    emptyStateSubText: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textMedium,
        marginTop: theme.SPACING.xs,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },

});


export default BookingsScreen;
