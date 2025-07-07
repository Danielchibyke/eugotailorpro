// client/src/pages/ClientListScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavbar from '../components/BottomNavbar';
import '../App.css'; // For general app structure
import './styles/ClientListScreen.css'; // Specific styles for this screen
import { FiPlus, FiEdit } from 'react-icons/fi'; // Icons for Add and Edit
import api from '../utils/api'; 
import { useNotification } from '../context/NotificationContext'; 

const ClientListScreen = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    // Placeholder client data
    const [clients, setClients] = useState([ ]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const fetchClients = useCallback(async () => {
        setLoading(true);
        // setError(''); // Replaced with showNotification
        try {
            const { data } = await api.get('/clients');
            setClients(data);
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to fetch clients.', 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddClient = () => {
        navigate('/clients/add');
    };

    const handleEditClient = (clientId) => {
        navigate(`/clients/${clientId}/edit`);
    };

    if (loading) {
        return <div className="loading-spinner">
            <div className="spinner"></div>
            Loading Clients...
            </div>;
    }

    return (
        <div className="client-list-container">
            <header className="client-list-header">
                <button onClick={() => navigate(-1)} className="back-button">
                    &larr; Back
                </button>
                <h1 className="client-list-heading">Clients</h1>
                <button onClick={handleAddClient} className="btn btn-primary add-client-btn">
                    <FiPlus /> Add Client
                </button>
            </header>

            <main className="client-list-content">
                <div className="search-bar-group">
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-control search-input"
                    />
                </div>

                <div className="clients-cards-list">
                    {filteredClients.length > 0 ? (
                        filteredClients.map(client => (
                            <div key={client._id} className="client-card">
                                <div className="client-info">
                                    <h3 className="client-name">{client.name}</h3>
                                    <p className="client-contact">Phone: {client.phone}</p>
                                    <p className="client-contact">Email: {client.email}</p>
                                </div>
                                <div className="client-actions">
                                    <button onClick={() => handleEditClient(client._id)} className="btn-icon">
                                        <FiEdit /> Edit
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="no-clients-message">No clients found.</p>
                    )}
                </div>
            </main>

            <BottomNavbar />
        </div>
    );
};

export default ClientListScreen;