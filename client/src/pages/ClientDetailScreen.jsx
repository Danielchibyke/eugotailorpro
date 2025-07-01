// // client/src/pages/ClientManagementScreen.js
// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import BottomNavbar from '../components/BottomNavbar';
// import api from '../utils/api';
// import '../App.css';
// import './styles/ClientManagementScreen.css'; // Create this CSS file next

// const ClientManagementScreen = () => {
//     const [clients, setClients] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');
//     const [successMessage, setSuccessMessage] = useState('');
//     const navigate = useNavigate();

//     // State for the new/edit client form
//     const [isFormVisible, setIsFormVisible] = useState(false);
//     const [currentClient, setCurrentClient] = useState(null); // Client being edited
//     const [formData, setFormData] = useState({
//         name: '',
//         phone: '',
//         email: '',
//         address: '',
//         measurements: '',
//         notes: ''
//     });

//     useEffect(() => {
//         fetchClients();//     }, []);

//     const fetchClients = async () => {
//         setLoading(true);
//         setError('');
//         try {
//             const { data } = await api.get('/clients');
//             setClients(data);
//         } catch (err) {
//             setError(err.response?.data?.msg || 'Failed to fetch clients.');
//             console.error(err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleInputChange = (e) => {
//         setFormData({ ...formData, [e.target.name]: e.target.value });
//     };

//     const handleAddClientClick = () => {
//         setCurrentClient(null); // Clear any client being edited
//         setFormData({ // Reset form for new client
//             name: '',
//             phone: '',
//             email: '',
//             address: '',
//             measurements: '',
//             notes: ''
//         });
//         setIsFormVisible(true);
//         setSuccessMessage(''); // Clear any previous success message
//         setError(''); // Clear any previous error
//     };

//     const handleEditClientClick = (client) => {
//         setCurrentClient(client);
//         setFormData({
//             name: client.name,
//             phone: client.phone,
//             email: client.email || '',
//             address: client.address || '',
//             measurements: client.measurements || '',
//             notes: client.notes || ''
//         });
//         setIsFormVisible(true);
//         setSuccessMessage('');
//         setError('');
//     };

//     const handleFormSubmit = async (e) => {
//         e.preventDefault();
//         setError('');
//         setSuccessMessage('');

//         try {
//             if (currentClient) {
//                 // Update existing client
//                 const { data } = await api.put(`/clients/${currentClient._id}`, formData);
//                 setClients(clients.map(client => (client._id === data._id ? data : client)));
//                 setSuccessMessage('Client updated successfully!');
//             } else {
//                 // Add new client
//                 const { data } = await api.post('/clients', formData);
//                 setClients([data, ...clients]); // Add new client to the top
//                 setSuccessMessage('Client added successfully!');
//             }
//             setIsFormVisible(false); // Hide form after submission
//             fetchClients(); // Re-fetch to ensure latest data and sort order
//         } catch (err) {
//             console.error('Client form submission error:', err);
//             setError(err.response?.data?.msg || 'Failed to save client. Please check your inputs.');
//             // For validation errors from backend, display specific error messages
//             if (err.response?.data?.errors) {
//                 setError(err.response.data.errors.map(e => e.msg).join(', '));
//             }
//         }
//     };

//     const handleDeleteClient = async (clientId) => {
//         if (window.confirm('Are you sure you want to delete this client? This cannot be undone.')) {
//             setError('');
//             setSuccessMessage('');
//             try {
//                 await api.delete(`/clients/${clientId}`);
//                 setClients(clients.filter(client => client._id !== clientId));
//                 setSuccessMessage('Client deleted successfully!');
//             } catch (err) {
//                 console.error('Failed to delete client:', err);
//                 setError(err.response?.data?.msg || 'Failed to delete client. They might have associated bookings.');
//             }
//         }
//     };

//     if (loading) {
//         return <div className="loading-spinner">Loading Clients...</div>;
//     }

//     return (
//         <div className="client-management-container">
//             <header className="detail-header">
//                 <button onClick={() => navigate(-1)} className="back-button">&larr; Back</button>
//                 <h1 className="detail-heading">Client Management</h1>
//                 <button onClick={handleAddClientClick} className="btn btn-primary add-button">Add New Client</button>
//             </header>

//             <main className="client-management-content">
//                 {error && <p className="alert alert-error">{error}</p>}
//                 {successMessage && <p className="alert alert-success">{successMessage}</p>}

