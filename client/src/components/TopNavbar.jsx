import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaBars, FaTimes, FaUserCircle } from 'react-icons/fa';
import './TopNavbar.css';

const TopNavbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="top-navbar">
            <div className="navbar-container">
                <div className="navbar-logo">
                    <NavLink to="/dashboard">
                        <img src="/logo-placeholder.png" alt="Logo" />
                    </NavLink>
                </div>

                <div className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`}>
                    <NavLink to="/dashboard" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Dashboard</NavLink>
                    <NavLink to="/bookings" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Bookings</NavLink>
                    <NavLink to="/clients" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Clients</NavLink>
                    <NavLink to="/financials" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Financials</NavLink>
                </div>

                <div className="navbar-right">
                    <div className="profile-menu">
                        <button onClick={() => setProfileMenuOpen(!isProfileMenuOpen)} className="profile-menu-trigger">
                            <FaUserCircle />
                        </button>
                        {isProfileMenuOpen && user !== null && (
                            <div className="profile-menu-dropdown">
                                <div className="profile-info">
                                    <p>{user.name}</p>
                                    <p>{user.email}</p>
                                </div>
                                <button onClick={handleLogout} className="btn btn-danger">Logout</button>
                            </div>
                        )}
                    </div>
                    <div className="mobile-menu-icon" onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default TopNavbar;
