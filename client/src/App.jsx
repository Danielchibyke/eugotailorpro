// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './pages/LoginScreen';
import RegisterScreen from './pages/RegisterScreen';
import DashboardScreen from './pages/DashboardScreen';
import HomeScreen from './pages/HomeScreen';
import BookingDetailScreen from './pages/BookingDetailScreen';
import ClientListScreen from './pages/ClientListScreen';
import ClientDetailScreen from './pages/ClientDetailScreen';
import FinancialsScreen from './pages/FinancialsScreen'; // Import FinancialsScreen
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

function AppContent() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-spinner">
                Loading Application...
            </div>
        );
    }

    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomeScreen />} />
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/register" element={<RegisterScreen />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'staff']} />}>
                    <Route path="/dashboard" element={<DashboardScreen />} />
                    <Route path="/bookings/:id/edit" element={<BookingDetailScreen />} />

                    {/* Client Management Routes */}
                    <Route path="/clients" element={<ClientListScreen />} />
                    <Route path="/clients/add" element={<ClientDetailScreen />} />
                    <Route path="/clients/:id/edit" element={<ClientDetailScreen />} />

                    {/* Financials Route */}
                    <Route path="/financials" element={<FinancialsScreen />} />

                    {/* Add other protected routes here (e.g., Profile) */}
                    {/* <Route path="/profile" element={<ProfileScreen />} /> */}
                </Route>

                {/* Fallback/Default redirect if no route matches */}
                <Route
                    path="*"
                    element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />}
                />
            </Routes>
        </Router>
    );
}

export default App;