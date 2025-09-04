
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../styles/theme';

const TransactionCard = ({ transaction }) => {
    const isIncome = transaction.type === 'income';
    const amountColor = isIncome ? theme.COLORS.success : theme.COLORS.danger;
    const iconName = isIncome ? 'arrow-up-circle' : 'arrow-down-circle';

    const renderSyncStatusIcon = () => {
        if (transaction.syncStatus === 'pending') {
            return <Ionicons name="cloud-upload-outline" size={16} color={theme.COLORS.warning} style={styles.syncIcon} />;
        } else if (transaction.syncStatus === 'error') {
            return <Ionicons name="alert-circle-outline" size={16} color={theme.COLORS.danger} style={styles.syncIcon} />;
        }
        return null;
    };

    return (
        <View style={styles.card}>
            <View style={styles.row}>
                <View style={styles.descriptionContainer}>
                    <Ionicons name={iconName} size={24} color={amountColor} style={styles.icon} />
                    <View style={styles.descriptionWrapper}>
                        <View style={styles.descriptionAndStatus}>
                            <Text style={styles.description}>{transaction.description}</Text>
                            {renderSyncStatusIcon()}
                        </View>
                        <Text style={styles.date}>{new Date(transaction.date).toLocaleDateString()}</Text>
                    </View>
                </View>
                <View style={styles.amountContainer}>
                    <Text style={[styles.amount, { color: amountColor }]} numberOfLines={1} adjustsFontSizeToFit={true}>
                        {isIncome ? '+' : '-'} ₦{transaction.amount.toFixed(2)}
                    </Text>
                    <Text style={styles.paymentMethod}>{transaction.paymentMethod}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.md,
        padding: theme.SPACING.md,
        marginVertical: theme.SPACING.xs,
        marginHorizontal: theme.SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    descriptionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1, // Take up available space
        marginRight: theme.SPACING.sm, // Add margin to prevent touching the amount
    },
    icon: {
        marginRight: theme.SPACING.sm,
    },
    descriptionWrapper: {
        flexShrink: 1, // Allow this container to shrink
    },
    description: {
        fontSize: theme.FONT_SIZES.body,
        fontWeight: '500',
        color: theme.COLORS.textDark,
        flexWrap: 'wrap', // Allow text to wrap
    },
    date: {
        fontSize: theme.FONT_SIZES.sm,
        color: theme.COLORS.textMedium,
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: theme.FONT_SIZES.lg,
        fontWeight: 'bold',
    },
    paymentMethod: {
        fontSize: theme.FONT_SIZES.sm,
        color: theme.COLORS.textMedium,
    },
    descriptionAndStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
    },
    syncIcon: {
        marginLeft: theme.SPACING.xs,
    },
});

export default TransactionCard;
