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
import { useRealm, useObject } from '../config/realmConfig';
import BackgroundContainer from '../components/BackgroundContainer';
import CollapsibleSection from '../components/CollapsibleSection';
import { useNotification } from '../context/NotificationContext';
import api from '../utils/api';
import { theme } from '../styles/theme';

const BookingDetailScreen = ({ route, navigation }) => {
    const { bookingId } = route.params;
    const realm = useRealm();
    const booking = useObject('Booking', new Realm.BSON.ObjectId(bookingId));
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();

    const fetchBookingDetails = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/bookings/${bookingId}`);

            realm.write(() => {
                // Ensure client exists in Realm or create/update it
                let clientRealmObject = realm.objects('Client').filtered('_id == $0', new Realm.BSON.ObjectId(data.client._id))[0];
                if (!clientRealmObject) {
                    clientRealmObject = realm.create('Client', {
                        _id: new Realm.BSON.ObjectId(data.client._id),
                        name: data.client.name,
                        email: data.client.email || null,
                        phone: data.client.phone,
                        address: data.client.address || null,
                        notes: data.client.notes || null,
                        createdBy: new Realm.BSON.ObjectId(data.client.createdBy),
                        measurement: data.client.measurement ? (() => {
                            const sanitizedMeasurement = {
                                chest: Array.isArray(data.client.measurement.chest) ? data.client.measurement.chest.map(val => {
                                    const parsedVal = parseInt(val);
                                    if (isNaN(parsedVal)) { return 0; }
                                    return parsedVal;
                                }) : [0, 0],
                                waist: (() => {
                                    const parsedVal = parseInt(data.client.measurement.waist);
                                    if (isNaN(parsedVal)) { return 0; }
                                    return parsedVal;
                                })(),
                                roundsleeve: Array.isArray(data.client.measurement.roundsleeve) ? data.client.measurement.roundsleeve.map(val => {
                                    const parsedVal = parseInt(val);
                                    if (isNaN(parsedVal)) { return 0; }
                                    return parsedVal;
                                }) : [0, 0, 0],
                                shoulder: (() => {
                                    const parsedVal = parseInt(data.client.measurement.shoulder);
                                    if (isNaN(parsedVal)) { return 0; }
                                    return parsedVal;
                                })(),
                                toplength: (() => {
                                    const parsedVal = parseInt(data.client.measurement.toplength);
                                    if (isNaN(parsedVal)) { return 0; }
                                    return parsedVal;
                                })(),
                                trouserlength: (() => {
                                    const parsedVal = parseInt(data.client.measurement.trouserlength);
                                    if (isNaN(parsedVal)) { return 0; }
                                    return parsedVal;
                                })(),
                                thigh: (() => {
                                    const parsedVal = parseInt(data.client.measurement.thigh);
                                    if (isNaN(parsedVal)) { return 0; }
                                    return parsedVal;
                                })(),
                                knee: (() => {
                                    const parsedVal = parseInt(data.client.measurement.knee);
                                    if (isNaN(parsedVal)) { return 0; }
                                    return parsedVal;
                                })(),
                                ankle: (() => {
                                    const parsedVal = parseInt(data.client.measurement.ankle);
                                    if (isNaN(parsedVal)) { return 0; }
                                    return parsedVal;
                                })(),
                                neck: (() => {
                                    const parsedVal = parseInt(data.client.measurement.neck);
                                    if (isNaN(parsedVal)) { return 0; }
                                    return parsedVal;
                                })(),
                                sleeveLength: Array.isArray(data.client.measurement.sleeveLength) ? data.client.measurement.sleeveLength.map(val => {
                                    const parsedVal = parseInt(val);
                                    if (isNaN(parsedVal)) { return 0; }
                                    return parsedVal;
                                }) : [0, 0, 0],
                            };
                            return sanitizedMeasurement;
                        })() : {},
                        createdAt: new Date(data.client.createdAt),
                        updatedAt: new Date(data.client.updatedAt),
                    }, Realm.UpdateMode.Modified);
                } else {
                    // Update existing client properties
                    clientRealmObject.name = data.client.name;
                    clientRealmObject.email = data.client.email || null;
                    clientRealmObject.phone = data.client.phone;
                    clientRealmObject.address = data.client.address || null;
                    clientRealmObject.notes = data.client.notes || null;
                    clientRealmObject.measurement = data.client.measurement ? (() => {
                        const sanitizedMeasurement = {
                            chest: Array.isArray(data.client.measurement.chest) ? data.client.measurement.chest.map(val => {
                                const parsedVal = parseInt(val);
                                if (isNaN(parsedVal)) { return 0; }
                                return parsedVal;
                            }) : [0, 0],
                            waist: (() => {
                                const parsedVal = parseInt(data.client.measurement.waist);
                                if (isNaN(parsedVal)) { return 0; }
                                return parsedVal;
                            })(),
                            roundsleeve: Array.isArray(data.client.measurement.roundsleeve) ? data.client.measurement.roundsleeve.map(val => {
                                const parsedVal = parseInt(val);
                                if (isNaN(parsedVal)) { return 0; }
                                return parsedVal;
                            }) : [0, 0, 0],
                            shoulder: (() => {
                                const parsedVal = parseInt(data.client.measurement.shoulder);
                                if (isNaN(parsedVal)) { return 0; }
                                return parsedVal;
                            })(),
                            toplength: (() => {
                                const parsedVal = parseInt(data.client.measurement.toplength);
                                if (isNaN(parsedVal)) { return 0; }
                                return parsedVal;
                            })(),
                            trouserlength: (() => {
                                const parsedVal = parseInt(data.client.measurement.trouserlength);
                                if (isNaN(parsedVal)) { return 0; }
                                return parsedVal;
                            })(),
                            thigh: (() => {
                                const parsedVal = parseInt(data.client.measurement.thigh);
                                if (isNaN(parsedVal)) { return 0; }
                                return parsedVal;
                            })(),
                            knee: (() => {
                                const parsedVal = parseInt(data.client.measurement.knee);
                                if (isNaN(parsedVal)) { return 0; }
                                return parsedVal;
                            })(),
                            ankle: (() => {
                                const parsedVal = parseInt(data.client.measurement.ankle);
                                if (isNaN(parsedVal)) { return 0; }
                                return parsedVal;
                            })(),
                            neck: (() => {
                                const parsedVal = parseInt(data.client.measurement.neck);
                                if (isNaN(parsedVal)) { return 0; }
                                return parsedVal;
                            })(),
                            sleeveLength: Array.isArray(data.client.measurement.sleeveLength) ? data.client.measurement.sleeveLength.map(val => {
                                const parsedVal = parseInt(val);
                                if (isNaN(parsedVal)) { return 0; }
                                return parsedVal;
                            }) : [0, 0, 0],
                        };
                        return sanitizedMeasurement;
                    })() : {};
                    clientRealmObject.updatedAt = new Date(data.client.updatedAt);
                }

                // Update booking data in Realm
                if (booking && booking.isValid()) {
                    console.log('BookingDetailScreen: Assigning client to booking. clientRealmObject:', clientRealmObject ? clientRealmObject.isValid() ? clientRealmObject.toJSON() : 'Invalid Realm Object' : 'null');
                    booking.client = clientRealmObject;
                    booking.bookingDate = new Date(data.bookingDate);
                    booking.deliveryDate = data.deliveryDate ? new Date(data.deliveryDate) : undefined; // Handle optional deliveryDate
                    booking.reminderDate = data.reminderDate ? new Date(data.reminderDate) : undefined; // Handle optional reminderDate
                    booking.status = data.status;
                    booking.items = data.items || [];
                    booking.totalAmount = data.totalAmount;
                    booking.amountPaid = data.amountPaid;
                    booking.balanceDue = data.balanceDue;
                    booking.notes = data.notes || null;
                    booking.createdBy = new Realm.BSON.ObjectId(data.createdBy);
                    booking.updatedAt = new Date(data.updatedAt);
                    console.log('BookingDetailScreen: Booking after client assignment:', booking.client ? booking.client.isValid() ? booking.client.toJSON() : 'Invalid Realm Object' : 'null');
                }
            });
            showNotification('Booking details synced successfully!', 'success');
        } catch (err) {
            console.error('Failed to fetch booking details from API:', err);
            // Only show notification if truly offline, otherwise fail silently for background sync
            if (!netInfo.isConnected) {
                showNotification(err.response?.data?.msg || 'Failed to fetch booking details. Displaying cached data.', 'error');
            }
        } finally {
            setLoading(false);
        }
    }, [bookingId, showNotification, realm, booking]);

    useEffect(() => {
        // Initial load is handled by useObject, but we still want to fetch fresh data on focus
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
                        realm.write(() => {
                            booking.status = 'Completed';
                            booking.syncStatus = 'pending';
                        });
                        showNotification('Booking marked as completed locally.', 'info');

                        try {
                            const updatedBooking = { ...booking.toJSON(), status: 'Completed' };
                            const { data } = await api.put(`/bookings/${booking._id.toHexString()}`, updatedBooking);
                            
                            realm.write(() => {
                                booking.status = data.status;
                                booking.updatedAt = new Date(data.updatedAt);
                                booking.syncStatus = 'synced';
                            });
                            showNotification('Booking status synced successfully!', 'success');
                        } catch (err) {
                            realm.write(() => {
                                booking.syncStatus = 'error';
                            });
                            showNotification(err.response?.data?.msg || "Failed to sync booking status.", 'error');
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

    if (loading && !booking) {
        return (
            <BackgroundContainer>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.COLORS.primary} />
                    <Text style={styles.loadingText}>Loading booking details...</Text>
                </View>
            </BackgroundContainer>
        );
    }

    if (!booking) {
        return (
            <BackgroundContainer>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Booking not found.</Text>
                </View>
            </BackgroundContainer>
        );
    }

    const { client, bookingDate, deliveryDate, status, totalAmount = 0, amountPaid = 0, notes } = booking;
    const amountRemaining = totalAmount - amountPaid;

    console.log('BookingDetailScreen: Rendering with booking:', booking ? booking.isValid() ? booking.toJSON() : 'Invalid Realm Object' : 'null');
    console.log('BookingDetailScreen: Rendering with client:', client ? client.isValid() ? client.toJSON() : 'Invalid Realm Object' : 'null');

    if (!client || (client && !client.isValid())) {
        return (
            <BackgroundContainer>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Client information not available or invalid. Please check your connection or try again later.</Text>
                </View>
            </BackgroundContainer>
        );
    }

    return (
        <BackgroundContainer>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Booking Details</Text>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => navigation.navigate('AddBooking', { booking: booking.toJSON() })}
                    >
                        <Ionicons name="create-outline" size={24} color={theme.COLORS.textLight} />
                        <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                </View>

                {booking.syncStatus === 'pending' && (
                    <View style={styles.syncBanner}>
                        <Text style={styles.syncBannerText}>Awaiting Internet Connection to Sync</Text>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Client Information</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('ClientDetail', { clientId: client._id.toHexString() })}>
                        <Text style={styles.clientName}>{client.name}</Text>
                    </TouchableOpacity>
                    <Text style={styles.detailText}>{client.phone}</Text>
                    {client.email && <Text style={styles.detailText}>{client.email}</Text>}
                </View>

                {client.measurement && Object.keys(client.measurement).length > 0 && (
                    <CollapsibleSection title="Client Measurements">
                        {Object.entries(client.measurement).map(([key, value]) => {
                            return (
                                <View style={styles.detailRow} key={key}>
                                    <Text style={styles.detailLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                                    <Text style={styles.detailValue}>{Array.isArray(value) ? value.join(', ') : value}</Text>
                                </View>
                            );
                        })}
                    </CollapsibleSection>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Booking Details</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Booking Date</Text>
                        <Text style={styles.detailValue}>{dayjs(bookingDate).format('MMM D, YYYY')}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Delivery Date</Text>
                        <Text style={styles.detailValue}>{dayjs(deliveryDate).format('MMM D, YYYY')}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Status</Text>
                        <Text style={[styles.detailValue, getStatusStyle(status)]}>{status}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Items</Text>
                        <Text style={styles.detailValue}>{booking.items && booking.items.length > 0 ? booking.items.join(', ') : 'N/A'}</Text>
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
                        <Text style={styles.financialValue}>₦{totalAmount.toFixed(2)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Amount Paid</Text>
                        <Text style={[styles.financialValue, { color: theme.COLORS.success }]}>₦{amountPaid.toFixed(2)}</Text>
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
    syncBanner: {
        backgroundColor: theme.COLORS.warning,
        padding: theme.SPACING.sm,
        borderRadius: theme.BORDERRADIUS.sm,
        marginBottom: theme.SPACING.md,
        alignItems: 'center',
    },
    syncBannerText: {
        color: theme.COLORS.textLight,
        fontWeight: 'bold',
    },
});

export default BookingDetailScreen;
