// client/src/components/BottomNavbar.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import './BottomNavbar.css'; // Specific styles for bottom navbar
import { FiHome, FiClipboard, FiUsers, FiDollarSign, FiUser } from 'react-icons/fi'; // Import icons

const BottomNavbar = () => {
    return (
        <nav className="bottom-navbar">
            <NavLink to="/dashboard" className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
                <FiHome />
                <span>Home</span>
            </NavLink>
            <NavLink to="/bookings" className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
                <FiClipboard />
                <span>Bookings</span> {/* This route will lead to a general bookings list if created */}
            </NavLink>
            <NavLink to="/clients" className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
                <FiUsers />
                <span>Clients</span>
            </NavLink>
            <NavLink to="/financials" className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
                <FiDollarSign />
                <span>Financials</span> {/* Placeholder for future Financials screen */}
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
                <FiUser />
                <span>Profile</span> {/* Placeholder for future Profile screen */}
            </NavLink>
        </nav>
    );
};

export default BottomNavbar;