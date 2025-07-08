import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import TopNavbar from '../components/TopNavbar';
import BookingCard from '../components/BookingCard';
import { theme } from '../styles/theme';
import api from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import { Ionicons } from '@expo/vector-icons';

const BookingsScreen = ({ navigation }) => {
    const [bookings, setBookings] = useState([]);
    const { showNotification } = useNotification();

    const fetchBookings = useCallback(async () => {
        try {
            const { data } = await api.get('/bookings');
            setBookings(data);
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to fetch bookings.', 'error');
        }
    }, [showNotification]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchBookings();
        });
        return unsubscribe;
    }, [navigation, fetchBookings]);

    const handleEditBooking = (booking) => {
        navigation.navigate('AddBooking', { booking: booking });
    };

    const handleDeleteBooking = async (bookingId) => {
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
                            showNotification("Failed to delete booking.", 'error');
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const handleCompleteBooking = async (booking) => {
        try {
            const { data } = await api.put(`/bookings/${booking._id}`, { status: 'Completed' });
            setBookings(bookings.map(b => (b._id === booking._id ? data : b)));
            showNotification('Booking marked as completed!', 'success');
        } catch (err) {
            showNotification("Failed to update booking status.", 'error');
        }
    };

    return (
        <View style={styles.container}>
            <TopNavbar />
            <View style={styles.header}>
                <Text style={styles.heading}>Bookings</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddBooking')}>
                    <Ionicons name="add" size={24} color="#fff" />
                    <Text style={styles.addButtonText}>Add Booking</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.content}>
                <FlatList
                    data={bookings}
                    renderItem={({ item }) => (
                        <BookingCard 
                            booking={item} 
                            onView={() => navigation.navigate('BookingDetail', { bookingId: item._id })}
                            onEdit={handleEditBooking}
                            onDelete={handleDeleteBooking}
                            onComplete={handleCompleteBooking}
                        />
                    )}
                    keyExtractor={(item) => item._id}
                    ListEmptyComponent={<Text style={styles.noBookingsText}>No bookings found.</Text>}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.COLORS.backgroundApp,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.SPACING.md,
        backgroundColor: theme.COLORS.backgroundCard,
    },
    heading: {
        fontSize: theme.FONT_SIZES.h2,
        fontWeight: 'bold',
        color: theme.COLORS.primary,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.COLORS.primary,
        paddingVertical: theme.SPACING.sm,
        paddingHorizontal: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
    },
    addButtonText: {
        color: '#fff',
        marginLeft: theme.SPACING.sm,
    },
    content: {
        flex: 1,
        padding: theme.SPACING.md,
    },
    noBookingsText: {
        textAlign: 'center',
        marginTop: theme.SPACING.lg,
        color: theme.COLORS.textMedium,
    },
});

export default BookingsScreen;