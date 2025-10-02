import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

import BackgroundContainer from '../components/BackgroundContainer';
import CollapsibleSection from '../components/CollapsibleSection';
import BookingCard from '../components/BookingCard';
import { useNotification } from '../context/NotificationContext';
import { getApi } from '../utils/api';
import { theme } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { getUserEffectivePermissions, PERMISSIONS } from '../config/permissions';

const ClientDetailScreen = ({ route, navigation }) => {
    const { clientId } = route.params;
    const [client, setClient] = useState(null);
    const [bookingsForClient, setBookingsForClient] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const { user, refreshUser } = useAuth();

    const permissions = useMemo(() => getUserEffectivePermissions(user), [user]);

    const canViewBookings = permissions.includes(PERMISSIONS.BOOKINGS_VIEW);
    const canEditClients = permissions.includes(PERMISSIONS.CLIENTS_EDIT);
    const canViewMeasurements = permissions.includes(PERMISSIONS.MEASUREMENTS_VIEW);
    const canEditMeasurements = permissions.includes(PERMISSIONS.MEASUREMENTS_EDIT);
    const canViewClients = permissions.includes(PERMISSIONS.CLIENTS_VIEW);

    const fetchClientData = useCallback(async () => {
        if (!canViewClients) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const promises = [getApi().get(`/clients/${clientId}`)];
            if (canViewBookings) {
                promises.push(getApi().get(`/bookings?client=${clientId}`));
            }

            const [clientRes, bookingsRes] = await Promise.all(promises);

            setClient(clientRes.data);
            if (bookingsRes) {
                setBookingsForClient(bookingsRes.data);
            }
        } catch (err) {
            console.error('Failed to fetch client data from API:', err);
            showNotification(err.response?.data?.msg || 'Failed to fetch client data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [clientId, showNotification, canViewBookings, canViewClients]);

    useEffect(() => {
        if (canViewClients) {
            fetchClientData();
            const unsubscribe = navigation.addListener('focus', () => {
                fetchClientData();
                refreshUser(); // Refresh user permissions on focus
            });
            return unsubscribe;
        }
    }, [navigation, canViewClients, fetchClientData, refreshUser]);

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

    if (!canViewClients) {
        return (
            <BackgroundContainer>
                <View style={styles.loadingContainer}>
                    <Text style={styles.emptyStateText}>Access Denied</Text>
                    <Text style={styles.emptyStateSubText}>You do not have permission to view this screen.</Text>
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
                    {canEditClients && (
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => navigation.navigate('AddClient', { client: client })} // Remove .toJSON()
                        >
                            <Ionicons name="create-outline" size={20} color={theme.COLORS.textLight} />
                            <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Information</Text>
                    {renderDetailItem('call-outline', 'Phone', client.phone)}
                    {renderDetailItem('mail-outline', 'Email', client.email)}
                    {renderDetailItem('location-outline', 'Address', client.address)}
                    {client.notes && renderDetailItem('document-text-outline', 'Notes', client.notes)}
                </View>

                {canViewMeasurements && (
                    <TouchableOpacity
                        style={styles.section}
                        onPress={() => canEditMeasurements && navigation.navigate('AddEditMeasurement', {
                            measurements: client.measurements || {}, // Remove .toJSON()
                            clientId: clientId,
                        })}
                        disabled={!canEditMeasurements}
                    >
                        <View style={styles.measurementHeader}>
                            <Text style={styles.sectionTitle}>Measurements</Text>
                            {canEditMeasurements && <Ionicons name="chevron-forward-outline" size={24} color={theme.COLORS.primary} />}
                        </View>
                        {client.measurements ? (
                            <View style={styles.measurementsList}>
                                {Object.entries(client.measurements).map(([key, value]) => {
                                    if (!value || (Array.isArray(value) && value.length === 0)) {
                                        return null;
                                    }
                                    const formattedLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, function(str){ return str.toUpperCase(); });
                                    const formattedValue = Array.isArray(value) ? value.join(' - ') : value;
                                    return (
                                        <View style={styles.measurementRow} key={key}>
                                            <Text style={styles.measurementLabel}>{formattedLabel}</Text>
                                            <Text style={styles.measurementValue}>{formattedValue}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        ) : (
                            <Text style={styles.noMeasurementsText}>No measurements recorded. Tap to add.</Text>
                        )}
                    </TouchableOpacity>
                )}

                {canViewBookings && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Booking History</Text>
                        {bookingsForClient.length > 0 ? (
                            <FlatList
                                data={bookingsForClient}
                                renderItem={({ item }) => (
                                    <BookingCard
                                        booking={item}
                                        onView={() => navigation.navigate('BookingDetail', { bookingId: item._id })} // Remove .toHexString()
                                        // Pass other handlers if needed, or disable them
                                    />
                                )}
                                keyExtractor={(item) => item._id} // Remove .toHexString()
                                scrollEnabled={false}
                            />
                        ) : (
                            <Text style={styles.noBookingsText}>No bookings found for this client.</Text>
                        )}
                    </View>
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
        width: '48%',
        flexDirection: 'column',
        marginBottom: theme.SPACING.md,
    },
    measurementLabel: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textMedium,
        fontWeight: '600',
        marginBottom: theme.SPACING.xs,
    },
    measurementValue: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textDark,
    },
    measurementHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    noMeasurementsText: {
        textAlign: 'center',
        color: theme.COLORS.textMedium,
        paddingVertical: theme.SPACING.md,
    },
    measurementsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: theme.SPACING.sm,
    },
});

export default ClientDetailScreen;