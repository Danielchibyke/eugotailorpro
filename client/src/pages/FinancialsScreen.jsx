// client/src/pages/FinancialsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import BottomNavbar from '../components/BottomNavbar';
import '../App.css'; // For general app structure
import './styles/FinancialsScreen.css'; // Specific styles for this screen
import { FiPlus } from 'react-icons/fi'; // Icon for Add transaction
import api from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FinancialsScreen = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [clients, setClients] = useState([]); // State to store clients
    const [filteredClients, setFilteredClients] = useState([]); // State for filtered clients
    const [searchQuery, setSearchQuery] = useState(''); // State for client search query

    const [newTransaction, setNewTransaction] = useState({
        type: 'income',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0], // Default to today
        client: '', // Add client field
        recordedBy: user ? user._id : '', // Add recordedBy field
        paymentMethod: 'Cash', // Default to Cash
    });

    const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1); // Current month (1-indexed)
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/transactions');
            setTransactions(data);
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to fetch transactions.', 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    const fetchClients = useCallback(async () => {
        try {
            const { data } = await api.get('/clients');
            setClients(data);
            setFilteredClients(data); // Initialize filtered clients with all clients
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to fetch clients.', 'error');
            console.error(err);
        }
    }, [showNotification]);

    useEffect(() => {
         fetchTransactions();
        fetchClients();
    }, [fetchTransactions, fetchClients, filterMonth, filterYear]);

    const handleClientSearchInputChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.trim() === '') {
            setFilteredClients(clients);
        } else {
            setFilteredClients(clients.filter(client =>
                client.name.toLowerCase().includes(query.toLowerCase()) ||
                client.phone.includes(query)
            ));
        }
    };

    const handleClientSelectChange = (e) => {
        const selectedClientId = e.target.value;
        setNewTransaction(prevState => ({
            ...prevState,
            client: selectedClientId,
        }));
        setSearchQuery(''); // Clear search query after selection
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewTransaction(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleAddTransaction = async (e) => {
        e.preventDefault();
        if (!newTransaction.description || !newTransaction.amount || !newTransaction.date) {
            showNotification('Please fill in all transaction fields.', 'error');
            return;
        }
        if (isNaN(parseFloat(newTransaction.amount)) || parseFloat(newTransaction.amount) <= 0) {
            showNotification('Amount must be a positive number.', 'error');
            return;
        }
        // Client is now optional, so no validation here
        // if (!newTransaction.client) {
        //     showNotification('Please select a client for the transaction.', 'error');
        //     return;
        // }
        if (!user || !user._id) {
            showNotification('User not authenticated. Cannot record transaction.', 'error');
            return;
        }

        try {
            const { data } = await api.post('/transactions', {
                ...newTransaction,
                amount: parseFloat(newTransaction.amount),
                recordedBy: user._id, // Ensure recordedBy is sent
                client: newTransaction.client === '' ? null : newTransaction.client, // Send null if client is empty
                voucherNo: newTransaction.voucherNo || '', // Ensure voucherNo is sent
                paymentMethod: newTransaction.paymentMethod || 'Cash', // Default to Cash if not set
                
            });
            setTransactions(prevTransactions => [...prevTransactions, data]);
            setNewTransaction({
                type: 'income',
                description: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                client: '',
                recordedBy: user._id,
                paymentMethod: 'Cash',
                voucherNo: '',
            });
            showNotification('Transaction added successfully!', 'success');
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to add transaction.', 'error');
            console.error(err);
        }
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

    
  if (loading) {
    return <div className="loading-container">
        <div className="spinner"></div>
        Loading Clients...
        </div>;
}

    return (
        <div className="financials-container">
            <header className="financials-header">
                <button onClick={() => navigate(-1)} className="back-button">
                    &larr; Back
                </button>
                <h1 className="financials-heading">Financials</h1>
                <button onClick={() => navigate('/cashbook')} className="btn btn-secondary">
                    View Cash Book
                </button>
            </header>

            <main className="financials-content">
                {/* Summary Card */}
                <div className="financials-summary-card">
                    <h3>Summary for {new Date(filterYear, filterMonth - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}</h3>
                    <div className="summary-grid">
                        <div className="summary-item income">
                            <span className="summary-label">Income</span>
                            <span className="summary-value">₦{totalIncome.toFixed(2)}</span>
                        </div>
                        <div className="summary-item expense">
                            <span className="summary-label">Expenses</span>
                            <span className="summary-value">₦{totalExpense.toFixed(2)}</span>
                        </div>
                        <div className="summary-item balance">
                            <span className="summary-label">Net Balance</span>
                            <span className="summary-value ${netBalance >= 0 ? 'positive' : 'negative'}">₦{netBalance.toFixed(2)}</span>
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
                            <select
                                name="client"
                                value={newTransaction.client}
                                onChange={handleClientSelectChange}
                                className="form-control"
                            >
                                <option value="">Select Client</option>
                                {filteredClients.map(client => (
                                    <option key={client._id} value={client._id}>{client.name}</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                placeholder="Search Clients..."
                                value={searchQuery}
                                onChange={handleClientSearchInputChange}
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
                        <div className="form-group-inline">
                            <label htmlFor="paymentMethod">Payment Method:</label>
                            <select
                                name="paymentMethod"
                                id="paymentMethod"
                                value={newTransaction.paymentMethod}
                                onChange={handleInputChange}
                                className="form-control"
                            >
                                <option value="Cash">Cash</option>
                                <option value="Bank">Bank</option>
                            </select>
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
                                        <span className="transaction-payment-method">{t.paymentMethod}</span>
                                        {t.client && <span className="transaction-client">Client: {t.client.name}</span>}
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