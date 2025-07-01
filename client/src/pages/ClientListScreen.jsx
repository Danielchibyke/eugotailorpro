// client/src/pages/ClientListScreen.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavbar from '../components/BottomNavbar';
import '../App.css'; // For general app structure
import './styles/ClientListScreen.css'; // Specific styles for this screen
import { FiPlus, FiEdit } from 'react-icons/fi'; // Icons for Add and Edit
import api from '../utils/api'; 

const ClientListScreen = () => {
    const navigate = useNavigate();
    // Placeholder client data
    const [clients, setClients] = useState([ ]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        // In a real application, you would fetch clients from your backend here
        // For now, we use the static placeholder data
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get('/clients');
            setClients(data);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to fetch clients.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

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

    return (
        <div className="client-list-container">
            <header className="client-list-header">
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