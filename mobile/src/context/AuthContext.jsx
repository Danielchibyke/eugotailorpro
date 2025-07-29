import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

let authToken = null;
let currentUser = null;
let logoutCallback = null; // New: To store the logout function

const AuthContext = createContext();

export const setAuthLogoutCallback = (callback) => {
    logoutCallback = callback;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userInfo = await AsyncStorage.getItem('userInfo');
                if (userInfo) {
                    const { token, refreshToken, ...userData } = JSON.parse(userInfo);
                    authToken = token;
                    currentUser = userData;
                    setUser(userData);
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    // Store refresh token globally for axios interceptor
                    api.defaults.headers.common['X-Refresh-Token'] = refreshToken;
                }
            } catch (error) {
                console.error('Failed to load user from AsyncStorage:', error);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    const login = async (email, password) => {
        try {
            console.log('Attempting to log in...');
            const { data } = await api.post('/auth/login', { email, password });
            console.log('Login API call successful, data received:', data);

            const { token, refreshToken, ...userData } = data;
            console.log('Token extracted:', token);
            console.log('User data extracted:', userData);

            // Store in memory (non-persistent)
            authToken = token;
            currentUser = userData;

            // Persist to AsyncStorage
            await AsyncStorage.setItem('userInfo', JSON.stringify({ token, refreshToken, ...userData }));

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
        const { token, refreshToken, ...userData } = data;
        
        // Store in memory (non-persistent)
        authToken = token;
        currentUser = userData;

        // Persist to AsyncStorage
        await AsyncStorage.setItem('userInfo', JSON.stringify({ token, refreshToken, ...userData }));

        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
        return data;
    };

    const logout = async () => {
        authToken = null;
        currentUser = null;
        delete api.defaults.headers.common['Authorization'];
        delete api.defaults.headers.common['X-Refresh-Token']; // Clear refresh token header
        setUser(null);
        await AsyncStorage.removeItem('userInfo'); // Clear from AsyncStorage
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);