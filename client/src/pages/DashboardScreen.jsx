// client/src/pages/DashboardScreen.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaUserPlus, FaClipboardList, FaTasks, FaUsers, FaDollarSign } from 'react-icons/fa';
import BottomNavbar from '../components/BottomNavbar';
import TopNavbar from '../components/TopNavbar';
import BookingCard from '../components/BookingCard';
import '../App.css';
import './styles/DashboardScreen.css';
import api from '../utils/api';

const StatCard = ({ icon, label, value, color }) => (
    <div className="stat-card" style={{ borderTopColor: color }}>
        <div className="stat-card-icon">{icon}</div>
        <div className="stat-card-info">
            <span className="stat-card-value">{value}</span>
            <span className="stat-card-label">{label}</span>
        </div>
    </div>
);

const DashboardScreen = () => {
    const { user, logout } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [clients, setClients] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [bookingsRes, clientsRes] = await Promise.all([
                    api.get("/bookings"),
                    api.get("/clients")
                ]);
                setBookings(bookingsRes.data || []);
                setClients(clientsRes.data || []);
            } catch (err) {
                setError(err.message || "An error occurred while fetching data");
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleEditOrder = (booking) => {
        navigate(`/bookings/${booking._id}/edit`);
    };

    const handleDeleteOrder = async (orderId) => {
        if (window.confirm("Are you sure you want to delete this booking?")) {
            try {
                await api.delete(`/bookings/${orderId}`);
                setBookings(bookings.filter(b => b._id !== orderId));
            } catch (err) {
                setError("Failed to delete booking.");
            }
        }
    };

    const handleCompleteOrder = async (orderId) => {
        try {
            const { data } = await api.put(`/bookings/${orderId._id}`, { status: 'Completed' });
            setBookings(bookings.map(b => (b._id === orderId ? data : b)));
        } catch (err) {
            setError("Failed to update booking status.");
        }
    };

    if (loading) {
        return <div className="loading-spinner">Loading Dashboard...</div>;
    }

    if (error) {
        return <div className="alert alert-error">{error}</div>;
    }
    
    if (!user) {
        return null; // Redirect handled by ProtectedRoute
    }
    

    const pendingBookings = bookings.filter(b => b.status === 'Pending');
    const completedBookings = bookings.filter(b => b.status === 'Completed');

    return (
        <div className='background'>
            
            <div className="dashboard-container">
                

                <main className="dashboard-content">
                    <div className="dashboard-grid">
                        <div className="grid-item summary-metrics">
                            <StatCard icon={<FaClipboardList />} label="Total Bookings" value={bookings.length} color="#4a90e2" />
                            <StatCard icon={<FaTasks />} label="Pending" value={pendingBookings.length} color="#f5a623" />
                            <StatCard icon={<FaUsers />} label="Total Clients" value={clients.length} color="#bd10e0" />
                            <StatCard icon={<FaDollarSign />} label="Revenue" value="$0" color="#7ed321" />
                        </div>

                        <div className="grid-item quick-actions">
                            <h2 className="section-title">Quick Actions</h2>
                            <button className="btn btn-primary" onClick={() => navigate('/bookings')}>
                                <FaPlus /> New Booking
                            </button>
                            <button className="btn btn-secondary" onClick={() => navigate('/clients')}>
                                <FaUserPlus /> New Client
                            </button>
                        </div>

                        <div className="grid-item recent-bookings">
                            <h2 className="section-title">Recent Pending Bookings</h2>
                            <div className="orders-list">
                                {pendingBookings.length > 0 ? (
                                    pendingBookings.slice(0, 5).map(order => ( // Show latest 5
                                        <BookingCard
                                            key={order._id}
                                            booking={order}
                                            onEdit={order => handleEditOrder(order)}
                                            onDelete={handleDeleteOrder}
                                            onComplete={handleCompleteOrder}
                                        />
                                    ))
                                ) : (
                                    <p>No pending bookings.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            
        </div>
    );
};


export default DashboardScreen;