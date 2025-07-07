import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavbar from '../components/BottomNavbar';
import { useNotification } from '../context/NotificationContext';
import api from '../utils/api';
import '../App.css';
import './styles/CashBookScreen.css';

const CashBookScreen = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [fullCashBookRows, setFullCashBookRows] = useState([]);
    const [filteredCashBookRows, setFilteredCashBookRows] = useState([]); // New state for filtered rows
    const [loading, setLoading] = useState(true);
    const [lastBalancedDate, setLastBalancedDate] = useState(null);
    const [finalClosingBalance, setFinalClosingBalance] = useState(null);

    // New state for filter dates
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    const fetchFullCashBook = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch all balance records, sorted by createdAt ascending (more precise for segmenting)
            const balancesRes = await api.get('/balances');
            const allBalanceRecords = balancesRes.data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            // Set the overall latest balanced date for header display (still the conceptual date)
            if (allBalanceRecords.length > 0) {
                setLastBalancedDate(allBalanceRecords[allBalanceRecords.length - 1].lastBalancedDate);
            } else {
                setLastBalancedDate(null);
            }

            // 2. Fetch all transactions, sorted by createdAt ascending (crucial for chronological processing)
            const transactionsRes = await api.get('/transactions');
            const allTransactions = transactionsRes.data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            let currentCashBalance = 0; // Running cash balance
            let currentBankBalance = 0; // Running bank balance
            let lastSegmentEndTime = new Date(0); // Marks the createdAt timestamp of the last processed balance record or Epoch
            let previousBalanceConceptualDate = new Date(0); // Stores the lastBalancedDate from the previous BalanceRecord

            const generatedRows = [];
            let transactionIndex = 0; // Pointer for allTransactions array

            // Process each balanced period
            for (const balanceRecord of allBalanceRecords) {
                const periodEndTimestamp = new Date(balanceRecord.createdAt); // Use createdAt of balance record for segment end

                // The segment for *this* balanceRecord starts strictly AFTER the previous segment ended.
                const segmentStartTimestamp = new Date(lastSegmentEndTime.getTime() + 1); // Add 1 millisecond

                // The date displayed for Balance b/d: conceptual day after previous balance record's lastBalancedDate
                // If it's the very first segment (previousBalanceConceptualDate is Epoch), use the date of the first transaction, or today.
                const displayBdDate = new Date(previousBalanceConceptualDate.getTime() === 0
                    ? (allTransactions[0]?.date || new Date())
                    : new Date(previousBalanceConceptualDate.getTime() + (24 * 60 * 60 * 1000))
                );
                displayBdDate.setUTCHours(0, 0, 0, 0); // Normalize to start of day for display

                // Add Balance b/d for this balanced segment
                generatedRows.push({
                    type: 'balanceBd',
                    date: displayBdDate.toLocaleDateString(), // Conceptual start date for display
                    particularsDebit: 'Balance b/d',
                    debitCash: currentCashBalance,
                    debitBank: currentBankBalance,
                    isBalancedPeriod: true, // Mark this row as part of a balanced period
                });

                let segmentIncomeCash = 0;
                let segmentIncomeBank = 0;
                let segmentExpenseCash = 0;
                let segmentExpenseBank = 0;

                // Add transactions for this balanced period
                while (transactionIndex < allTransactions.length) {
                    const transactionCreatedAt = new Date(allTransactions[transactionIndex].createdAt); // Use createdAt for comparison

                    if (transactionCreatedAt >= segmentStartTimestamp && transactionCreatedAt <= periodEndTimestamp) {
                        const transaction = allTransactions[transactionIndex];
                        const rowDate = new Date(transaction.date).toLocaleDateString(); // Display transaction.date

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
                        } else { // type === 'expense'
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
                        // This transaction is created after this balanced period, so move to next balance record
                        break;
                    } else {
                        // This transaction was created before the segment started. This shouldn't happen
                        // if allTransactions is sorted by createdAt and transactionIndex is maintained.
                        // But as a safeguard, advance.
                        transactionIndex++;
                    }
                }

                // Add Totals row for this balanced period
                generatedRows.push({
                    type: 'totals',
                    isBalancedPeriod: true,
                    totalDebitCash: currentCashBalance + segmentIncomeCash,
                    totalDebitBank: currentBankBalance + segmentIncomeBank,
                    totalCreditCash: segmentExpenseCash,
                    totalCreditBank: segmentExpenseBank,
                });

                // Add Balance c/d row for this balanced period.
                // Use the balances *from the BalanceRecord* for consistency.
                generatedRows.push({
                    type: 'balanceCd',
                    date: new Date(balanceRecord.lastBalancedDate).toLocaleDateString(), // Display the conceptual date
                    particularsCredit: 'Balance c/d',
                    creditCash: balanceRecord.cashBalance,
                    creditBank: balanceRecord.bankBalance,
                    isBalancedPeriod: true,
                });

                // Update running balances and timestamps for the next segment
                currentCashBalance = balanceRecord.cashBalance;
                currentBankBalance = balanceRecord.bankBalance;
                lastSegmentEndTime = periodEndTimestamp; // Update with the createdAt of this balance record
                previousBalanceConceptualDate = new Date(balanceRecord.lastBalancedDate); // For next b/d display date
            }

            // --- Handle the final, un-balanced period (from lastSegmentEndTime + 1ms to now) ---
            const now = new Date(); // Use current precise time

            const finalSegmentStartTimestamp = new Date(lastSegmentEndTime.getTime() + 1); // Start 1ms after last balance record was created

            let currentPeriodIncomeCash = 0;
            let currentPeriodIncomeBank = 0;
            let currentPeriodExpenseCash = 0;
            let currentPeriodExpenseBank = 0;
            let foundUnbalancedTransactions = false;

            // Collect transactions for the unbalanced period
            const transactionsInUnbalancedPeriod = [];
            // Continue from where the balanced segments left off (transactionIndex)
            for (let i = transactionIndex; i < allTransactions.length; i++) {
                const transaction = allTransactions[i];
                const transactionCreatedAt = new Date(transaction.createdAt);

                if (transactionCreatedAt >= finalSegmentStartTimestamp && transactionCreatedAt <= now) {
                    transactionsInUnbalancedPeriod.push(transaction);
                    foundUnbalancedTransactions = true;
                }
            }

            if (foundUnbalancedTransactions) {
                // Add Balance b/d for the current, un-balanced period
                const unbalancedBdDisplayDate = new Date(previousBalanceConceptualDate.getTime() === 0
                    ? (allTransactions[0]?.date || now)
                    : new Date(previousBalanceConceptualDate.getTime() + (24 * 60 * 60 * 1000))
                );
                unbalancedBdDisplayDate.setUTCHours(0, 0, 0, 0);

                generatedRows.push({
                    type: 'balanceBd',
                    date: unbalancedBdDisplayDate.toLocaleDateString(), // Display the conceptual date
                    particularsDebit: 'Balance b/d',
                    debitCash: currentCashBalance,
                    debitBank: currentBankBalance,
                    isBalancedPeriod: false,
                });

                transactionsInUnbalancedPeriod.forEach(transaction => {
                    const rowDate = new Date(transaction.date).toLocaleDateString(); // Still display transaction.date

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
                    } else { // type === 'expense'
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

                // Calculate final balances for the whole period shown (including un-balanced part)
                const finalCashBalance = currentCashBalance + currentPeriodIncomeCash - currentPeriodExpenseCash;
                const finalBankBalance = currentBankBalance + currentPeriodIncomeBank - currentPeriodExpenseBank;
                setFinalClosingBalance({ cash: finalCashBalance, bank: finalBankBalance });


                // Add Totals row for the current, un-balanced period
                generatedRows.push({
                    type: 'totals',
                    isBalancedPeriod: false,
                    totalDebitCash: currentCashBalance + currentPeriodIncomeCash,
                    totalDebitBank: currentBankBalance + currentPeriodIncomeBank,
                    totalCreditCash: currentPeriodExpenseCash,
                    totalCreditBank: currentPeriodExpenseBank,
                });

                // Add Balance c/d for the current, un-balanced period
                generatedRows.push({
                    type: 'balanceCd',
                    date: new Date().toLocaleDateString(), // Current conceptual date
                    particularsCredit: 'Balance c/d',
                    creditCash: finalCashBalance,
                    creditBank: finalBankBalance,
                    isBalancedPeriod: false,
                });
            } else {
                // If no unbalanced transactions, the final closing balance is the last known balance
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

    // Effect to apply filtering when filter dates or full cash book rows change
    useEffect(() => {
        if (fullCashBookRows.length === 0) {
            setFilteredCashBookRows([]);
            return;
        }

        let startFilterDate = filterStartDate ? new Date(filterStartDate) : null;
        if (startFilterDate) startFilterDate.setUTCHours(0, 0, 0, 0); // Normalize to start of day

        let endFilterDate = filterEndDate ? new Date(filterEndDate) : null;
        if (endFilterDate) endFilterDate.setUTCHours(23, 59, 59, 999); // Normalize to end of day

        const tempFilteredRows = fullCashBookRows.filter(row => {
            if (!startFilterDate && !endFilterDate) {
                return true; // No filter applied, show all
            }

            const rowDate = row.date ? new Date(row.date) : null;

            if (rowDate) {
                // Check if row's conceptual date is within the filter range
                const isAfterStartDate = startFilterDate ? rowDate >= startFilterDate : true;
                const isBeforeEndDate = endFilterDate ? rowDate <= endFilterDate : true;
                return isAfterStartDate && isBeforeEndDate;
            }
            return false; // Rows without a date property are not included in date filter
        });

        setFilteredCashBookRows(tempFilteredRows);
    }, [fullCashBookRows, filterStartDate, filterEndDate]);


    const handleBalanceCashBook = async () => {
        setLoading(true); // Indicate loading
        try {
            // Get the latest balance record to determine the start of the unbalanced period
            const balancesRes = await api.get('/balances');
            const allBalanceRecords = balancesRes.data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // Sort by createdAt

            let currentCashBalanceAtLastBalance = 0;
            let currentBankBalanceAtLastBalance = 0;
            let lastBalancedTimestamp = new Date(0); // Epoch if no previous balance records

            if (allBalanceRecords.length > 0) {
                const lastBalancedRecord = allBalanceRecords[allBalanceRecords.length - 1];
                currentCashBalanceAtLastBalance = lastBalancedRecord.cashBalance;
                currentBankBalanceAtLastBalance = lastBalancedRecord.bankBalance;
                lastBalancedTimestamp = new Date(lastBalancedRecord.createdAt); // Use createdAt
            }

            // Define the start timestamp for the new balancing period (1ms after last balance record was created)
            const newPeriodStartTimestamp = new Date(lastBalancedTimestamp.getTime() + 1);

            const now = new Date(); // Use current precise time

            const transactionsRes = await api.get('/transactions');
            const allTransactions = transactionsRes.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by createdAt DESC for efficient filtering

            let currentPeriodIncomeCash = 0;
            let currentPeriodIncomeBank = 0;
            let currentPeriodExpenseCash = 0;
            let currentPeriodExpenseBank = 0;
            let foundTransactionsToBalance = false;

            // Iterate through transactions in reverse chronological order to find newest ones first
            for (let i = 0; i < allTransactions.length; i++) {
                const transaction = allTransactions[i];
                const transactionCreatedAt = new Date(transaction.createdAt);

                // If a transaction's createdAt is before the new period starts, stop
                if (transactionCreatedAt < newPeriodStartTimestamp) {
                    break;
                }

                // Only consider transactions strictly *after* the last balanced timestamp
                // and up to the current timestamp.
                if (transactionCreatedAt >= newPeriodStartTimestamp && transactionCreatedAt <= now) {
                    foundTransactionsToBalance = true;
                    if (transaction.type === 'income') {
                        currentPeriodIncomeCash += transaction.paymentMethod === 'Cash' ? transaction.amount : 0;
                        currentPeriodIncomeBank += transaction.paymentMethod === 'Bank' ? transaction.amount : 0;
                    } else { // type === 'expense'
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

            // Calculate the new closing balance for *only* these new transactions
            const newClosingCashBalance = currentCashBalanceAtLastBalance + currentPeriodIncomeCash - currentPeriodExpenseCash;
            const newClosingBankBalance = currentBankBalanceAtLastBalance + currentPeriodIncomeBank - currentPeriodExpenseBank;

            // Post the new balance record
            const balanceRes = await api.post('/balances/setLastBalancedDate', {
                date: now.toISOString().split('T')[0], // Still send YYYY-MM-DD for the conceptual date
                cashBalance: newClosingCashBalance,
                bankBalance: newClosingBankBalance,
            });
            showNotification('Cashbook balanced successfully for new transactions!', 'success');
            console.log('New balance record created:', balanceRes.data);

            // Re-fetch all data to update the display with the new balanced period
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
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading cashbook...</p>
            </div>
        );
    }

    return (
        <div className="cashbook-screen background">
            <header className="cashbook-header">
                <h1>Full Cashbook Ledger</h1>
                {lastBalancedDate && (
                    <span className="last-balanced-info">Last Balanced: {new Date(lastBalancedDate).toLocaleDateString()}</span>
                )}
                <button onClick={handleBalanceCashBook} className="balance-button">Balance Cashbook Up to Today</button>

                <div className="filter-section">
                    <label htmlFor="startDate">From:</label>
                    <input
                        type="date"
                        id="startDate"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                    />
                    <label htmlFor="endDate">To:</label>
                    <input
                        type="date"
                        id="endDate"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                    />
                    <button onClick={() => {
                        // Trigger re-filtering by updating filter dates, or just let useEffect handle it on change
                        // No explicit "Apply Filter" button needed if filtering is automatic on date change
                        // but can be added if performance is an issue with large datasets.
                    }} className="filter-button">Apply Filter</button>
                    <button onClick={() => {
                        setFilterStartDate('');
                        setFilterEndDate('');
                    }} className="clear-filter-button">Clear Filter</button>
                </div>
            </header>

            <main className="cashbook-main">
                <div className="cashbook-table-container">
                    <table className="cashbook-table">
                        <thead>
                            <tr>
                                <th rowSpan="2" className="date-header">Date</th>
                                <th colSpan="4">Debit (Receipts)</th>
                                <th colSpan="4">Credit (Payments)</th>
                            </tr>
                            <tr>
                                <th className="particulars-header">Particulars</th>
                                <th className="voucher-header">Voucher No.</th>
                                <th className="amount-header">Cash (NGN)</th>
                                <th className="amount-header">Bank (NGN)</th>
                                <th className="particulars-header">Particulars</th>
                                <th className="voucher-header">Voucher No.</th>
                                <th className="amount-header">Cash (NGN)</th>
                                <th className="amount-header">Bank (NGN)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCashBookRows.map((row, index) => { // Render filtered rows
                                let rowClassName = '';
                                if (row.type === 'balanceBd' || row.type === 'balanceCd') {
                                    rowClassName = 'balance-row';
                                }
                                if (row.type === 'totals') {
                                    rowClassName = 'totals-row';
                                }
                                // Apply balanced period highlighting
                                if (row.isBalancedPeriod) {
                                    rowClassName += ' balanced-period-row';
                                }

                                return (
                                    <tr key={index} className={rowClassName}>
                                        <td className="date-col">{row.date}</td>
                                        {/* Debit Columns */}
                                        <td className="particulars-col">{row.particulars || row.particularsDebit}</td>
                                        <td className="voucher-col">{row.voucherNo || row.voucherNoDebit}</td>
                                        <td className="amount-col">{row.debitCash !== '' && row.debitCash !== undefined ? row.debitCash.toFixed(2) : ''}</td>
                                        <td className="amount-col">{row.debitBank !== '' && row.debitBank !== undefined ? row.debitBank.toFixed(2) : ''}</td>
                                        {/* Credit Columns */}
                                        <td className="particulars-col">{row.particularsCredit || ''}</td>
                                        <td className="voucher-col">{row.voucherNoCredit || ''}</td>
                                        <td className="amount-col">{row.creditCash !== '' && row.creditCash !== undefined ? row.creditCash.toFixed(2) : ''}</td>
                                        <td className="amount-col">{row.creditBank !== '' && row.creditBank !== undefined ? row.creditBank.toFixed(2) : ''}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </main>

            <BottomNavbar />
        </div>
    );
};

export default CashBookScreen;