// client/src/pages/DashboardScreen.js
import React, { useState, useEffect, use } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import BottomNavbar from '../components/BottomNavbar';
import TopNavbar from '../components/TopNavbar';
import OrderCard from '../components/OrderCard'; // Import OrderCard
import '../App.css';
import './styles/DashboardScreen.css';
import api from '../utils/api';



const DashboardScreen = () => {
    const { user, logout } = useAuth();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Placeholder orders for demonstration (will fetch from backend later)
    const [orders, setOrders] = useState([
        {
            _id: 'order1',
            client: { name: 'Daniel C.' },
            serviceType: 'Custom Suit',
            bookingDate: '2025-07-01T10:00:00Z',
            bookingTime: '10:00 AM',
            status: 'pending',
            designImageURL: '/sample-design-1.jpg', // Placeholder image
        },
        {
            _id: 'order2',
            client: { name: 'Sarah L.' },
            serviceType: 'Wedding Gown',
            bookingDate: '2025-06-25T14:30:00Z',
            bookingTime: '02:30 PM',
            status: 'pending',
            designImageURL: '/sample-design-2.jpg', // Placeholder image
        },
        {
            _id: 'order3',
            client: { name: 'John Doe' },
            serviceType: 'Shirt Alteration',
            bookingDate: '2025-06-15T09:00:00Z',
            bookingTime: '09:00 AM',
            status: 'completed',
            designImageURL: '/sample-design-3.jpg', // Placeholder image
        },
    ]);
    useEffect(() => {
        // Fetch orders from API (mocked for now)
        // In a real application, you would replace this with an API call
        const fetchOrders = async () => {
            try {
                const { data } = await api.get("/bookings");
                if (data) {
                  setOrders(data);
                } else {
                  setOrders(testData);
                }
              } catch (err) {
                setError(err.message || "An error occurred while fetching bookings");
                console.error("Error fetching bookings:", err);
              } finally {
                setLoading(false);
              }
            
        };

        fetchOrders();
    }, []);
    console.log("Orders fetched:", orders);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    
    const handleEditOrder = (orderId) => {
        console.log(`Edit order: ${orderId}`);
        navigate(`/bookings/${orderId}/edit`); // Navigate to a booking detail/edit page
    };

    const handleDeleteOrder = (orderId) => {
        console.log(`Delete order: ${orderId}`);
        // Implement API call to delete booking
        setOrders(orders.filter(order => order._id !== orderId)); // Optimistic UI update
    };

    const handleCompleteOrder = (orderId) => {
        console.log(`Complete order: ${orderId}`);
        // Implement API call to update booking status to 'completed'
        setOrders(orders.map(order => 
            order._id === orderId ? { ...order, status: 'completed' } : order
        )); // Optimistic UI update
    };

    if (!user) {
        return null; // Redirect handled by ProtectedRoute
    }

    const pendingOrders = orders.filter(order => order.status === 'Pending');
    const completedOrders = orders.filter(order => order.status === 'Completed');


    return (
        <div className='background'>        
            <TopNavbar />
        <div className="dashboard-container ">
            <header className="dashboard-header">
                <div className="dashboard-header-left">
                    <img src="/logo-placeholder.png" alt="Logo" className="dashboard-logo" />
                    <h1 className="dashboard-heading">Dashboard</h1>
                </div>
                <button onClick={handleLogout} className="btn btn-danger">Logout</button>
            </header>

            <main className="dashboard-content">
                <div className="dashboard-card summary-card">
                    <h3>Orders Overview</h3>
                    <div className="order-summary">
                        <div className="order-item">
                            <span className="order-label">Pending:</span> <span className="order-value">{pendingOrders.length}</span>
                        </div>
                        <div className="order-item">
                            <span className="order-label">Completed:</span> <span className="order-value">{completedOrders.length}</span>
                        </div>
                        <div className="order-item">
                            <span className="order-label">Total Clients:</span> <span className="order-value">25</span> {/* Placeholder */}
                        </div>
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2 className="section-title">Pending Orders</h2>
                    <div className="orders-list">
                        {pendingOrders.length > 0 ? (
                            pendingOrders.map(order => (
                                <OrderCard
                                    key={order._id}
                                    order={order}
                                    onEdit={handleEditOrder}
                                    onDelete={handleDeleteOrder}
                                    onComplete={handleCompleteOrder}
                                />
                            ))
                        ) : (
                            <p>No pending orders.</p>
                        )}
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2 className="section-title">Completed Orders</h2>
                    <div className="orders-list">
                        {completedOrders.length > 0 ? (
                            completedOrders.map(order => (
                                <OrderCard
                                    key={order._id}
                                    order={order}
                                    onEdit={handleEditOrder}
                                    onDelete={handleDeleteOrder}
                                    onComplete={handleCompleteOrder} // Not really needed for completed, but keeps prop consistency
                                />
                            ))
                        ) : (
                            <p>No completed orders.</p>
                        )}
                    </div>
                </div>

            </main>

        </div>
            <BottomNavbar />
        </div>
    );
};

export default DashboardScreen;