//                 {isFormVisible && (
//                     <div className="client-form-overlay">
//                         <div className="client-form-popup">
//                             <h2 className="form-heading">{currentClient ? 'Edit Client' : 'Add New Client'}</h2>
//                             <form onSubmit={handleFormSubmit}>
//                                 <div className="form-group">
//                                     <label htmlFor="name">Name</label>
//                                     <input
//                                         type="text"
//                                         id="name"
//                                         name="name"
//                                         value={formData.name}
//                                         onChange={handleInputChange}
//                                         required
//                                         className="form-control"
//                                     />
//                                 </div>
//                                 <div className="form-group">
//                                     <label htmlFor="phone">Phone</label>
//                                     <input
//                                         type="tel" // Use type tel for phone numbers
//                                         id="phone"
//                                         name="phone"
//                                         value={formData.phone}
//                                         onChange={handleInputChange}
//                                         required
//                                         className="form-control"
//                                     />
//                                 </div>
//                                 <div className="form-group">
//                                     <label htmlFor="email">Email (Optional)</label>
//                                     <input
//                                         type="email"
//                                         id="email"
//                                         name="email"
//                                         value={formData.email}
//                                         onChange={handleInputChange}
//                                         className="form-control"
//                                     />
//                                 </div>
//                                 <div className="form-group">
//                                     <label htmlFor="address">Address (Optional)</label>
//                                     <textarea
//                                         id="address"
//                                         name="address"
//                                         value={formData.address}
//                                         onChange={handleInputChange}
//                                         rows="2"
//                                         className="form-control"
//                                     ></textarea>
//                                 </div>
//                                 <div className="form-group">
//                                     <label htmlFor="measurements">Measurements (Optional)</label>
//                                     <textarea
//                                         id="measurements"
//                                         name="measurements"
//                                         value={formData.measurements}
//                                         onChange={handleInputChange}
//                                         rows="3"
//                                         className="form-control"
//                                         placeholder="e.g., Chest: 40, Waist: 32, Hip: 42"
//                                     ></textarea>
//                                 </div>
//                                 <div className="form-group">
//                                     <label htmlFor="notes">Notes (Optional)</label>
//                                     <textarea
//                                         id="notes"
//                                         name="notes"
//                                         value={formData.notes}
//                                         onChange={handleInputChange}
//                                         rows="2"
//                                         className="form-control"
//                                     ></textarea>
//                                 </div>
//                                 <div className="form-actions">
//                                     <button type="submit" className="btn btn-accent save-button">
//                                         {currentClient ? 'Update Client' : 'Add Client'}
//                                     </button>
//                                     <button
//                                         type="button"
//                                         onClick={() => setIsFormVisible(false)}
//                                         className="btn btn-secondary cancel-button"
//                                     >
//                                         Cancel
//                                     </button>
//                                 </div>
//                             </form>
//                         </div>
//                     </div>
//                 )}

//                 <div className="client-list">
//                     {clients.length === 0 && !loading ? (
//                         <p className="no-clients-message">No clients found. Add a new client to get started!</p>
//                     ) : (
//                         clients.map(client => (
//                             <div key={client._id} className="client-card">
//                                 <div className="client-info">
//                                     <h3>{client.name}</h3>
//                                     <p><strong>Phone:</strong> {client.phone}</p>
//                                     {client.email && <p><strong>Email:</strong> {client.email}</p>}
//                                     {client.address && <p><strong>Address:</strong> {client.address}</p>}
//                                     {client.measurements && <p><strong>Measurements:</strong> {client.measurements}</p>}
//                                     {client.notes && <p><strong>Notes:</strong> {client.notes}</p>}
//                                 </div>
//                                 <div className="client-actions">
//                                     <button
//                                         onClick={() => handleEditClientClick(client)}
//                                         className="btn btn-info edit-client-btn"
//                                     >
//                                         Edit
//                                     </button>
//                                     <button
//                                         onClick={() => handleDeleteClient(client._id)}
//                                         className="btn btn-danger delete-client-btn"
//                                     >
//                                         Delete
//                                     </button>
//                                 </div>
//                             </div>
//                         ))
//                     )}
//                 </div>
//             </main>

//             <BottomNavbar />
//         </div>
//     );
// };

// export default ClientManagementScreen;