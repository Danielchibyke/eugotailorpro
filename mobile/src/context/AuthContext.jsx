import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { getApi, setApiLogoutCallback } from '../utils/api'; // Changed to named import
import AsyncStorage from '@react-native-async-storage/async-storage';


let authToken = null;
let currentUser = null;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        setApiLogoutCallback(logout);

        const loadUser = async () => {
            try {
                const userInfoString = await AsyncStorage.getItem('userInfo');
                if (userInfoString) {
                    const { token, refreshToken, ...userData } = JSON.parse(userInfoString);
                    authToken = token;
                    currentUser = userData;
                    setUser(userData);
            getApi().defaults.headers.common['Authorization'] = `Bearer ${token}`;
            getApi().defaults.headers.common['X-Refresh-Token'] = refreshToken;
                }
            } catch (error) {
                console.error('Failed to load user:', error);
                await AsyncStorage.removeItem('userInfo');
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, [logout]);

    const login = useCallback(async (email, password) => {
        try {
            const { data } = await getApi().post('/auth/login', { email, password }); // Removed defensive check
            const { token, refreshToken, ...userData } = data;

            authToken = token;
            currentUser = userData;
            await AsyncStorage.setItem('userInfo', JSON.stringify({ token, refreshToken, ...userData }));

            getApi().defaults.headers.common['Authorization'] = `Bearer ${token}`;
            getApi().defaults.headers.common['X-Refresh-Token'] = refreshToken;
            
            setUser(userData);
        } catch (error) {
            console.error('Error in login function:', error);
            throw error;
        }
    }, []);

    const register = useCallback(async (name, email, password) => {
        try {
            const { data } = await getApi().post('/auth/register', { name, email, password });
            const { token, refreshToken, ...userData } = data;
            
            authToken = token;
            currentUser = userData;
        } catch (error) {
            console.error('Error in register function:', error);
            throw error;
        }
    }, []);

    const refreshUser = useCallback(async () => {
        try {
            const api = getApi();
            const { data } = await api.get('/auth/me'); // Assuming /auth/me endpoint exists
            const userInfoString = await AsyncStorage.getItem('userInfo');
            let userInfo = {};
            if (userInfoString) {
                userInfo = JSON.parse(userInfoString);
            }
            const updatedUserInfo = { ...userInfo, ...data }; // Merge existing token/refreshToken with new user data
            await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
            setUser(data);
            currentUser = data; // Update global currentUser as well
        } catch (error) {
            console.error('Failed to refresh user data:', error);
            // Optionally, log out user if refresh fails due to auth issues
            // logout();
        }
    }, []);

    const logout = useCallback(async () => {
        authToken = null;
        currentUser = null;
        delete getApi().defaults.headers.common['Authorization'];
        delete getApi().defaults.headers.common['X-Refresh-Token'];
        await AsyncStorage.removeItem('userInfo');
        
        setUser(null);
    }, []);
    
    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);