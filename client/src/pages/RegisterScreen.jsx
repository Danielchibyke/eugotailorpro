// client/src/pages/RegisterScreen.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import api from '../utils/api';
import '../App.css'; // For general app structure
import './styles/RegisterScreen.css'; // Import specific styles

const RegisterScreen = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('staff'); // Default role
    

    const navigate = useNavigate();
    const { showNotification } = useNotification();

    

    const submitHandler = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }

        if (!window.confirm(`Are you sure you want to register ${name} as a new ${role}?`)) {
            return; // User cancelled
        }

        try {
            // Direct API call to register a new user
            await api.post('/auth/register', { name, email, password, role });
            showNotification(`User ${name} registered successfully!`, 'success');
            // Reset form fields
            setName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setRole('staff'); // Reset to default
            navigate('/dashboard'); // Navigate back to dashboard
        } catch (err) {
            showNotification(err.response?.data?.message || 'Registration failed.', 'error');
        }
    };

    return (
        <div className="register-screen-container">
            <button onClick={() => navigate(-1)} className="back-button">
                &larr; Back
            </button>
            <div className="register-form-container">
                <h2>Register</h2>
                <form onSubmit={submitHandler}>
                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input
                            type="text"
                            id="name"
                            placeholder="Enter name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="form-control"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="Enter email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="form-control"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="form-control"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="form-control"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="role">Role</label>
                        <select
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="form-control"
                        >
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <button type="submit"  className="btn btn-primary">
                        Register
                    </button>
                </form>
                <div className="register-link">
                    Have an account? <Link to="/login">Login</Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterScreen;