import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaClipboardList, FaUsers, FaChartBar } from 'react-icons/fa';
import './BottomNavbar.css';

const BottomNavbar = () => {
    return (
        <nav className="bottom-navbar">
            <NavLink to="/dashboard" className="nav-item">
                <FaHome />
                <span>Home</span>
            </NavLink>
            <NavLink to="/bookings" className="nav-item">
                <FaClipboardList />
                <span>Bookings</span>
            </NavLink>
            <NavLink to="/clients" className="nav-item">
                <FaUsers />
                <span>Clients</span>
            </NavLink>
            <NavLink to="/financials" className="nav-item">
                <FaChartBar />
                <span>Financials</span>
            </NavLink>
        </nav>
    );
};

export default BottomNavbar;
