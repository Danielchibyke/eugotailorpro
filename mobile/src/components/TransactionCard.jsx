import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

const TransactionCard = ({ transaction }) => {
    const isIncome = transaction.type === 'income';
    const amountColor = isIncome ? theme.COLORS.success : theme.COLORS.error;
    const borderColor = isIncome ? theme.COLORS.success : theme.COLORS.error;

    return (
        <View style={[styles.card, { borderLeftColor: borderColor }]}>
            <View style={styles.details}>
                <Text style={styles.description}>{transaction.description}</Text>
                <Text style={styles.date}>{new Date(transaction.date).toLocaleDateString()}</Text>
            </View>
            <Text style={[styles.amount, { color: amountColor }]}>
                {isIncome ? '+' : '-'}${transaction.amount.toFixed(2)}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.COLORS.backgroundCard,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.SPACING.md,
        borderLeftWidth: 5,
    },
    details: {
        flex: 1,
    },
    description: {
        fontSize: theme.FONT_SIZES.body,
        fontWeight: 'bold',
        color: theme.COLORS.textDark,
    },
    date: {
        fontSize: theme.FONT_SIZES.small,
        color: theme.COLORS.textMedium,
    },
    amount: {
        fontSize: theme.FONT_SIZES.body,
        fontWeight: 'bold',
    },
});

export default TransactionCard;