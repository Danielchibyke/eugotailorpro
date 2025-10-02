import { useState, useEffect, useCallback } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { getApi } from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import { cacheData, getCachedData } from '../utils/offlineManager';

export const useDashboardData = () => {
    const [stats, setStats] = useState({
        totalBookings: 0,
        pendingBookings: 0,
        totalClients: 0,
        totalRevenue: 0,
        totalOutstanding: 0,
    });
    const [recentBookings, setRecentBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { showNotification } = useNotification();
    const netInfo = useNetInfo();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        const CACHE_KEY_STATS = 'dashboard_stats';
        const CACHE_KEY_BOOKINGS = 'dashboard_recent_bookings';

        if (netInfo.isConnected) {
            try {
                const { data } = await getApi().get('/auth/dashboard-stats');
                setStats({
                    totalBookings: data.totalBookings || 0,
                    pendingBookings: data.pendingBookings || 0,
                    totalClients: data.totalClients || 0,
                    totalRevenue: data.totalRevenue || 0,
                    totalOutstanding: data.totalOutstanding || 0,
                });
                setRecentBookings(data.recentBookings || []);
                await cacheData(CACHE_KEY_STATS, {
                    totalBookings: data.totalBookings || 0,
                    pendingBookings: data.pendingBookings || 0,
                    totalClients: data.totalClients || 0,
                    totalRevenue: data.totalRevenue || 0,
                    totalOutstanding: data.totalOutstanding || 0,
                });
                await cacheData(CACHE_KEY_BOOKINGS, data.recentBookings || []);
                showNotification('Online');
            } catch (err) {
                console.error('Failed to fetch dashboard data from API:', err);
                setError(err.response?.data?.msg || 'Failed to fetch dashboard data.');
                
                // Try to load from cache on API failure
                const cachedStats = await getCachedData(CACHE_KEY_STATS);
                const cachedBookings = await getCachedData(CACHE_KEY_BOOKINGS);
                if (cachedStats && cachedBookings) {
                    setStats(cachedStats);
                    setRecentBookings(cachedBookings);
                    showNotification('Offline');
                } else {
                    showNotification('No cached data available for dashboard.', 'info');
                }
            }
        } else {
            // Offline: Load from cache
            const cachedStats = await getCachedData(CACHE_KEY_STATS);
            const cachedBookings = await getCachedData(CACHE_KEY_BOOKINGS);
            if (cachedStats && cachedBookings) {
                setStats(cachedStats);
                setRecentBookings(cachedBookings);
                showNotification('You are offline. Displaying cached dashboard data.', 'info');
            } else {
                showNotification('You are offline and no cached dashboard data is available.', 'info');
            }
        }
        setLoading(false);
    }, [netInfo.isConnected, showNotification]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        stats,
        recentBookings,
        loading,
        error,
        refresh: fetchData,
    };
};