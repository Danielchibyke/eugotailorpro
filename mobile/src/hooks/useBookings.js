import { useState, useEffect, useCallback } from 'react';
import { bookingRepository } from '../data/bookingRepository';
import { useNotification } from '../context/NotificationContext';

export const useBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { showNotification } = useNotification();

    const fetchBookingsData = useCallback(async () => {
        setLoading(true);
        setError(null);
        const result = await bookingRepository.fetchBookings();
        if (result.success) {
            setBookings(result.data);
        } else {
            setError(result.error);
            showNotification(result.error, 'error');
        }
        setLoading(false);
    }, [showNotification]);

    const addBooking = useCallback(async (bookingData) => {
        const result = await bookingRepository.createBooking(bookingData);
        if (result.success) {
            setBookings(prevBookings => [...prevBookings, result.data]);
            showNotification('Booking added successfully!', 'success');
        } else {
            showNotification(result.error, 'error');
        }
        return result;
    }, [showNotification]);

    const updateBooking = useCallback(async (bookingId, updates) => {
        const result = await bookingRepository.updateBooking(bookingId, updates);
        if (result.success) {
            setBookings(prevBookings => prevBookings.map(b => b._id === bookingId ? result.data : b));
            showNotification('Booking updated successfully!', 'success');
        } else {
            showNotification(result.error, 'error');
        }
        return result;
    }, [showNotification]);

    const deleteBooking = useCallback(async (bookingId) => {
        const result = await bookingRepository.deleteBooking(bookingId);
        if (result.success) {
            setBookings(prevBookings => prevBookings.filter(b => b._id !== bookingId));
            showNotification('Booking deleted successfully!', 'success');
        } else {
            showNotification(result.error, 'error');
        }
        return result;
    }, [showNotification]);

    useEffect(() => {
        fetchBookingsData();
    }, [fetchBookingsData]);

    return {
        bookings,
        loading,
        error,
        refresh: fetchBookingsData,
        addBooking,
        updateBooking,
        deleteBooking,
    };
};