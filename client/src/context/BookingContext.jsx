import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';


const BookingContext = createContext();
export const BookingProvider = ({ children }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();
   

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                setLoading(true);
                const { data } = await api.get('/bookings');
                setBookings(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);
    const addBooking = async (bookingData) => {
        try {
            const { data } = await api.post('/bookings', bookingData);
            setBookings((prev) => [...prev, data]);
            return data;
        } catch (err) {
            throw new Error(err.response?.data?.message || err.message);
        }
    };

    const updateBooking = async (id, bookingData) => {
        try {
            const { data } = await api.put(`/bookings/${id}`, bookingData);
            setBookings((prev) =>
                prev.map((booking) => (booking._id === id ? data : booking))
            );
            return data;
        } catch (err) {
            throw new Error(err.response?.data?.message || err.message);
        }
    };

    const deleteBooking = async (id) => {
        try {
            await api.delete(`/bookings/${id}`);
            setBookings((prev) => prev.filter((booking) => booking._id !== id));
        } catch (err) {
            throw new Error(err.response?.data?.message || err.message);
        }
    };

    return (
        <BookingContext.Provider
            value={{
                bookings,
                loading,
                error,
                setBookings,
                setLoading,
                setError,
                addBooking,
                updateBooking,
                deleteBooking,
            }}
        >
            {children}
        </BookingContext.Provider>
    );
};
export const useBookings = () => {
    return useContext(BookingContext);
};