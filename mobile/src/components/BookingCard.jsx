import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { theme } from '../styles/theme';
import ImageZoomModal from './ImageZoomModal';

const { width: screenWidth } = Dimensions.get('window');

const BookingCard = ({ booking, onView, onEdit, onDelete, onComplete }) => {
    const { client, designs, deliveryDate, status, price, payment, syncStatus } = booking;
   
    const [isZoomModalVisible, setIsZoomModalVisible] = useState(false);
    const [zoomedImageIndex, setZoomedImageIndex] = useState(0);

    const openZoomModal = (index) => {
        setZoomedImageIndex(index);
        setIsZoomModalVisible(true);
    };
    const closeZoomModal = () => setIsZoomModalVisible(false);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending':
                return {
                    borderColor: theme.COLORS.warning,
                    color: theme.COLORS.warning,
                };
            case 'In Progress':
                return {
                    borderColor: theme.COLORS.info,
                    color: theme.COLORS.info,
                };
            case 'Completed':
                return {
                    borderColor: theme.COLORS.success,
                    color: theme.COLORS.success,
                };
            case 'Cancelled':
                return {
                    borderColor: theme.COLORS.danger,
                    color: theme.COLORS.danger,
                };
            default:
                return {
                    borderColor: theme.COLORS.textMedium,
                    color: theme.COLORS.textMedium,
                };
        }
    };

    const renderSyncStatusIcon = () => {
        if (syncStatus === 'pending') {
            return <Ionicons name="cloud-upload-outline" size={18} color={theme.COLORS.warning} style={styles.syncIcon} />;
        } else if (syncStatus === 'error') {
            return <Ionicons name="alert-circle-outline" size={18} color={theme.COLORS.danger} style={styles.syncIcon} />;
        }
        return null;
    };

    const statusStyle = getStatusStyle(status);
    const amountRemaining = price - payment;
   

    return (
        <TouchableOpacity style={styles.card} onPress={onView}>
            <View style={styles.cardHeader}>
                <View style={styles.clientNameContainer}>
                    <Text style={styles.clientName} numberOfLines={1}>{client?.name || 'N/A'}</Text>
                    {renderSyncStatusIcon()}
                </View>
                <View style={[styles.statusBadge, { borderColor: statusStyle.borderColor }]}>
                    <Text style={[styles.statusText, { color: statusStyle.color }]}>{status}</Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                {designs && designs.length > 0 && (
                    designs.length === 1 ? (
                        <TouchableOpacity onPress={() => openZoomModal(0)}>
                            <Image source={{ uri: designs[0] }} style={{ width: screenWidth * 0.8, height: 200, resizeMode: 'cover', borderRadius: theme.BORDERRADIUS.sm, marginBottom: theme.SPACING.sm, backgroundColor: theme.COLORS.lightGray, borderWidth: 1, borderColor: theme.COLORS.border }} />
                        </TouchableOpacity>
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.designsScrollView}>
                            {designs.map((designUri, index) => (
                                <TouchableOpacity key={index} onPress={() => openZoomModal(index)}>
                                    <Image source={{ uri: designUri }} style={{ width: designs.length === 2 ? screenWidth * 0.4 : 80, height: designs.length === 2 ? 150 : 80, borderRadius: theme.BORDERRADIUS.sm, marginRight: theme.SPACING.xs, backgroundColor: theme.COLORS.lightGray, borderWidth: 1, borderColor: theme.COLORS.border }} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )
                )}
                <Text style={styles.service} numberOfLines={1}>{booking.notes}</Text>
                <View style={styles.dateContainer}>
                    <Ionicons name="calendar-outline" size={16} color={theme.COLORS.textMedium} />
                    <Text style={styles.dateText}>
                        Due: {dayjs(deliveryDate).format('MMM D, YYYY')}
                    </Text>
                </View>
            </View>

            

            <View style={styles.financials}>
                <View style={styles.financialItem}>
                    <Text style={styles.financialLabel}>Total</Text>
                    <Text style={styles.financialValue}>₦{price?.toFixed(2) || '0.00'}</Text>
                </View>
                <View style={styles.financialItem}>
                    <Text style={styles.financialLabel}>Paid</Text>
                    <Text style={[styles.financialValue, { color: theme.COLORS.success }]}>₦{payment?.toFixed(2) || '0.00'}</Text>
                </View>
                <View style={styles.financialItem}>
                    <Text style={styles.financialLabel}>Due</Text>
                    <Text style={[styles.financialValue, { color: theme.COLORS.danger }]}>₦{amountRemaining?.toFixed(2) || '0.00'}</Text>
                </View>
            </View>

            <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionButton} onPress={onView}>
                    <Ionicons name="eye-outline" size={20} color={theme.COLORS.primary} />
                    <Text style={styles.actionText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
                    <Ionicons name="create-outline" size={20} color={theme.COLORS.info} />
                    <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                {status !== 'Completed' && (
                    <TouchableOpacity style={styles.actionButton} onPress={onComplete}>
                        <Ionicons name="checkmark-circle-outline" size={20} color={theme.COLORS.success} />
                        <Text style={styles.actionText}>Complete</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
                    <Ionicons name="trash-outline" size={20} color={theme.COLORS.danger} />
                    <Text style={styles.actionText}>Delete</Text>
                </TouchableOpacity>
            </View>

            {designs && designs.length > 0 && (
                <ImageZoomModal
                    imageUrl={designs[zoomedImageIndex]}
                    imageUrls={designs}
                    visible={isZoomModalVisible}
                    onClose={closeZoomModal}
                    initialImageIndex={zoomedImageIndex}
                />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.md,
        padding: theme.SPACING.md,
        marginBottom: theme.SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.SPACING.sm,
    },
    clientName: {
        fontSize: theme.FONT_SIZES.lg,
        fontWeight: 'bold',
        color: theme.COLORS.textDark,
        flex: 1,
    },
    statusBadge: {
        borderWidth: 1,
        borderRadius: theme.BORDERRADIUS.sm,
        paddingVertical: 3,
        paddingHorizontal: 8,
    },
    statusText: {
        fontSize: theme.FONT_SIZES.xs,
        fontWeight: '600',
    },
    cardBody: {
        marginBottom: theme.SPACING.md,
    },
    service: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textMedium,
        marginBottom: theme.SPACING.xs,
    },
    designImage: {
        width: '100%',
        height: 300,
        resizeMode: 'cover',
        borderRadius: theme.BORDERRADIUS.sm,
        marginBottom: theme.SPACING.sm,
    },
    designsScrollView: {
        marginBottom: theme.SPACING.sm,
    },
    designImageSmall: {
        width: 80,
        height: 80,
        borderRadius: theme.BORDERRADIUS.sm,
        marginRight: theme.SPACING.xs,
        backgroundColor: theme.COLORS.lightGray,
        borderWidth: 1,
        borderColor: theme.COLORS.border,
    },
    designImageLarge: {
        width: '100%',
        height: 200, // Adjust height as needed
        resizeMode: 'cover',
        borderRadius: theme.BORDERRADIUS.sm,
        marginBottom: theme.SPACING.sm,
        backgroundColor: theme.COLORS.lightGray,
        borderWidth: 1,
        borderColor: theme.COLORS.border,
    },
    designImageLarge: {
        width: '100%',
        height: 200, // Adjust height as needed
        resizeMode: 'cover',
        borderRadius: theme.BORDERRADIUS.sm,
        marginBottom: theme.SPACING.sm,
        backgroundColor: theme.COLORS.lightGray,
        borderWidth: 1,
        borderColor: theme.COLORS.border,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: theme.FONT_SIZES.sm,
        color: theme.COLORS.textMedium,
        marginLeft: theme.SPACING.xs,
    },
    financials: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: theme.COLORS.border,
        paddingTop: theme.SPACING.md,
        marginBottom: theme.SPACING.md,
    },
    financialItem: {
        alignItems: 'center',
    },
    financialLabel: {
        fontSize: theme.FONT_SIZES.sm,
        color: theme.COLORS.textMedium,
    },
    financialValue: {
        fontSize: theme.FONT_SIZES.body,
        fontWeight: '600',
        color: theme.COLORS.textDark,
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: theme.COLORS.border,
        paddingTop: theme.SPACING.md,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionText: {
        marginLeft: theme.SPACING.xs,
        fontSize: theme.FONT_SIZES.sm,
        color: theme.COLORS.textDark,
    },
    
    clientNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    syncIcon: {
        marginLeft: theme.SPACING.xs,
    },
});

export default BookingCard;
