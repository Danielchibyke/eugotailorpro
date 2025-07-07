import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import TopNavbar from '../components/TopNavbar';
import { theme } from '../styles/theme';
import api from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import { Picker } from '@react-native-picker/picker';

const BookingDetailScreen = ({ route, navigation }) => {
    const { bookingId } = route.params;
    const [booking, setBooking] = useState(null);
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [service, setService] = useState('');
    const [bookingDate, setBookingDate] = useState(new Date());
    const [deliveryDate, setDeliveryDate] = useState(new Date());
    const [price, setPrice] = useState('');
    const [status, setStatus] = useState('Pending');
    const { showNotification } = useNotification();

    const fetchBooking = useCallback(async () => {
        try {
            const { data } = await api.get(`/bookings/${bookingId}`);
            setBooking(data);
            setSelectedClient(data.client._id);
            setService(data.service);
            setBookingDate(new Date(data.bookingDate));
            setDeliveryDate(new Date(data.deliveryDate));
            setPrice(data.price.toString());
            setStatus(data.status);
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to fetch booking details.', 'error');
        }
    }, [bookingId, showNotification]);

    const fetchClients = useCallback(async () => {
        try {
            const { data } = await api.get('/clients');
            setClients(data);
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to fetch clients.', 'error');
        }
    }, [showNotification]);

    useEffect(() => {
        fetchBooking();
        fetchClients();
    }, [fetchBooking, fetchClients]);

    const handleUpdateBooking = async () => {
        try {
            await api.put(`/bookings/${bookingId}`, {
                client: selectedClient,
                service,
                bookingDate,
                deliveryDate,
                price: parseFloat(price),
                status,
            });
            showNotification('Booking updated successfully!', 'success');
            navigation.goBack();
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to update booking.', 'error');
        }
    };

    if (!booking) {
        return (
            <View style={styles.container}>
                <TopNavbar />
                <View style={styles.content}>
                    <Text>Loading...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <TopNavbar />
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.heading}>Booking Details</Text>
                <Picker
                    selectedValue={selectedClient}
                    onValueChange={(itemValue) => setSelectedClient(itemValue)}
                    style={styles.picker}
                >
                    {clients.map((client) => (
                        <Picker.Item key={client._id} label={client.name} value={client._id} />
                    ))}
                </Picker>
                <TextInput
                    style={styles.input}
                    placeholder="Service"
                    value={service}
                    onChangeText={setService}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Price"
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                />
                <Picker
                    selectedValue={status}
                    onValueChange={(itemValue) => setStatus(itemValue)}
                    style={styles.picker}
                >
                    <Picker.Item label="Pending" value="Pending" />
                    <Picker.Item label="Completed" value="Completed" />
                    <Picker.Item label="Cancelled" value="Cancelled" />
                </Picker>
                {/* Add date pickers for bookingDate and deliveryDate */}
                <TouchableOpacity style={styles.button} onPress={handleUpdateBooking}>
                    <Text style={styles.buttonText}>Update Booking</Text>
                </TouchableOpacity>
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
    heading: {
        fontSize: theme.FONT_SIZES.h2,
        fontWeight: 'bold',
        color: theme.COLORS.primary,
        marginBottom: theme.SPACING.md,
        textAlign: 'center',
    },
    picker: {
        backgroundColor: theme.COLORS.backgroundCard,
        marginBottom: theme.SPACING.md,
    },
    input: {
        backgroundColor: theme.COLORS.backgroundCard,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        marginBottom: theme.SPACING.md,
    },
    button: {
        backgroundColor: theme.COLORS.primary,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default BookingDetailScreen;