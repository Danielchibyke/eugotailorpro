import React, { useState, useEffect, useCallback,useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image, // Added Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import BackgroundContainer from '../components/BackgroundContainer';
import CollapsibleSection from '../components/CollapsibleSection';
import { useNotification } from '../context/NotificationContext';
import { theme } from '../styles/theme';
import { bookingRepository } from '../data/bookingRepository'; // Import the repository
import { getUserEffectivePermissions, PERMISSIONS } from '../config/permissions';
import ImageZoomModal from '../components/ImageZoomModal';
import { useAuth } from '../context/AuthContext';

const BookingDetailScreen = ({ route, navigation }) => {
    const { id: bookingId } = route.params;
    const { user, refreshUser } = useAuth();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const [isZoomModalVisible, setIsZoomModalVisible] = useState(false);
    const [zoomedImage, setZoomedImage] = useState(null);
    const openZoomModal = (imageUrl) => {
        setZoomedImage(imageUrl);
        setIsZoomModalVisible(true);
    };
    const permissions = useMemo(() => getUserEffectivePermissions(user), [user]);
    const canEditBookings = permissions.includes(PERMISSIONS.BOOKINGS_EDIT);
    const closeZoomModal = () => setIsZoomModalVisible(false);

    const fetchBookingDetails = useCallback(async () => {
        setLoading(true);
        const result = await bookingRepository.fetchBookingById(bookingId);
        if (result.success) {
            setBooking(result.data);
        } else {
            showNotification(result.error, 'error');
            // If fetching fails, maybe navigate back or show a persistent error
        }
        setLoading(false);
    }, [bookingId, showNotification]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchBookingDetails();
            refreshUser(); // Refresh user permissions on focus
        });
        return unsubscribe;
    }, [navigation, fetchBookingDetails, refreshUser]);


    const handleCompleteBooking = async () => {
        Alert.alert(
            "Complete Booking",
            "Are you sure you want to mark this booking as completed?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Complete",
                    onPress: async () => {
                        const result = await bookingRepository.updateBooking(bookingId, { status: 'Completed' });
                        if (result.success) {
                            showNotification('Booking marked as completed!', 'success');
                            fetchBookingDetails(); // Re-fetch to get updated data
                        } else {
                            showNotification(result.error, 'error');
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

    if (loading) {
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

    const { client, bookingDate, deliveryDate, status, price = 0, payment = 0, notes, designs } = booking;
    console.log('Booking designs:', designs);
    const amountRemaining = price - payment;

    if (!client) {
        return (
            <BackgroundContainer>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Client information not available. Please check your connection or try again later.</Text>
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

                {client.measurement && Object.keys(client.measurement).length > 0 && (
                    <CollapsibleSection title="Client Measurements">
                        {Object.entries(client.measurement).map(([key, value]) => {
                            if (!value || (Array.isArray(value) && value.length === 0)) {
                                return null;
                            }
                            const formattedLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, function(str){ return str.toUpperCase(); });
                            const formattedValue = Array.isArray(value) ? value.join(', ') : value;
                            return (
                                <View style={styles.measurementDetailRow} key={key}>
                                    <Text style={styles.measurementDetailLabel}>{formattedLabel}</Text>
                                    <Text style={styles.measurementDetailValue}>{formattedValue}</Text>
                                </View>
                            );
                        })}
                    </CollapsibleSection>
                )}

                {booking.designs && booking.designs.length > 0 && (
                    <CollapsibleSection title="Designs">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {booking.designs.map((design, index) => (
                                <TouchableOpacity key={index} onPress={() => openZoomModal(design)}>
                                    <Image
                                        source={{ uri: design }}
                                        style={styles.designImage}
                                        resizeMode="contain"
                                        onError={(e) => console.log('BookingDetailScreen Image Error:', e.nativeEvent.error)}
                                    />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
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

                {status !== 'Completed' && canEditBookings && (
                    <TouchableOpacity style={styles.completeButton} onPress={handleCompleteBooking}>
                        <Ionicons name="checkmark-circle-outline" size={24} color={theme.COLORS.textLight} />
                        <Text style={styles.completeButtonText}>Mark as Completed</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
            {zoomedImage && (
                <ImageZoomModal
                    imageUrl={zoomedImage}
                    visible={isZoomModalVisible}
                    onClose={closeZoomModal}
                />
            )}
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
        color: theme.COLORS.textLight,
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
    measurementDetailRow: {
        flexDirection: 'column',
        paddingVertical: theme.SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.COLORS.border,
    },
    measurementDetailLabel: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textMedium,
        fontWeight: '600',
        marginBottom: theme.SPACING.xs,
    },
    measurementDetailValue: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textDark,
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
    designImage: {
        width: '100%',
        height: 200, // Adjust height as needed
        borderRadius: theme.BORDERRADIUS.md,
        marginTop: theme.SPACING.sm,
        backgroundColor: theme.COLORS.lightGray, // Added for debugging
        borderWidth: 1, // Added for debugging
        borderColor: theme.COLORS.border, // Added for debugging
    },
});

export default BookingDetailScreen;