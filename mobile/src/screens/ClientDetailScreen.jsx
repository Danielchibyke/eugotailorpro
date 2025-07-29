import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRealm, useObject } from '../config/realmConfig';
import BackgroundContainer from '../components/BackgroundContainer';
import CollapsibleSection from '../components/CollapsibleSection';
import BookingCard from '../components/BookingCard'; // Re-use the BookingCard component
import { useNotification } from '../context/NotificationContext';
import api from '../utils/api';
import { theme } from '../styles/theme';

const ClientDetailScreen = ({ route, navigation }) => {
    const { clientId } = route.params;
    const realm = useRealm();
    const client = useObject('Client', new Realm.BSON.ObjectId(clientId));
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();

    const fetchClientData = useCallback(async () => {
        setLoading(true);
        try {
            const [clientRes, bookingsRes] = await Promise.all([
                api.get(`/clients/${clientId}`),
                api.get(`/bookings?client=${clientId}`), // Assuming the API supports filtering bookings by client
            ]);

            realm.write(() => {
                // Update client data in Realm
                if (client) {
                    client.name = clientRes.data.name;
                    client.email = clientRes.data.email || null;
                    client.phone = clientRes.data.phone;
                    client.address = clientRes.data.address || null;
                    client.notes = clientRes.data.notes || null;
                    client.measurement = clientRes.data.measurement ? {
                        chest: clientRes.data.measurement.chest || [0, 0],
                        waist: clientRes.data.measurement.waist || 0,
                        roundsleeve: clientRes.data.measurement.roundsleeve || [0, 0, 0],
                        shoulder: clientRes.data.measurement.shoulder || 0,
                        toplength: clientRes.data.measurement.toplength || 0,
                        trouserlength: clientRes.data.measurement.trouserlength || 0,
                        thigh: clientRes.data.measurement.thigh || 0,
                        knee: clientRes.data.measurement.knee || 0,
                        ankle: clientRes.data.measurement.ankle || 0,
                        neck: clientRes.data.measurement.neck || 0,
                        sleeveLength: clientRes.data.measurement.sleeveLength || [0, 0, 0],
                    } : {};
                    client.updatedAt = new Date(clientRes.data.updatedAt);
                }

                // Clear existing bookings for this client and add fresh data
                const existingBookingsForClient = realm.objects('Booking').filtered('client._id == $0', new Realm.BSON.ObjectId(clientId));
                realm.delete(existingBookingsForClient);

                bookingsRes.data.forEach(bookingData => {
                    // Ensure client exists in Realm or create it (should already exist from client fetch, but good to be safe)
                    let clientRealmObject = realm.objects('Client').filtered('_id == $0', new Realm.BSON.ObjectId(bookingData.client._id))[0];
                    if (!clientRealmObject) {
                        // This case should ideally not happen if client fetch was successful
                        clientRealmObject = realm.create('Client', {
                            _id: new Realm.BSON.ObjectId(bookingData.client._id),
                            name: bookingData.client.name,
                            phone: bookingData.client.phone,
                            createdBy: new Realm.BSON.ObjectId(bookingData.client.createdBy),
                            createdAt: new Date(bookingData.client.createdAt),
                            updatedAt: new Date(bookingData.client.updatedAt),
                        }, Realm.UpdateMode.Modified);
                    }

                    realm.create('Booking', {
                        _id: new Realm.BSON.ObjectId(bookingData._id),
                        client: clientRealmObject,
                        bookingDate: new Date(bookingData.bookingDate),
                        deliveryDate: new Date(bookingData.deliveryDate),
                        status: bookingData.status,
                        items: bookingData.items || [],
                        totalAmount: bookingData.totalAmount,
                        amountPaid: bookingData.amountPaid,
                        balanceDue: bookingData.balanceDue,
                        notes: bookingData.notes || null,
                        createdBy: new Realm.BSON.ObjectId(bookingData.createdBy),
                        createdAt: new Date(bookingData.createdAt),
                        updatedAt: new Date(bookingData.updatedAt),
                    }, Realm.UpdateMode.Modified);
                });
            });
            showNotification('Client and bookings synced successfully!', 'success');
        } catch (err) {
            console.error('Failed to fetch client data from API:', err);
            showNotification(err.response?.data?.msg || 'Failed to fetch client data. Displaying cached data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [clientId, showNotification, realm, client]);

    useEffect(() => {
        // Initial load is handled by useObject, but we still want to fetch fresh data on focus
        const unsubscribe = navigation.addListener('focus', fetchClientData);
        return unsubscribe;
    }, [navigation, fetchClientData]);

    // Get bookings for this client from Realm
    const bookingsForClient = realm.objects('Booking').filtered('client._id == $0', new Realm.BSON.ObjectId(clientId)).sorted('bookingDate', true);

    const renderDetailItem = (icon, label, value) => (
        <View style={styles.detailItem}>
            <Ionicons name={icon} size={20} color={theme.COLORS.textMedium} />
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{value || 'N/A'}</Text>
        </View>
    );

    if (loading && !client) {
        return (
            <BackgroundContainer>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.COLORS.primary} />
                    <Text style={styles.loadingText}>Loading client details...</Text>
                </View>
            </BackgroundContainer>
        );
    }

    if (!client) {
        return (
            <BackgroundContainer>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Client not found.</Text>
                </View>
            </BackgroundContainer>
        );
    }

    return (
        <BackgroundContainer>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{client.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.headerName}>{client.name}</Text>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => navigation.navigate('AddClient', { client: client.toJSON() })}
                    >
                        <Ionicons name="create-outline" size={20} color={theme.COLORS.textLight} />
                        <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                </View>

                {client.syncStatus === 'pending' && (
                    <View style={styles.syncBanner}>
                        <Text style={styles.syncBannerText}>Awaiting Internet Connection to Sync</Text>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Information</Text>
                    {renderDetailItem('call-outline', 'Phone', client.phone)}
                    {renderDetailItem('mail-outline', 'Email', client.email)}
                    {renderDetailItem('location-outline', 'Address', client.address)}
                    {client.notes && renderDetailItem('document-text-outline', 'Notes', client.notes)}
                </View>

                {client.measurement && (
                    <CollapsibleSection title="Measurements">
                        {Object.entries(client.measurement).map(([key, value]) => (
                             <View style={styles.measurementRow} key={key}>
                                <Text style={styles.measurementLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                                <Text style={styles.measurementValue}>{Array.isArray(value) ? value.join(', ') : value}</Text>
                            </View>
                        ))}
                    </CollapsibleSection>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Booking History</Text>
                    {bookingsForClient.length > 0 ? (
                        <FlatList
                            data={bookingsForClient}
                            renderItem={({ item }) => (
                                <BookingCard
                                    booking={item}
                                    onView={() => navigation.navigate('BookingDetail', { bookingId: item._id.toHexString() })}
                                    // Pass other handlers if needed, or disable them
                                />
                            )}
                            keyExtractor={(item) => item._id.toHexString()}
                            scrollEnabled={false} // To prevent nested scroll views issues
                        />
                    ) : (
                        <Text style={styles.noBookingsText}>No bookings found for this client.</Text>
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
    },
    loadingText: {
        marginTop: theme.SPACING.sm,
        color: theme.COLORS.textMedium,
    },
    content: {
        paddingBottom: 40,
    },
    header: {
        backgroundColor: theme.COLORS.primary,
        padding: theme.SPACING.lg,
        paddingBottom: theme.SPACING.xl + 50,
        alignItems: 'center',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.SPACING.md,
    },
    avatarText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: theme.COLORS.textLight,
    },
    headerName: {
        fontSize: theme.FONT_SIZES.h2,
        fontWeight: 'bold',
        color: theme.COLORS.textLight,
    },
    editButton: {
        position: 'absolute',
        top: theme.SPACING.lg,
        right: theme.SPACING.lg,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
        marginHorizontal: theme.SPACING.md,
        marginTop: 20, 
        marginBottom: theme.SPACING.md,
    },
    sectionTitle: {
        fontSize: theme.FONT_SIZES.h3,
        fontWeight: 'bold',
        color: theme.COLORS.primary,
        marginBottom: theme.SPACING.md,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.SPACING.sm,
    },
    detailLabel: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textMedium,
        marginLeft: theme.SPACING.md,
        fontWeight: '600',
    },
    detailValue: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textDark,
        flex: 1,
        textAlign: 'right',
    },
    measurementRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: theme.SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.COLORS.border,
    },
    measurementLabel: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textMedium,
        fontWeight: '600',
    },
    measurementValue: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textDark,
    },
    noBookingsText: {
        textAlign: 'center',
        color: theme.COLORS.textMedium,
        padding: theme.SPACING.lg,
    },
    syncBanner: {
        backgroundColor: theme.COLORS.warning,
        padding: theme.SPACING.sm,
        borderRadius: theme.BORDERRADIUS.sm,
        marginHorizontal: theme.SPACING.md,
        marginTop: -10,
        marginBottom: theme.SPACING.md,
        alignItems: 'center',
    },
    syncBannerText: {
        color: theme.COLORS.textLight,
        fontWeight: 'bold',
    },
});

export default ClientDetailScreen;
