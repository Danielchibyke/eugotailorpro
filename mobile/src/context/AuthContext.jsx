import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../utils/api';

// Polyfill for SecureStore methods if they don't exist (for older SDKs)
if (!SecureStore.getItemAsync) {
  SecureStore.getItemAsync = async (key) => SecureStore.getItem(key);
}
if (!SecureStore.setItemAsync) {
  SecureStore.setItemAsync = async (key, value) => SecureStore.setItem(key, value);
}
if (!SecureStore.deleteItemAsync) {
  SecureStore.deleteItemAsync = async (key) => SecureStore.deleteItem(key);
}

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const token = await SecureStore.getItemAsync('token');
            if (token) {
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const userJSON = await SecureStore.getItemAsync('user');
                if (userJSON) {
                    setUser(JSON.parse(userJSON));
                }
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    const login = async (email, password) => {
        try {
            console.log('Attempting to log in...');
            const { data } = await api.post('/auth/login', { email, password });
            console.log('Login API call successful, data received:', data);

            const { token, ...userData } = data;
            console.log('Token extracted:', token);
            console.log('User data extracted:', userData);

            // Temporarily disable SecureStore to isolate the issue
            console.log('Attempting to store token in SecureStore...');
            await SecureStore.setItemAsync('token', token);
            console.log('Token stored successfully.');

            console.log('Attempting to store user data in SecureStore...');
            await SecureStore.setItemAsync('user', JSON.stringify(userData));
            console.log('User data stored successfully.');

            console.log('Setting authorization header...');
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            console.log('Authorization header set.');

            console.log('Setting user state...');
            setUser(userData);
            console.log('User state set successfully. App should navigate now.');

            return data;
        } catch (error) {
            console.error('Error in login function:', error);
            // Re-throw the error to be caught by the calling component
            throw error;
        }
    };

    const register = async (name, email, password) => {
        const { data } = await api.post('/auth/register', { name, email, password });
        const { token, ...userData } = data;
        await SecureStore.setItemAsync('token', token);
        await SecureStore.setItemAsync('user', JSON.stringify(userData));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
        return data;
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
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