import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import TopNavbar from '../components/TopNavbar';
import { theme } from '../styles/theme';
import api from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import { Picker } from '@react-native-picker/picker';

const AddBookingScreen = ({ navigation, route }) => {
    const { booking } = route.params || {};
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        client: null,
        service: '',
        bookingDate: new Date(),
        deliveryDate: new Date(),
        reminderDate: new Date(),
        status: 'Pending',
        notes: '',
        design: '',
        price: '',
        payment: '',
    });
    const { showNotification } = useNotification();

    const fetchClients = useCallback(async () => {
        try {
            const { data } = await api.get('/clients');
            setClients(data);
            setFilteredClients(data);
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to fetch clients.', 'error');
        }
    }, [showNotification]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    useEffect(() => {
        if (booking) {
            setFormData({
                client: booking.client._id,
                service: booking.service,
                bookingDate: new Date(booking.bookingDate),
                deliveryDate: new Date(booking.deliveryDate),
                reminderDate: new Date(booking.reminderDate),
                status: booking.status,
                notes: booking.notes,
                design: booking.design,
                price: booking.price.toString(),
                payment: booking.payment.toString(),
            });
        }
    }, [booking]);

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query) {
            const filtered = clients.filter((client) =>
                client.name.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredClients(filtered);
        } else {
            setFilteredClients(clients);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleSaveBooking = async () => {
        if (!formData.client || !formData.service || !formData.price) {
            showNotification('Please fill in all fields.', 'error');
            return;
        }
        try {
            const bookingData = {
                ...formData,
                price: parseFloat(formData.price),
                payment: parseFloat(formData.payment),
            };

            if (booking) {
                await api.put(`/bookings/${booking._id}`, bookingData);
                showNotification('Booking updated successfully!', 'success');
            } else {
                await api.post('/bookings', bookingData);
                showNotification('Booking added successfully!', 'success');
            }
            navigation.goBack();
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to save booking.', 'error');
        }
    };

    return (
        <View style={styles.container}>
            <TopNavbar />
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.heading}>{booking ? 'Edit Booking' : 'Add Booking'}</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Search Client"
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
                <Picker
                    selectedValue={formData.client}
                    onValueChange={(itemValue) => handleInputChange('client', itemValue)}
                    style={styles.picker}
                >
                    <Picker.Item label="Select a client" value={null} />
                    {filteredClients.map((client) => (
                        <Picker.Item key={client._id} label={client.name} value={client._id} />
                    ))}
                </Picker>
                <TextInput
                    style={styles.input}
                    placeholder="Service"
                    value={formData.service}
                    onChangeText={(value) => handleInputChange('service', value)}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Price"
                    value={formData.price}
                    onChangeText={(value) => handleInputChange('price', value)}
                    keyboardType="numeric"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Payment"
                    value={formData.payment}
                    onChangeText={(value) => handleInputChange('payment', value)}
                    keyboardType="numeric"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Design URL"
                    value={formData.design}
                    onChangeText={(value) => handleInputChange('design', value)}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Notes"
                    value={formData.notes}
                    onChangeText={(value) => handleInputChange('notes', value)}
                    multiline
                />
                <Picker
                    selectedValue={formData.status}
                    onValueChange={(itemValue) => handleInputChange('status', itemValue)}
                    style={styles.picker}
                >
                    <Picker.Item label="Pending" value="Pending" />
                    <Picker.Item label="Confirmed" value="Confirmed" />
                    <Picker.Item label="Completed" value="Completed" />
                    <Picker.Item label="Cancelled" value="Cancelled" />
                </Picker>
                <Text style={styles.dateLabel}>Booking Date</Text>
                <TextInput style={styles.input} value={formData.bookingDate.toDateString()} editable={false} />
                <Text style={styles.dateLabel}>Delivery Date</Text>
                <TextInput style={styles.input} value={formData.deliveryDate.toDateString()} editable={false} />
                <Text style={styles.dateLabel}>Reminder Date</Text>
                <TextInput style={styles.input} value={formData.reminderDate.toDateString()} editable={false} />
                <TouchableOpacity style={styles.button} onPress={handleSaveBooking}>
                    <Text style={styles.buttonText}>{booking ? 'Save Changes' : 'Add Booking'}</Text>
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
    dateLabel: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textDark,
        marginBottom: theme.SPACING.sm,
    },
});

export default AddBookingScreen;
""