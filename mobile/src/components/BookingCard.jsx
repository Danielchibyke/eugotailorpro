import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

const BookingCard = ({ booking, onView, onEdit, onDelete, onComplete }) => {
    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending':
                return styles.statusPending;
            case 'Completed':
                return styles.statusCompleted;
            case 'Cancelled':
                return styles.statusCancelled;
            default:
                return {};
        }
    };

    return (
        <TouchableOpacity style={styles.card} onPress={() => onView(booking)}>
            <View style={styles.header}>
                <Text style={styles.clientName}>{booking.client.name}</Text>
                <Text style={[styles.status, getStatusStyle(booking.status)]}>{booking.status}</Text>
            </View>
            <View style={styles.body}>
                <Text>Service: {booking.service}</Text>
                <Text>Date: {new Date(booking.bookingDate).toLocaleDateString()}</Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity onPress={() => onEdit(booking)} style={styles.actionButton}>
                    <Ionicons name="create-outline" size={24} color={theme.COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDelete(booking._id)} style={styles.actionButton}>
                    <Ionicons name="trash-outline" size={24} color={theme.COLORS.error} />
                </TouchableOpacity>
                {booking.status === 'Pending' && (
                    <TouchableOpacity onPress={() => onComplete(booking)} style={styles.actionButton}>
                        <Ionicons name="checkmark-circle-outline" size={24} color={theme.COLORS.success} />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.COLORS.backgroundCard,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.md,
        marginBottom: theme.SPACING.md,
        borderLeftWidth: 5,
        borderLeftColor: theme.COLORS.primary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.SPACING.sm,
    },
    clientName: {
        fontSize: theme.FONT_SIZES.h3,
        fontWeight: 'bold',
        color: theme.COLORS.primary,
    },
    status: {
        paddingVertical: theme.SPACING.xs,
        paddingHorizontal: theme.SPACING.sm,
        borderRadius: 12,
        color: '#fff',
        fontSize: theme.FONT_SIZES.small,
    },
    statusPending: {
        backgroundColor: theme.COLORS.accent,
    },
    statusCompleted: {
        backgroundColor: theme.COLORS.success,
    },
    statusCancelled: {
        backgroundColor: theme.COLORS.error,
    },
    body: {
        // Additional styles for the body
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: theme.SPACING.md,
    },
    actionButton: {
        marginLeft: theme.SPACING.md,
    },
});

export default BookingCard;