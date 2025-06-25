// client/src/components/ProtectedRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>; // Or a proper spinner
    }

    if (!user) {
        // If not authenticated, redirect to login page
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // If authenticated but not authorized, redirect to an unauthorized page or dashboard
        console.warn(`User ${user.email} (${user.role}) attempted to access a restricted route.`);
        return <Navigate to="/dashboard" replace />; // Or /unauthorized
    }

    // If authenticated and authorized, render the child routes/components
    return <Outlet />;
};

export default ProtectedRoute;