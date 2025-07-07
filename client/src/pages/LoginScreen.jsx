// client/src/pages/LoginScreen.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import LoadingScreen from '../components/LoadingScreen';
import '../App.css'; // For general app structure
import './styles/LoginScreen.css'; // Import specific styles


const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPostLoginDelay, setShowPostLoginDelay] = useState(false); // New state for post-login delay

    const { user, loading, login } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const submitHandler = async (e) => {
        e.preventDefault();
      
        try {
            await login(email, password); 

        } catch (err) {
            showNotification(err || 'Login failed. Please check your credentials.', 'error');
            setShowPostLoginDelay(false); // Ensure delay is off on error
        }
    };
   

    useEffect(() => {
        if (user) {
          
            navigate('/dashboard');
        
          
        }
        
    }, [user, navigate, showPostLoginDelay]);
    


    return (
        <div className="login-screen-container">
            <div className="login-form-container">
                <h2>Login</h2>
                <p>Welcome back! Please login to your account.</p>
                <form onSubmit={submitHandler}>
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
                    <button type="submit" disabled={loading || showPostLoginDelay} className="btn btn-primary">
                        {(loading || showPostLoginDelay) ? 'Logging In...' : 'Login'}
                    </button>
                </form>
                <div className="login-link">
                    Don't have an account? <Link to="/register">Register</Link>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;