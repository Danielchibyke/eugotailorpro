import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

const ClientCard = ({ client, onView, onEdit, onDelete }) => {
    const { name, phone, totalBookings, syncStatus } = client;

    const renderSyncStatusIcon = () => {
        if (syncStatus === 'pending') {
            return <Ionicons name="cloud-upload-outline" size={18} color={theme.COLORS.warning} style={styles.syncIcon} />;
        } else if (syncStatus === 'error') {
            return <Ionicons name="alert-circle-outline" size={18} color={theme.COLORS.danger} style={styles.syncIcon} />;
        }
        return null;
    };

    return (
        <TouchableOpacity style={styles.card} onPress={onView}>
            <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.headerTextContainer}>
                    <View style={styles.nameAndStatus}>
                        <Text style={styles.clientName} numberOfLines={1}>{name}</Text>
                        {renderSyncStatusIcon()}
                    </View>
                    <Text style={styles.clientPhone} numberOfLines={1}>{phone}</Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoItem}>
                    <Ionicons name="briefcase-outline" size={16} color={theme.COLORS.textMedium} />
                    <Text style={styles.infoText}>
                        {totalBookings} {totalBookings === 1 ? 'Booking' : 'Bookings'}
                    </Text>
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
        alignItems: 'center',
        marginBottom: theme.SPACING.md,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.SPACING.md,
    },
    avatarText: {
        fontSize: theme.FONT_SIZES.h3,
        fontWeight: 'bold',
        color: theme.COLORS.textLight,
    },
    headerTextContainer: {
        flex: 1,
    },
    clientName: {
        fontSize: theme.FONT_SIZES.lg,
        fontWeight: 'bold',
        color: theme.COLORS.textDark,
    },
    clientPhone: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textMedium,
    },
    cardBody: {
        borderTopWidth: 1,
        borderTopColor: theme.COLORS.border,
        paddingTop: theme.SPACING.md,
        marginBottom: theme.SPACING.md,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoText: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textDark,
        marginLeft: theme.SPACING.sm,
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
    nameAndStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    syncIcon: {
        marginLeft: theme.SPACING.xs,
    },
});

export default ClientCard;
