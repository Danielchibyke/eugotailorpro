// client/src/pages/ClientDetailScreen.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BottomNavbar from '../components/BottomNavbar';
import '../App.css';
import './styles/ClientDetailScreen.css';

const ClientDetailScreen = () => {
    const { id } = useParams(); // 'id' will be 'add' for new client or client_id for existing
    const navigate = useNavigate();
    const isAdding = id === 'add';

    const [clientName, setClientName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isAdding && id) {
            // Simulate fetching client details for editing
            setLoading(true);
            setError('');
            const fetchClientDetails = async () => {
                try {
                    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
                    const fetchedClient = {
                        _id: id,
                        name: `Client ${id.replace('client', '')}`, // Example: Client 1, Client 2
                        phone: `000-000-${id.replace('client', '').padStart(4, '0')}`,
                        email: `${id}@example.com`,
                        address: `${id.toUpperCase()} Street, City`,
                        notes: `Notes for client ${id}. Measurements, preferences etc.`,
                    };
                    setClientName(fetchedClient.name);
                    setPhone(fetchedClient.phone);
                    setEmail(fetchedClient.email);
                    setAddress(fetchedClient.address);
                    setNotes(fetchedClient.notes);
                } catch (err) {
                    setError('Failed to fetch client details.');
                } finally {
                    setLoading(false);
                }
            };
            fetchClientDetails();
        }
    }, [id, isAdding]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const clientData = {
            name: clientName,
            phone,
            email,
            address,
            notes
        };

        try {
            // Simulate API call for adding or updating client
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (isAdding) {
                console.log('Adding new client:', clientData);
                alert('Client added successfully!');
            } else {
                console.log(`Updating client ${id}:`, clientData);
                alert('Client updated successfully!');
            }
            navigate('/clients'); // Go back to client list
        } catch (err) {
            setError(`Failed to ${isAdding ? 'add' : 'update'} client.`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !isAdding) { // Only show loading if we are fetching an existing client
        return <div className="loading-spinner">Loading Client Details...</div>;
    }

    return (
        <div className="client-detail-container">
            <header className="detail-header">
                <button onClick={() => navigate(-1)} className="back-button">&larr; Back</button>
                <h1 className="detail-heading">{isAdding ? 'Add New Client' : 'Edit Client'}</h1>
            </header>

            <main className="detail-content">
                <form onSubmit={handleSubmit} className="client-form">
                    <div className="form-group">
                        <label htmlFor="clientName">Client Name</label>
                        <input
                            type="text"
                            id="clientName"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            required
                            className="form-control"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">Phone</label>
                        <input
                            type="tel"
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="form-control"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-control"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="address">Address</label>
                        <input
                            type="text"
                            id="address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="form-control"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="notes">Notes (Measurements, Preferences, etc.)</label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows="5"
                            className="form-control"
                            placeholder="Add client-specific notes, measurements, or preferences here."
                        ></textarea>
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" className="btn btn-accent save-button">
                        {isAdding ? 'Add Client' : 'Save Changes'}
                    </button>
                </form>
            </main>

            <BottomNavbar />
        </div>
    );
};

export default ClientDetailScreen;