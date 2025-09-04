import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getApi } from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import BackgroundContainer from '../components/BackgroundContainer';
import { theme } from '../styles/theme';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';

const ReportsScreen = ({ navigation }) => {
    const [transactions, setTransactions] = useState([]);
    const { showNotification } = useNotification();

    const fetchTransactions = useCallback(async () => {
        try {
            const { data: transactionsData } = await getApi().get('/transactions');
            setTransactions(data);
        } catch (error) {
            showNotification(error.response?.data?.msg || 'Failed to fetch transactions.', 'error');
        }
    }, [showNotification]);

    useEffect(() => {
        fetchTransactions();
        const unsubscribe = navigation.addListener('focus', fetchTransactions);
        return unsubscribe;
    }, [navigation, fetchTransactions]);
    const [filterStartDate, setFilterStartDate] = useState(null);
    const [filterEndDate, setFilterEndDate] = useState(null);
    const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
    const [currentPicker, setCurrentPicker] = useState(null);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(transaction => {
            const transactionDate = dayjs(transaction.date);
            const start = filterStartDate ? dayjs(filterStartDate) : null;
            const end = filterEndDate ? dayjs(filterEndDate) : null;

            return (
                (!start || transactionDate.isSameOrAfter(start, 'day')) &&
                (!end || transactionDate.isSameOrBefore(end, 'day'))
            );
        });
    }, [transactions, filterStartDate, filterEndDate]);

    const totalIncome = useMemo(() => {
        return filteredTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
    }, [filteredTransactions]);

    const totalExpense = useMemo(() => {
        return filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
    }, [filteredTransactions]);

    const netBalance = totalIncome - totalExpense;

    const handleDateSelect = (params) => {
        const selectedDate = params.date;
        if (currentPicker === 'start') {
            setFilterStartDate(selectedDate);
        } else if (currentPicker === 'end') {
            setFilterEndDate(selectedDate);
        }
        setIsDatePickerVisible(false);
    };

    const clearFilters = () => {
        setFilterStartDate(null);
        setFilterEndDate(null);
    };

    return (
        <BackgroundContainer>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={theme.COLORS.textDark} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Financial Reports</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.filterContainer}>
                    <TouchableOpacity
                        style={styles.dateInput}
                        onPress={() => { setCurrentPicker('start'); setIsDatePickerVisible(true); }}
                    >
                        <Text style={styles.dateInputText}>
                            {filterStartDate ? dayjs(filterStartDate).format('YYYY-MM-DD') : 'Start Date'}
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.dateSeparator}>to</Text>
                    <TouchableOpacity
                        style={styles.dateInput}
                        onPress={() => { setCurrentPicker('end'); setIsDatePickerVisible(true); }}
                    >
                        <Text style={styles.dateInputText}>
                            {filterEndDate ? dayjs(filterEndDate).format('YYYY-MM-DD') : 'End Date'}
                        </Text>
                    </TouchableOpacity>
                    {(filterStartDate || filterEndDate) && (
                        <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
                            <Ionicons name="close-circle-outline" size={24} color={theme.COLORS.danger} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Overview</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Income:</Text>
                        <Text style={[styles.summaryValue, styles.incomeText]}>₦{totalIncome.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Expense:</Text>
                        <Text style={[styles.summaryValue, styles.expenseText]}>₦{totalExpense.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Net Balance:</Text>
                        <Text style={[styles.summaryValue, netBalance >= 0 ? styles.incomeText : styles.expenseText]}>₦{netBalance.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Future: Add charts here */}

                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={isDatePickerVisible}
                    onRequestClose={() => setIsDatePickerVisible(false)}
                >
                    <View style={styles.datePickerOverlay}>
                        <View style={styles.datePickerModalView}>
                            <DateTimePicker
                                date={currentPicker === 'start' ? (filterStartDate ? dayjs(filterStartDate) : dayjs()) : (filterEndDate ? dayjs(filterEndDate) : dayjs())}
                                mode="single"
                                onChange={handleDateSelect}
                            />
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setIsDatePickerVisible(false)}
                            >
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </BackgroundContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: theme.SPACING.md,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.SPACING.lg,
    },
    headerTitle: {
        fontSize: theme.FONT_SIZES.h2,
        fontWeight: 'bold',
        color: theme.COLORS.primary,
    },
    filterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.md,
        padding: theme.SPACING.sm,
        marginBottom: theme.SPACING.lg,
    },
    dateInput: {
        flex: 1,
        padding: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.sm,
        backgroundColor: theme.COLORS.backgroundApp,
        marginHorizontal: theme.SPACING.xs,
    },
    dateInputText: {
        textAlign: 'center',
        color: theme.COLORS.textDark,
        fontSize: theme.FONT_SIZES.body,
    },
    dateSeparator: {
        marginHorizontal: theme.SPACING.xs,
        color: theme.COLORS.textMedium,
        fontWeight: 'bold',
    },
    clearButton: {
        padding: theme.SPACING.xs,
    },
    summaryCard: {
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.md,
        padding: theme.SPACING.lg,
        marginBottom: theme.SPACING.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    summaryTitle: {
        fontSize: theme.FONT_SIZES.h3,
        fontWeight: 'bold',
        color: theme.COLORS.primary,
        marginBottom: theme.SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.COLORS.border,
        paddingBottom: theme.SPACING.sm,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.SPACING.sm,
    },
    summaryLabel: {
        fontSize: theme.FONT_SIZES.body,
        color: theme.COLORS.textDark,
        fontWeight: '600',
    },
    summaryValue: {
        fontSize: theme.FONT_SIZES.h3,
        fontWeight: 'bold',
    },
    incomeText: {
        color: theme.COLORS.success,
    },
    expenseText: {
        color: theme.COLORS.danger,
    },
    datePickerOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    datePickerModalView: {
        backgroundColor: theme.COLORS.backgroundCard,
        borderRadius: theme.BORDERRADIUS.lg,
        padding: theme.SPACING.lg,
    },
    closeButton: {
        marginTop: theme.SPACING.md,
        padding: theme.SPACING.sm,
        backgroundColor: theme.COLORS.primary,
        borderRadius: theme.BORDERRADIUS.md,
        alignItems: 'center',
    },
    closeButtonText: {
        color: theme.COLORS.textLight,
        fontWeight: 'bold',
    },
});

export default ReportsScreen;
