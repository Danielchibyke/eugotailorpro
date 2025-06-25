// client/src/pages/FinancialsScreen.js
import React, { useState, useEffect } from 'react';
import BottomNavbar from '../components/BottomNavbar';
import '../App.css'; // For general app structure
import './styles/FinancialsScreen.css'; // Specific styles for this screen
import { FiPlus } from 'react-icons/fi'; // Icon for Add transaction

const FinancialsScreen = () => {
    // Placeholder transaction data
    const [transactions, setTransactions] = useState([
        { _id: 't1', type: 'income', description: 'Custom Suit for Alice', amount: 350.00, date: '2025-06-20' },
        { _id: 't2', type: 'expense', description: 'Fabric purchase (silk)', amount: 120.00, date: '2025-06-18' },
        { _id: 't3', type: 'income', description: 'Dress Alteration for Bob', amount: 80.00, date: '2025-06-15' },
        { _id: 't4', type: 'expense', description: 'Electricity Bill', amount: 75.50, date: '2025-06-10' },
        { _id: 't5', type: 'income', description: 'Wedding Gown for Sarah', amount: 750.00, date: '2025-05-30' },
        { _id: 't6', type: 'expense', description: 'Sewing Machine Repair', amount: 90.00, date: '2025-05-25' },
    ]);

    const [newTransaction, setNewTransaction] = useState({
        type: 'income',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0], // Default to today
    });

    const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1); // Current month (1-indexed)
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());

    useEffect(() => {
        // In a real app, you would fetch transactions based on filters from backend
        // For now, we simulate filtering on client-side placeholder data.
    }, [filterMonth, filterYear]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewTransaction(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleAddTransaction = (e) => {
        e.preventDefault();
        if (!newTransaction.description || !newTransaction.amount || !newTransaction.date) {
            alert('Please fill in all transaction fields.');
            return;
        }
        if (isNaN(parseFloat(newTransaction.amount)) || parseFloat(newTransaction.amount) <= 0) {
            alert('Amount must be a positive number.');
            return;
        }

        const addedTransaction = {
            _id: `t${transactions.length + 1}`, // Simple ID generation
            type: newTransaction.type,
            description: newTransaction.description,
            amount: parseFloat(newTransaction.amount),
            date: newTransaction.date,
        };

        setTransactions(prevTransactions => [...prevTransactions, addedTransaction]);
        setNewTransaction({
            type: 'income',
            description: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
        });
        alert('Transaction added successfully!');
        // In a real app, send to backend here
    };

    const filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() + 1 === parseInt(filterMonth) &&
               transactionDate.getFullYear() === parseInt(filterYear);
    }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by newest first

    const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpense;

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i); // Last 2 years, current, next 2 years

    return (
        <div className="financials-container">
            <header className="financials-header">
                <h1 className="financials-heading">Financials</h1>
            </header>

            <main className="financials-content">
                {/* Summary Card */}
                <div className="financials-summary-card">
                    <h3>Summary for {new Date(filterYear, filterMonth - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}</h3>
                    <div className="summary-grid">
                        <div className="summary-item income">
                            <span className="summary-label">Income</span>
                            <span className="summary-value">${totalIncome.toFixed(2)}</span>
                        </div>
                        <div className="summary-item expense">
                            <span className="summary-label">Expenses</span>
                            <span className="summary-value">${totalExpense.toFixed(2)}</span>
                        </div>
                        <div className="summary-item balance">
                            <span className="summary-label">Net Balance</span>
                            <span className="summary-value ${netBalance >= 0 ? 'positive' : 'negative'}">${netBalance.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="financials-filters">
                    <label htmlFor="filterMonth">Month:</label>
                    <select
                        id="filterMonth"
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="form-control"
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {new Date(0, i).toLocaleString('en-US', { month: 'long' })}
                            </option>
                        ))}
                    </select>

                    <label htmlFor="filterYear">Year:</label>
                    <select
                        id="filterYear"
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="form-control"
                    >
                        {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>


                {/* Add New Transaction Form */}
                <div className="add-transaction-card">
                    <h3><FiPlus /> Add New Transaction</h3>
                    <form onSubmit={handleAddTransaction} className="transaction-form">
                        <div className="form-group-inline">
                            <select
                                name="type"
                                value={newTransaction.type}
                                onChange={handleInputChange}
                                className="form-control"
                            >
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                            </select>
                            <input
                                type="text"
                                name="description"
                                placeholder="Description"
                                value={newTransaction.description}
                                onChange={handleInputChange}
                                required
                                className="form-control"
                            />
                        </div>
                        <div className="form-group-inline">
                            <input
                                type="number"
                                name="amount"
                                placeholder="Amount"
                                value={newTransaction.amount}
                                onChange={handleInputChange}
                                required
                                min="0.01"
                                step="0.01"
                                className="form-control"
                            />
                            <input
                                type="date"
                                name="date"
                                value={newTransaction.date}
                                onChange={handleInputChange}
                                required
                                className="form-control"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary add-transaction-btn">Add Transaction</button>
                    </form>
                </div>

                {/* Transactions List */}
                <div className="transactions-list-section">
                    <h2>Transactions</h2>
                    <div className="transactions-list">
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions.map(t => (
                                <div key={t._id} className={`transaction-item ${t.type}`}>
                                    <div className="transaction-details">
                                        <span className="transaction-description">{t.description}</span>
                                        <span className="transaction-date">{t.date}</span>
                                    </div>
                                    <span className="transaction-amount">
                                        {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="no-transactions-message">No transactions for this period.</p>
                        )}
                    </div>
                </div>

            </main>

            <BottomNavbar />
        </div>
    );
};

export default FinancialsScreen;