
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotification } from '../context/NotificationContext';
import api from '../utils/api';
import theme from '../styles/theme';

const CashBookScreen = () => {
    const navigation = useNavigation();
    const { showNotification } = useNotification();
    const [fullCashBookRows, setFullCashBookRows] = useState([]);
    const [filteredCashBookRows, setFilteredCashBookRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastBalancedDate, setLastBalancedDate] = useState(null);
    const [finalClosingBalance, setFinalClosingBalance] = useState(null);
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

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
                                creditCash: transaction.paymentMethod === 'Cash' ? transaction.amount : '',
                                creditBank: transaction.paymentMethod === 'Bank' ? transaction.amount : '',
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
                            creditCash: transaction.paymentMethod === 'Cash' ? transaction.amount : '',
                            creditBank: transaction.paymentMethod === 'Bank' ? transaction.amount : '',
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
        fetchFullCashBook();
    }, [fetchFullCashBook]);

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
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Full Cashbook Ledger</Text>
                {lastBalancedDate && (
                    <Text style={styles.lastBalancedInfo}>Last Balanced: {new Date(lastBalancedDate).toLocaleDateString()}</Text>
                )}
                <TouchableOpacity style={styles.balanceButton} onPress={handleBalanceCashBook}>
                    <Text style={styles.balanceButtonText}>Balance Cashbook Up to Today</Text>
                </TouchableOpacity>
            </View>

            <ScrollView horizontal>
                <ScrollView>
                    <View>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderCell, styles.dateHeader]}>Date</Text>
                            <Text style={[styles.tableHeaderCell, styles.particularsHeader]}>Particulars (Debit)</Text>
                            <Text style={[styles.tableHeaderCell, styles.voucherHeader]}>Voucher No.</Text>
                            <Text style={[styles.tableHeaderCell, styles.amountHeader]}>Cash (NGN)</Text>
                            <Text style={[styles.tableHeaderCell, styles.amountHeader]}>Bank (NGN)</Text>
                            <Text style={[styles.tableHeaderCell, styles.particularsHeader]}>Particulars (Credit)</Text>
                            <Text style={[styles.tableHeaderCell, styles.voucherHeader]}>Voucher No.</Text>
                            <Text style={[styles.tableHeaderCell, styles.amountHeader]}>Cash (NGN)</Text>
                            <Text style={[styles.tableHeaderCell, styles.amountHeader]}>Bank (NGN)</Text>
                        </View>
                        <ScrollView>
                            {filteredCashBookRows.map((row, index) => {
                                let rowStyle = styles.tableRow;
                                if (row.type === 'balanceBd' || row.type === 'balanceCd') {
                                    rowStyle = [rowStyle, styles.balanceRow];
                                }
                                if (row.type === 'totals') {
                                    rowStyle = [rowStyle, styles.totalsRow];
                                }
                                if (row.isBalancedPeriod) {
                                    rowStyle = [rowStyle, styles.balancedPeriodRow];
                                }

                                return (
                                    <View key={index} style={rowStyle}>
                                        <Text style={[styles.tableCell, styles.dateCell]}>{row.date}</Text>
                                        <Text style={[styles.tableCell, styles.particularsCell]}>{row.particularsDebit}</Text>
                                        <Text style={[styles.tableCell, styles.voucherCell]}>{row.voucherNoDebit}</Text>
                                        <Text style={[styles.tableCell, styles.amountCell]}>{row.debitCash !== '' && row.debitCash !== undefined ? row.debitCash.toFixed(2) : ''}</Text>
                                        <Text style={[styles.tableCell, styles.amountCell]}>{row.debitBank !== '' && row.debitBank !== undefined ? row.debitBank.toFixed(2) : ''}</Text>
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
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.COLORS.backgroundApp,
    },
    header: {
        backgroundColor: theme.COLORS.primary,
        padding: 15,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    lastBalancedInfo: {
        color: 'white',
        marginTop: 5,
    },
    balanceButton: {
        backgroundColor: '#28a745',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
    },
    balanceButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#e9ecef',
        paddingVertical: 10,
    },
    tableHeaderCell: {
        fontWeight: 'bold',
        textAlign: 'center',
        paddingHorizontal: 5,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    tableCell: {
        paddingHorizontal: 5,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    dateHeader: {
        width: 100,
    },
    particularsHeader: {
        width: 150,
    },
    voucherHeader: {
        width: 80,
    },
    amountHeader: {
        width: 100,
        textAlign: 'right',
    },
    dateCell: {
        width: 100,
    },
    particularsCell: {
        width: 150,
    },
    voucherCell: {
        width: 80,
    },
    amountCell: {
        width: 100,
        textAlign: 'right',
    },
    balanceRow: {
        backgroundColor: '#e0f7fa',
        fontWeight: 'bold',
    },
    totalsRow: {
        backgroundColor: '#cfe2ff',
        fontWeight: 'bold',
        borderTopWidth: 2,
        borderBottomWidth: 2,
        borderColor: '#007bff',
    },
    balancedPeriodRow: {
        backgroundColor: '#e0ffe0',
    },
});

export default CashBookScreen;
