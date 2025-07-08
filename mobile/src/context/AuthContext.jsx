import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

let authToken = null;
let currentUser = null;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app, you'd load from AsyncStorage or similar here
        if (currentUser) {
            setUser(currentUser);
            api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            console.log('Attempting to log in...');
            const { data } = await api.post('/auth/login', { email, password });
            console.log('Login API call successful, data received:', data);

            const { token, ...userData } = data;
            console.log('Token extracted:', token);
            console.log('User data extracted:', userData);

            // Store in memory (non-persistent)
            authToken = token;
            currentUser = userData;

            console.log('Setting authorization header...');
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            console.log('Authorization header set.');

            console.log('Setting user state...');
            setUser(userData);
            console.log('User state set successfully. App should navigate now.');

            return data;
        } catch (error) {
            console.error('Error in login function:', error);
            throw error;
        }
    };

    const register = async (name, email, password) => {
        const { data } = await api.post('/auth/register', { name, email, password });
        const { token, ...userData } = data;
        
        // Store in memory (non-persistent)
        authToken = token;
        currentUser = userData;

        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
        return data;
    };

    const logout = () => {
        authToken = null;
        currentUser = null;
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);