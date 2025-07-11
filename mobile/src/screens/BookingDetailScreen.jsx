import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

import BackgroundContainer from '../components/BackgroundContainer';
import CollapsibleSection from '../components/CollapsibleSection';
import { useNotification } from '../context/NotificationContext';
import api from '../utils/api';
import { theme } from '../styles/theme';

const BookingDetailScreen = ({ route, navigation }) => {
    const { bookingId } = route.params;
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();

    const fetchBookingDetails = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/bookings/${bookingId}`);
            setBooking(data);
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to fetch booking details.', 'error');
        } finally {
            setLoading(false);
        }
    }, [bookingId, showNotification]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', fetchBookingDetails);
        return unsubscribe;
    }, [navigation, fetchBookingDetails]);

    const handleCompleteBooking = async () => {
        Alert.alert(
            "Complete Booking",
            "Are you sure you want to mark this booking as completed?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Complete",
                    onPress: async () => {
                        try {
                            const updatedBooking = { ...booking, status: 'Completed' };
                            const { data } = await api.put(`/bookings/${booking._id}`, updatedBooking);
                            setBooking(data);
                            showNotification('Booking marked as completed!', 'success');
                        } catch (err) {
                            showNotification(err.response?.data?.msg || "Failed to update status.", 'error');
                        }
                    },
                    style: "default"
                }
            ]
        );
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending': return { color: theme.COLORS.warning };
            case 'In Progress': return { color: theme.COLORS.info };
            case 'Completed': return { color: theme.COLORS.success };
            case 'Cancelled': return { color: theme.COLORS.danger };
            default: return { color: theme.COLORS.textMedium };
        }
    };

    if (loading || !booking) {
        return (
            <BackgroundContainer>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.COLORS.primary} />
                    <Text style={styles.loadingText}>Loading booking details...</Text>
                </View>
            </BackgroundContainer>
        );
    }

    const { client, service, deliveryDate, status, price = 0, payment = 0, notes } = booking;
    const amountRemaining = price - payment;

    return (
        <BackgroundContainer>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Booking Details</Text>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => navigation.navigate('AddBooking', { booking: booking })}
                    >
                        <Ionicons name="create-outline" size={24} color={theme.COLORS.textLight} />
                        <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Client Information</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('ClientDetail', { clientId: client._id })}>
                        <Text style={styles.clientName}>{client.name}</Text>
                    </TouchableOpacity>
                    <Text style={styles.detailText}>{client.phone}</Text>
                    {client.email && <Text style={styles.detailText}>{client.email}</Text>}
                </View>

                {client.measurements && Object.keys(client.measurements).length > 0 && (
                    <CollapsibleSection title="Client Measurements">
                        {Object.entries(client.measurements).map(([key, value]) => (
                            <View style={styles.detailRow} key={key}>
                                <Text style={styles.detailLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                                <Text style={styles.detailValue}>{value}</Text>
                            </View>
                        ))}
                    </CollapsibleSection>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Booking Details</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Service</Text>
                        <Text style={styles.detailValue}>{service}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Status</Text>
                        <Text style={[styles.detailValue, getStatusStyle(status)]}>{status}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Delivery Date</Text>
                        <Text style={styles.detailValue}>{dayjs(deliveryDate).format('MMM D, YYYY')}</Text>
                    </View>
                    {notes && (
                        <View style={styles.notesSection}>
                            <Text style={styles.detailLabel}>Notes</Text>
                            <Text style={styles.notesText}>{notes}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Financials</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Total Amount</Text>
                        <Text style={styles.financialValue}>₦{price.toFixed(2)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Amount Paid</Text>
                        <Text style={[styles.financialValue, { color: theme.COLORS.success }]}>₦{payment.toFixed(2)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Amount Remaining</Text>
                        <Text style={[styles.financialValue, { color: theme.COLORS.danger }]}>₦{amountRemaining.toFixed(2)}</Text>
                    </View>
                </View>

                {status !== 'Completed' && (
                    <TouchableOpacity style={styles.completeButton} onPress={handleCompleteBooking}>
                        <Ionicons name="checkmark-circle-outline" size={24} color={theme.COLORS.textLight} />
                        <Text style={styles.completeButtonText}>Mark as Completed</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </BackgroundContainer>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: theme.SPACING.sm,
        color: theme.COLORS.textMedium,
    },
    content: {
        padding: theme.SPACING.md,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.SPACING.lg,
    },
    headerTitle: {
        fontSize: theme.FONT_SIZES.h2,
        fontWeight: 'bold',
        color: theme.COLORS.primary,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.COLORS.primary,
        paddingVertical: theme.SPACING.sm,
        paddingHorizontal: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.md,
    },
    editButtonText: {
        color: theme.COLORS.textLight,
        fontWeight: 'bold',
        marginLeft: theme.SPACING.sm,
    },
    section: {
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.md,
        padding: theme.SPACING.md,
        marginBottom: theme.SPACING.md,
    },
    sectionTitle: {
        fontSize: theme.FONT_SIZES.h3,
        fontWeight: 'bold',
        color: theme.COLORS.primary,
        marginBottom: theme.SPACING.md,
    },
    clientName: {
        fontSize: theme.FONT_SIZES.lg,
        fontWeight: 'bold',
        color: theme.COLORS.accent,
        textDecorationLine: 'underline',
        marginBottom: theme.SPACING.xs,
    },
    detailText: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textMedium,
        marginBottom: theme.SPACING.xs,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.COLORS.border,
    },
    detailLabel: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textMedium,
        fontWeight: '600',
    },
    detailValue: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textDark,
        fontWeight: '600',
    },
    financialValue: {
        fontSize: theme.FONT_SIZES.lg,
        fontWeight: 'bold',
    },
    notesSection: {
        marginTop: theme.SPACING.sm,
    },
    notesText: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textDark,
        fontStyle: 'italic',
        lineHeight: 22,
    },
    completeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.COLORS.success,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.md,
        marginTop: theme.SPACING.lg,
    },
    completeButtonText: {
        color: theme.COLORS.textLight,
        fontWeight: 'bold',
        fontSize: theme.FONT_SIZES.button,
        marginLeft: theme.SPACING.sm,
    },
});

export default BookingDetailScreen;
