// client/src/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  BrowserRouter,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginScreen from "./pages/LoginScreen";
import RegisterScreen from "./pages/RegisterScreen";
import DashboardScreen from "./pages/DashboardScreen";
import BookingDetailScreen from "./pages/BookingDetailScreen";
import LoadingScreen from "./components/LoadingScreen";

import { BookingProvider } from "./context/BookingContext";
import FinancialsScreen from "./pages/FinancialsScreen";
import CashBookScreen from "./pages/CashBookScreen";
import ProtectedRoute from "./components/ProtectedRoute";
import ClientManagementScreen from "./pages/ClientManagementScreen";
import BookingScreen from "./pages/BookingScreen";
import "./App.css"; // Import global styles
import "./pages/styles/DashboardScreen.css"; // Import styles for DashboardScreen
import ErrorBoundary from "./utils/ErrorBoundray";

function App({}) {
  return (
   
    <AuthProvider>
        <BookingProvider>
      <AppContent />
       </BookingProvider>
    </AuthProvider>
   
    
  );
}

import TopNavbar from "./components/TopNavbar";
import BottomNavbar from "./components/BottomNavbar";

function AppContent() {
  const { user, loading } = useAuth();
  const [showInitialLoading, setShowInitialLoading] = React.useState(true);

  React.useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setShowInitialLoading(false);
      }, 3000); // 10 seconds delay
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading || showInitialLoading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <TopNavbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginScreen />} />

        {/* Admin-only Routes */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/register" element={<RegisterScreen />} />
        </Route>

        {/* Protected Routes (Admin and Staff) */}
        <Route element={<ProtectedRoute allowedRoles={["admin", "staff"]} />}>
        <Route element={<ProtectedRoute allowedRoles={["admin", "staff"]} />}>
          <Route path="/dashboard" element={<DashboardScreen />} />
          <Route path="/bookings/:id/edit" element={
          <ErrorBoundary>
          <BookingScreen  />
            </ErrorBoundary>
        } />
          <Route path="/bookings/:id" element={<BookingDetailScreen />} />
            
          <Route path="/bookings" element={
            <ErrorBoundary>
                <BookingScreen/>
            </ErrorBoundary>
          
          } />

          {/* Client Management Routes */}
          <Route path="/clients" element={<ClientManagementScreen />} />
          <Route path="/clients/add" element={<ClientManagementScreen />} />
          <Route path="/clients/:id" element={<ClientManagementScreen />} />

          {/* Financials Route */}
          <Route path="/financials" element={<FinancialsScreen />} />
          <Route path="/cashbook" element={<CashBookScreen />} />

          {/* Add other protected routes here (e.g., Profile) */}
          {/* <Route path="/profile" element={<ProfileScreen />} /> */}
        </Route>
        </Route>

        {/* Fallback/Default redirect if no route matches */}
     
      </Routes>
      <BottomNavbar />
    </Router>
  );
}

export default App;
