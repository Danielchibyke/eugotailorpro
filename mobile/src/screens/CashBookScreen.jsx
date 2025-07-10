
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Platform, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotification } from '../context/NotificationContext';
import api from '../utils/api';
import theme from '../styles/theme';
import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';


import BackgroundContainer from '../components/BackgroundContainer';

const CashBookScreen = () => {
  
    const { showNotification } = useNotification();
    const [fullCashBookRows, setFullCashBookRows] = useState([]);
    const [filteredCashBookRows, setFilteredCashBookRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastBalancedDate, setLastBalancedDate] = useState(null);
    const [finalClosingBalance, setFinalClosingBalance] = useState(null);
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
    const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);
    const navigation = useNavigation();
  
    
   

    const fetchFullCashBook = useCallback(async () => {
        setLoading(true);
        try {
            const balancesRes = await api.get('/balances');
            const allBalanceRecords = balancesRes.data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            if (allBalanceRecords.length > 0) {
                setLastBalancedDate(allBalanceRecords[allBalanceRecords.length - 1].lastBalancedDate);
            } else {
                setLastBalancedDate(null);
            }

            const transactionsRes = await api.get('/transactions');
            const allTransactions = transactionsRes.data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            let currentCashBalance = 0;
            let currentBankBalance = 0;
            let lastSegmentEndTime = new Date(0);
            let previousBalanceConceptualDate = new Date(0);

            const generatedRows = [];
            let transactionIndex = 0;

            for (const balanceRecord of allBalanceRecords) {
                const periodEndTimestamp = new Date(balanceRecord.createdAt);
                const segmentStartTimestamp = new Date(lastSegmentEndTime.getTime() + 1);
                const displayBdDate = new Date(previousBalanceConceptualDate.getTime() === 0
                    ? (allTransactions[0]?.date || new Date())
                    : new Date(previousBalanceConceptualDate.getTime() + (24 * 60 * 60 * 1000))
                );
                displayBdDate.setUTCHours(0, 0, 0, 0);

                generatedRows.push({
                    type: 'balanceBd',
                    date: displayBdDate.toLocaleDateString(),
                    particularsDebit: 'Balance b/d',
                    debitCash: currentCashBalance,
                    debitBank: currentBankBalance,
                    isBalancedPeriod: true,
                });

                let segmentIncomeCash = 0;
                let segmentIncomeBank = 0;
                let segmentExpenseCash = 0;
                let segmentExpenseBank = 0;

                while (transactionIndex < allTransactions.length) {
                    const transactionCreatedAt = new Date(allTransactions[transactionIndex].createdAt);

                    if (transactionCreatedAt >= segmentStartTimestamp && transactionCreatedAt <= periodEndTimestamp) {
                        const transaction = allTransactions[transactionIndex];
                        const rowDate = new Date(transaction.date).toLocaleDateString();

                        if (transaction.type === 'income') {
                            segmentIncomeCash += transaction.paymentMethod === 'Cash' ? transaction.amount : 0;
                            segmentIncomeBank += transaction.paymentMethod === 'Bank' ? transaction.amount : 0;
                            generatedRows.push({
                                type: 'transaction',
                                date: rowDate,
                                particularsDebit: transaction.description,
                                voucherNoDebit: transaction.voucherNo || '',
                                debitCash: transaction.paymentMethod === 'Cash' ? transaction.amount : '',
                                debitBank: transaction.paymentMethod === 'Bank' ? transaction.amount : '',
                                particularsCredit: '',
                                voucherNoCredit: '',
                                creditCash: '',
                                creditBank: '',
                                isBalancedPeriod: true,
                            });
                        } else {
                            segmentExpenseCash += transaction.paymentMethod === 'Cash' ? transaction.amount : 0;
                            segmentExpenseBank += transaction.paymentMethod === 'Bank' ? transaction.amount : 0;
                            generatedRows.push({
                                type: 'transaction',
                                date: rowDate,
                                particularsDebit: '',
                                voucherNoDebit: '',
                                debitCash: '',
                                debitBank: '',
                                particularsCredit: transaction.description,
                                voucherNoCredit: transaction.voucherNo || '',
                                creditCash: '',
                                creditBank: '',
                                isBalancedPeriod: true,
                            });
                        }
                        transactionIndex++;
                    } else if (transactionCreatedAt > periodEndTimestamp) {
                        break;
                    } else {
                        transactionIndex++;
                    }
                }

                generatedRows.push({
                    type: 'totals',
                    isBalancedPeriod: true,
                    totalDebitCash: currentCashBalance + segmentIncomeCash,
                    totalDebitBank: currentBankBalance + segmentIncomeBank,
                    totalCreditCash: segmentExpenseCash,
                    totalCreditBank: segmentExpenseBank,
                });

                generatedRows.push({
                    type: 'balanceCd',
                    date: new Date(balanceRecord.lastBalancedDate).toLocaleDateString(),
                    particularsCredit: 'Balance c/d',
                    creditCash: balanceRecord.cashBalance,
                    creditBank: balanceRecord.bankBalance,
                    isBalancedPeriod: true,
                });

                currentCashBalance = balanceRecord.cashBalance;
                currentBankBalance = balanceRecord.bankBalance;
                lastSegmentEndTime = periodEndTimestamp;
                previousBalanceConceptualDate = new Date(balanceRecord.lastBalancedDate);
            }

            const now = new Date();
            const finalSegmentStartTimestamp = new Date(lastSegmentEndTime.getTime() + 1);

            let currentPeriodIncomeCash = 0;
            let currentPeriodIncomeBank = 0;
            let currentPeriodExpenseCash = 0;
            let currentPeriodExpenseBank = 0;
            let foundUnbalancedTransactions = false;

            const transactionsInUnbalancedPeriod = [];
            for (let i = transactionIndex; i < allTransactions.length; i++) {
                const transaction = allTransactions[i];
                const transactionCreatedAt = new Date(transaction.createdAt);

                if (transactionCreatedAt >= finalSegmentStartTimestamp && transactionCreatedAt <= now) {
                    transactionsInUnbalancedPeriod.push(transaction);
                    foundUnbalancedTransactions = true;
                }
            }

            if (foundUnbalancedTransactions) {
                const unbalancedBdDisplayDate = new Date(previousBalanceConceptualDate.getTime() === 0
                    ? (allTransactions[0]?.date || now)
                    : new Date(previousBalanceConceptualDate.getTime() + (24 * 60 * 60 * 1000))
                );
                unbalancedBdDisplayDate.setUTCHours(0, 0, 0, 0);

                generatedRows.push({
                    type: 'balanceBd',
                    date: unbalancedBdDisplayDate.toLocaleDateString(),
                    particularsDebit: 'Balance b/d',
                    debitCash: currentCashBalance,
                    debitBank: currentBankBalance,
                    isBalancedPeriod: false,
                });

                transactionsInUnbalancedPeriod.forEach(transaction => {
                    const rowDate = new Date(transaction.date).toLocaleDateString();

                    if (transaction.type === 'income') {
                        currentPeriodIncomeCash += transaction.paymentMethod === 'Cash' ? transaction.amount : 0;
                        currentPeriodIncomeBank += transaction.paymentMethod === 'Bank' ? transaction.amount : 0;
                        generatedRows.push({
                            type: 'transaction',
                            date: rowDate,
                            particularsDebit: transaction.description,
                            voucherNoDebit: transaction.voucherNo || '',
                            debitCash: transaction.paymentMethod === 'Cash' ? transaction.amount : '',
                            debitBank: transaction.paymentMethod === 'Bank' ? transaction.amount : '',
                            particularsCredit: '',
                            voucherNoCredit: '',
                            creditCash: '',
                            creditBank: '',
                            isBalancedPeriod: false,
                        });
                    } else {
                        currentPeriodExpenseCash += transaction.paymentMethod === 'Cash' ? transaction.amount : 0;
                        currentPeriodExpenseBank += transaction.paymentMethod === 'Bank' ? transaction.amount : 0;
                        generatedRows.push({
                            type: 'transaction',
                            date: rowDate,
                            particularsDebit: '',
                            voucherNoDebit: '',
                            debitCash: '',
                            debitBank: '',
                            particularsCredit: transaction.description,
                            voucherNoCredit: transaction.voucherNo || '',
                            creditCash: '',
                            creditBank: '',
                            isBalancedPeriod: false,
                        });
                    }
                });

                const finalCashBalance = currentCashBalance + currentPeriodIncomeCash - currentPeriodExpenseCash;
                const finalBankBalance = currentBankBalance + currentPeriodIncomeBank - currentPeriodExpenseBank;
                setFinalClosingBalance({ cash: finalCashBalance, bank: finalBankBalance });

                generatedRows.push({
                    type: 'totals',
                    isBalancedPeriod: false,
                    totalDebitCash: currentCashBalance + currentPeriodIncomeCash,
                    totalDebitBank: currentBankBalance + currentPeriodIncomeBank,
                    totalCreditCash: currentPeriodExpenseCash,
                    totalCreditBank: currentPeriodExpenseBank,
                });

                generatedRows.push({
                    type: 'balanceCd',
                    date: new Date().toLocaleDateString(),
                    particularsCredit: 'Balance c/d',
                    creditCash: finalCashBalance,
                    creditBank: finalBankBalance,
                    isBalancedPeriod: false,
                });
            } else {
                setFinalClosingBalance({ cash: currentCashBalance, bank: currentBankBalance });
            }

            setFullCashBookRows(generatedRows);
        } catch (error) {
            console.error('Error fetching full cashbook data:', error);
            showNotification(error.response?.data?.message || 'Failed to fetch full cashbook data', 'error');
            setFullCashBookRows([]);
            setFinalClosingBalance(null);
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchFullCashBook();
        });
        return unsubscribe;
    }, [navigation, fetchFullCashBook]);

    useEffect(() => {
        if (fullCashBookRows.length === 0) {
            setFilteredCashBookRows([]);
            return;
        }

        let startFilterDate = filterStartDate ? new Date(filterStartDate) : null;
        if (startFilterDate) startFilterDate.setUTCHours(0, 0, 0, 0);

        let endFilterDate = filterEndDate ? new Date(filterEndDate) : null;
        if (endFilterDate) endFilterDate.setUTCHours(23, 59, 59, 999);

        const tempFilteredRows = fullCashBookRows.filter(row => {
            if (!startFilterDate && !endFilterDate) {
                return true;
            }

            const rowDate = row.date ? new Date(row.date) : null;

            if (rowDate) {
                const isAfterStartDate = startFilterDate ? rowDate >= startFilterDate : true;
                const isBeforeEndDate = endFilterDate ? rowDate <= endFilterDate : true;
                return isAfterStartDate && isBeforeEndDate;
            }
            return false;
        });

        setFilteredCashBookRows(tempFilteredRows);
    }, [fullCashBookRows, filterStartDate, filterEndDate]);

    const handleBalanceCashBook = async () => {
        setLoading(true);
        try {
            const balancesRes = await api.get('/balances');
            const allBalanceRecords = balancesRes.data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            let currentCashBalanceAtLastBalance = 0;
            let currentBankBalanceAtLastBalance = 0;
            let lastBalancedTimestamp = new Date(0);

            if (allBalanceRecords.length > 0) {
                const lastBalancedRecord = allBalanceRecords[allBalanceRecords.length - 1];
                currentCashBalanceAtLastBalance = lastBalancedRecord.cashBalance;
                currentBankBalanceAtLastBalance = lastBalancedRecord.bankBalance;
                lastBalancedTimestamp = new Date(lastBalancedRecord.createdAt);
            }

            const newPeriodStartTimestamp = new Date(lastBalancedTimestamp.getTime() + 1);
            const now = new Date();

            const transactionsRes = await api.get('/transactions');
            const allTransactions = transactionsRes.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            let currentPeriodIncomeCash = 0;
            let currentPeriodIncomeBank = 0;
            let currentPeriodExpenseCash = 0;
            let currentPeriodExpenseBank = 0;
            let foundTransactionsToBalance = false;

            for (let i = 0; i < allTransactions.length; i++) {
                const transaction = allTransactions[i];
                const transactionCreatedAt = new Date(transaction.createdAt);

                if (transactionCreatedAt < newPeriodStartTimestamp) {
                    break;
                }

                if (transactionCreatedAt >= newPeriodStartTimestamp && transactionCreatedAt <= now) {
                    foundTransactionsToBalance = true;
                    if (transaction.type === 'income') {
                        currentPeriodIncomeCash += transaction.paymentMethod === 'Cash' ? transaction.amount : 0;
                        currentPeriodIncomeBank += transaction.paymentMethod === 'Bank' ? transaction.amount : 0;
                    } else {
                        currentPeriodExpenseCash += transaction.paymentMethod === 'Cash' ? transaction.amount : 0;
                        currentPeriodExpenseBank += transaction.paymentMethod === 'Bank' ? transaction.amount : 0;
                    }
                }
            }

            if (!foundTransactionsToBalance) {
                showNotification('No new transactions to balance since the last record.', 'info');
                setLoading(false);
                return;
            }

            const newClosingCashBalance = currentCashBalanceAtLastBalance + currentPeriodIncomeCash - currentPeriodExpenseCash;
            const newClosingBankBalance = currentBankBalanceAtLastBalance + currentPeriodIncomeBank - currentPeriodExpenseBank;

            const balanceRes = await api.post('/balances/setLastBalancedDate', {
                date: now.toISOString().split('T')[0],
                cashBalance: newClosingCashBalance,
                bankBalance: newClosingBankBalance,
            });
            showNotification('Cashbook balanced successfully for new transactions!', 'success');
            fetchFullCashBook();

        } catch (error) {
            console.error('Error balancing cashbook:', error);
            showNotification(error.response?.data?.message || 'Failed to balance cashbook', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.COLORS.primary} />
                <Text>Loading cashbook...</Text>
            </View>
        );
    }

    return (
        <BackgroundContainer>
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Cashbook</Text>
                <View style={styles.headerInfo}>
                    <Text style={styles.infoText}>Last Balanced: {lastBalancedDate ? new Date(lastBalancedDate).toLocaleDateString() : 'N/A'}</Text>
                    {finalClosingBalance && (
                        <Text style={styles.balanceText}>
                            Final Balance: {finalClosingBalance.cash.toFixed(2)} (Cash), {finalClosingBalance.bank.toFixed(2)} (Bank)
                        </Text>
                    )}
                </View>
                <TouchableOpacity style={styles.balanceButton} onPress={handleBalanceCashBook}>
                    <Text style={styles.balanceButtonText}>Balance Now</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.filterContainer}>
                <TouchableOpacity
                    onPress={() => setStartDatePickerVisible(true)}
                    style={styles.dateInputButton}
                >
                    <Text style={styles.dateInputText}>{filterStartDate ? dayjs(filterStartDate).format('YYYY-MM-DD') : 'Start Date'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setEndDatePickerVisible(true)}
                    style={styles.dateInputButton}
                >
                    <Text style={styles.dateInputText}>{filterEndDate ? dayjs(filterEndDate).format('YYYY-MM-DD') : 'End Date'}</Text>
                </TouchableOpacity>
            </View>

            {isStartDatePickerVisible && (
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={isStartDatePickerVisible}
                    onRequestClose={() => setStartDatePickerVisible(false)}
                >
                    <View style={styles.centeredView}>
                        <View style={styles.modalView}>
                            <DateTimePicker
                                date={filterStartDate ? dayjs(filterStartDate) : dayjs()} // Default to today if no date is set
                                value={dayjs(filterStartDate)} // Works with Day.js objects
                                mode="single"
                                minimumDate={dayjs().subtract(1, "year")}
                                maximumDate={dayjs().add(1, "year")}
                                onChange={(date) => {
                                setStartDatePickerVisible(false);
                                    setFilterStartDate(date.date); // Convert Day.js object to Date
                                }}
                                style={{
                                    width: "100%",
                                    backgroundColor: theme.COLORS.backgroundCard,
                                    borderRadius: theme.BORDERRADIUS.md,
                                    padding: theme.SPACING.md,
                                }}
                                calendarTextStyle={{ color: theme.COLORS.textDark }}
                                headerTextStyle={{
                                    color: theme.COLORS.textDark,
                                    fontWeight: "bold",
                                    fontSize: theme.FONT_SIZES.title,
                                }}
                                selectedItemColor={theme.COLORS.primary}
                                weekdaysTextStyle={{ color: theme.COLORS.textMedium }}
                                monthTextStyle={{ color: theme.COLORS.textDark }}
                                yearTextStyle={{ color: theme.COLORS.textDark }}
                                dayTextStyle={{ color: theme.COLORS.textLight }}
                                todayTextStyle={{
                                    color: theme.COLORS.primary,
                                    fontWeight: "bold",
                                }}
                                selectedTextStyle={{
                                    color: theme.COLORS.textLight,
                                    fontWeight: "bold",
                                }}
                                selectedItemBackgroundColor={theme.COLORS.primary}
                                arrowColor={theme.COLORS.primary}
                                display={Platform.OS === "ios" ? "inline" : "default"}
                            />
                            <TouchableOpacity style={styles.closeButton} onPress={() => setStartDatePickerVisible(false)}>
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}

            {isEndDatePickerVisible && (
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={isEndDatePickerVisible}
                    onRequestClose={() => setEndDatePickerVisible(false)}
                >
                    <View style={styles.centeredView}>
                        <View style={styles.modalView}>
                            <DateTimePicker
                                date={filterEndDate ? dayjs(filterEndDate) : dayjs()} // Default to today if no date is set
                                value={dayjs(filterEndDate)} // Works with Day.js objects
                                mode="single"
                                minimumDate={dayjs().subtract(1, "year")}
                                maximumDate={dayjs().add(1, "year")}
                                onChange={(date) => {
                                setEndDatePickerVisible(false);
                                setFilterEndDate(date.date); // Convert Day.js object to Date   
                                }}
                                style={{
                                    width: "100%",
                                    backgroundColor: theme.COLORS.backgroundCard,
                                    borderRadius: theme.BORDERRADIUS.md,
                                    padding: theme.SPACING.md,
                                }}
                                calendarTextStyle={{ color: theme.COLORS.textDark }}
                                headerTextStyle={{
                                    color: theme.COLORS.textDark,
                                    fontWeight: "bold",
                                    fontSize: theme.FONT_SIZES.title,
                                }}
                                selectedItemColor={theme.COLORS.primary}
                                weekdaysTextStyle={{ color: theme.COLORS.textMedium }}
                                monthTextStyle={{ color: theme.COLORS.textDark }}
                                yearTextStyle={{ color: theme.COLORS.textDark }}
                                dayTextStyle={{ color: theme.COLORS.textLight }}
                                todayTextStyle={{
                                    color: theme.COLORS.primary,
                                    fontWeight: "bold",
                                }}
                                selectedTextStyle={{
                                    color: theme.COLORS.textLight,
                                    fontWeight: "bold",
                                }}
                                selectedItemBackgroundColor={theme.COLORS.primary}
                                arrowColor={theme.COLORS.primary}
                                display={Platform.OS === "ios" ? "inline" : "default"}
                            />
                            <TouchableOpacity style={styles.closeButton} onPress={() => setEndDatePickerVisible(false)}>
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}

            <ScrollView horizontal contentContainerStyle={{ flexGrow: 1 }}>
                <View style={styles.tableContainer}>
                    {/* Sticky Header */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, styles.dateHeader]}>Date</Text>
                        <Text style={[styles.tableHeaderCell, styles.particularsHeader]}>Particulars</Text>
                        <Text style={[styles.tableHeaderCell, styles.voucherHeader]}>V.No</Text>
                        <Text style={[styles.tableHeaderCell, styles.amountHeader]}>Cash</Text>
                        <Text style={[styles.tableHeaderCell, styles.amountHeader, styles.bankHeader]}>Bank</Text>
                        
                        <View style={styles.divider} />

                        <Text style={[styles.tableHeaderCell, styles.particularsHeader]}>Particulars</Text>
                        <Text style={[styles.tableHeaderCell, styles.voucherHeader]}>V.No</Text>
                        <Text style={[styles.tableHeaderCell, styles.amountHeader]}>Cash</Text>
                        <Text style={[styles.tableHeaderCell, styles.amountHeader]}>Bank</Text>
                    </View>

                    <ScrollView>
                        {filteredCashBookRows.map((row, index) => {
                            const rowStyle = [
                                styles.tableRow,
                                index % 2 === 0 ? styles.evenRow : styles.oddRow,
                                row.type === 'balanceBd' || row.type === 'balanceCd' ? styles.balanceRow : {},
                                row.type === 'totals' ? styles.totalsRow : {},
                                row.isBalancedPeriod ? styles.balancedPeriodRow : {},
                            ];

                            return (
                                <View key={index} style={rowStyle}>
                                    <Text style={[styles.tableCell, styles.dateCell]}>{row.date}</Text>
                                    
                                    {/* Debit Side */}
                                    <Text style={[styles.tableCell, styles.particularsCell]}>{row.particularsDebit}</Text>
                                    <Text style={[styles.tableCell, styles.voucherCell]}>{row.voucherNoDebit}</Text>
                                    <Text style={[styles.tableCell, styles.amountCell]}>{row.debitCash !== '' && row.debitCash !== undefined ? row.debitCash.toFixed(2) : ''}</Text>
                                    <Text style={[styles.tableCell, styles.amountCell, styles.bankCell]}>{row.debitBank !== '' && row.debitBank !== undefined ? row.debitBank.toFixed(2) : ''}</Text>

                                    <View style={styles.divider} />

                                    {/* Credit Side */}
                                    <Text style={[styles.tableCell, styles.particularsCell]}>{row.particularsCredit}</Text>
                                    <Text style={[styles.tableCell, styles.voucherCell]}>{row.voucherNoCredit}</Text>
                                    <Text style={[styles.tableCell, styles.amountCell]}>{row.creditCash !== '' && row.creditCash !== undefined ? row.creditCash.toFixed(2) : ''}</Text>
                                    <Text style={[styles.tableCell, styles.amountCell]}>{row.creditBank !== '' && row.creditBank !== undefined ? row.creditBank.toFixed(2) : ''}</Text>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>
            </ScrollView>
        </BackgroundContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.COLORS.backgroundApp,
    },
    headerContainer: {
        backgroundColor: theme.COLORS.primary,
        padding: theme.SPACING.lg,
        borderBottomLeftRadius: theme.BORDERRADIUS.lg,
        borderBottomRightRadius: theme.BORDERRADIUS.lg,
    },
    headerTitle: {
        fontSize: theme.FONT_SIZES.h1,
        fontWeight: 'bold',
        color: theme.COLORS.textLight,
        textAlign: 'center',
        marginBottom: theme.SPACING.md,
    },
    headerInfo: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: theme.BORDERRADIUS.md,
        padding: theme.SPACING.md,
        marginBottom: theme.SPACING.md,
    },
    infoText: {
        color: theme.COLORS.textLight,
        fontSize: theme.FONT_SIZES.body,
        textAlign: 'center',
    },
    balanceText: {
        color: theme.COLORS.textLight,
        fontSize: theme.FONT_SIZES.lg,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: theme.SPACING.sm,
    },
    balanceButton: {
        backgroundColor: theme.COLORS.success,
        paddingVertical: theme.SPACING.md,
        borderRadius: theme.BORDERRADIUS.md,
        alignItems: 'center',
    },
    balanceButtonText: {
        color: theme.COLORS.textLight,
        fontWeight: 'bold',
        fontSize: theme.FONT_SIZES.lg,
    },
    tableContainer: {
        flex: 1,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: theme.COLORS.backgroundCard,
        paddingVertical: 10,
        borderBottomWidth: 2,
        borderBottomColor: theme.COLORS.primary,
    },
    tableHeaderCell: {
        fontWeight: 'bold',
        textAlign: 'center',
        paddingHorizontal: 5,
        color: theme.COLORS.textDark,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.COLORS.border,
        alignItems: 'center',
    },
    evenRow: {
        backgroundColor: theme.COLORS.backgroundLight,
    },
    oddRow: {
        backgroundColor: theme.COLORS.backgroundCard,
    },
    tableCell: {
        paddingHorizontal: 5,
    },
    dateHeader: {
        width: 80,
    },
    particularsHeader: {
        flex: 1,
        minWidth: 120,
    },
    voucherHeader: {
        width: 50,
    },
    amountHeader: {
        width: 80,
        textAlign: 'right',
    },
    bankHeader: {
        marginRight: 5, // Space before divider
    },
    dateCell: {
        width: 80,
        fontSize: theme.FONT_SIZES.sm,
        color: theme.COLORS.textMedium,
    },
    particularsCell: {
        flex: 1,
        minWidth: 120,
    },
    voucherCell: {
        width: 50,
        textAlign: 'center',
    },
    amountCell: {
        width: 80,
        textAlign: 'right',
        fontWeight: '500',
    },
    bankCell: {
        marginRight: 5, // Space before divider
    },
    balanceRow: {
        backgroundColor: theme.COLORS.backgroundAccent,
    },
    totalsRow: {
        backgroundColor: theme.COLORS.backgroundAccent,
        borderTopWidth: 2,
        borderBottomWidth: 2,
        borderColor: theme.COLORS.primary,
    },
    balancedPeriodRow: {
        // Example: a subtle tint for balanced rows
        backgroundColor: '#e8f5e9', // A light green tint
    },
    divider: {
        width: 2,
        backgroundColor: theme.COLORS.primary,
        height: '100%',
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 10,
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)", // Add overlay background
      },
    modalView: {
        width: "90%",
        backgroundColor: theme.COLORS.primary,
        borderRadius: theme.BORDERRADIUS.md,
        padding: theme.SPACING.lg,
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      },
      modalTitle: {
        fontSize: theme.FONT_SIZES.h2,
        marginBottom: theme.SPACING.lg,
        textAlign: "center",
        fontWeight: "bold",
        color: theme.COLORS.textLight,
      },
    dateInputButton: {
        backgroundColor: theme.COLORS.backgroundCard,
        padding: 10,
        borderRadius: 5,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                borderWidth: 1,
                borderColor: theme.COLORS.border,
            },
            android: {
                // No specific Android styles needed for now
            },
        }),
    },
    dateInputText: {
        color: theme.COLORS.textDark,
        fontSize: theme.FONT_SIZES.body,
        fontWeight: "bold",
        textAlign: "center",
        height: 45,
        lineHeight: 45, // Center text vertically
        ...Platform.select({
            ios: {
                color: theme.COLORS.textDark, // Use textDark for iOS
            },
            android: {
                color: theme.COLORS.textDark, // Use textDark for Android
            },
        }),
    },
});

export default CashBookScreen;
