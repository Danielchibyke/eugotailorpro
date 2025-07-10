import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { theme } from '../styles/theme';

const BookingCard = ({ booking, onView, onEdit, onDelete, onComplete }) => {
    const { client, service, deliveryDate, status, price, payment } = booking;

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

    const statusStyle = getStatusStyle(status);
    const amountRemaining = price - payment;

    return (
        <TouchableOpacity style={styles.card} onPress={onView}>
            <View style={styles.cardHeader}>
                <Text style={styles.clientName} numberOfLines={1}>{client?.name || 'N/A'}</Text>
                <View style={[styles.statusBadge, { borderColor: statusStyle.borderColor }]}>
                    <Text style={[styles.statusText, { color: statusStyle.color }]}>{status}</Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <Text style={styles.service} numberOfLines={1}>{service}</Text>
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
});

export default BookingCard;
