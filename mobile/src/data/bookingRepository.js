// mobile/src/data/bookingRepository.js
import { getApi } from '../utils/api';
import { cacheData, getCachedData, addRequestToQueue } from '../utils/offlineManager';
import NetInfo from '@react-native-community/netinfo';

export const bookingRepository = {
    // Fetches bookings from the API and syncs them to the local Realm database.
    async fetchBookings() {
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
            try {
                const { data } = await getApi().get('/bookings');
                await cacheData('bookings', data);
                return { success: true, data };
            } catch (err) {
                console.error('Failed to fetch bookings from API:', err);
                const cachedData = await getCachedData('bookings');
                if (cachedData) {
                    return { success: true, data: cachedData, fromCache: true };
                }
                return { success: false, error: err.response?.data?.msg || 'Failed to fetch bookings.' };
            }
        } else {
            const cachedData = await getCachedData('bookings');
            if (cachedData) {
                return { success: true, data: cachedData, fromCache: true };
            }
            return { success: false, error: 'You are offline and no cached data is available.' };
        }
    },

    // Creates a new booking in the local Realm database.
    async createBooking(bookingData) {
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
            try {
                const { data } = await getApi().post('/bookings', bookingData);
                // Update cache
                const cachedData = await getCachedData('bookings') || [];
                const newData = [...cachedData, data];
                await cacheData('bookings', newData);
                return { success: true, data };
            } catch (error) {
                console.error('Failed to create booking:', error);
                return { success: false, error: error.response?.data?.msg || 'Failed to create booking.' };
            }
        } else {
            // Optimistic update
            const cachedData = await getCachedData('bookings') || [];
            const newBooking = { ...bookingData, _id: `temp-${Date.now()}`, optimistic: true }; // Temporary ID
            const newData = [...cachedData, newBooking];
            await cacheData('bookings', newData);

            addRequestToQueue({
                method: 'post',
                url: '/bookings',
                data: bookingData,
            });

            return { success: true, data: newBooking, optimistic: true };
        }
    },

    // Updates an existing booking in the local Realm database.
    async updateBooking(bookingId, updates) {
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
            try {
                const { data } = await getApi().put(`/bookings/${bookingId}`, updates);
                // Update cache
                const cachedData = await getCachedData('bookings') || [];
                const newData = cachedData.map(b => b._id === bookingId ? data : b);
                await cacheData('bookings', newData);
                return { success: true, data };
            } catch (error) {
                console.error('Failed to update booking:', error);
                return { success: false, error: error.response?.data?.msg || 'Failed to update booking.' };
            }
        } else {
            // Optimistic update
            const cachedData = await getCachedData('bookings') || [];
            const updatedBooking = { ...cachedData.find(b => b._id === bookingId), ...updates, optimistic: true };
            const newData = cachedData.map(b => b._id === bookingId ? updatedBooking : b);
            await cacheData('bookings', newData);

            addRequestToQueue({
                method: 'put',
                url: `/bookings/${bookingId}`,
                data: updates,
            });

            return { success: true, data: updatedBooking, optimistic: true };
        }
    },

    // Marks a booking for deletion in the local Realm database.
    async deleteBooking(bookingId) {
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
            try {
                await getApi().delete(`/bookings/${bookingId}`);
                // Update cache
                const cachedData = await getCachedData('bookings') || [];
                const newData = cachedData.filter(b => b._id !== bookingId);
                await cacheData('bookings', newData);
                return { success: true };
            } catch (error) {
                console.error('Failed to delete booking:', error);
                return { success: false, error: error.response?.data?.msg || 'Failed to delete booking.' };
            }
        } else {
            // Optimistic update
            const cachedData = await getCachedData('bookings') || [];
            const newData = cachedData.filter(b => b._id !== bookingId);
            await cacheData('bookings', newData);

            addRequestToQueue({
                method: 'delete',
                url: `/bookings/${bookingId}`,
            });

            return { success: true, optimistic: true };
        }
    },
    // Fetches bookings for a specific client.
    async fetchBookingById(bookingId) {
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
            try {
                const { data } = await getApi().get(`/bookings/${bookingId}`);
                // Optionally update the cache for this specific booking
                const cachedData = await getCachedData('bookings') || [];
                const newData = cachedData.map(b => b._id === bookingId ? data : b);
                await cacheData('bookings', newData);
                return { success: true, data };
            } catch (err) {
                console.error(`Failed to fetch booking ${bookingId} from API:`, err);
                // Try to find it in the cache as a fallback
                const cachedBookings = await getCachedData('bookings');
                const booking = cachedBookings?.find(b => b._id === bookingId);
                if (booking) {
                    return { success: true, data: booking, fromCache: true };
                }
                return { success: false, error: err.response?.data?.msg || 'Failed to fetch booking.' };
            }
        } else {
            const cachedBookings = await getCachedData('bookings');
            const booking = cachedBookings?.find(b => b._id === bookingId);
            if (booking) {
                return { success: true, data: booking, fromCache: true };
            }
            return { success: false, error: 'You are offline and the booking is not cached.' };
        }
    },
}
