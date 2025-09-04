// mobile/src/data/clientRepository.js
import { getApi } from '../utils/api';
import { cacheData, getCachedData, addRequestToQueue } from '../utils/offlineManager';
import NetInfo from '@react-native-community/netinfo';

// Note: This file will be structured with functions rather than as a class or hook,
// so we can't use hooks directly at the top level. Instead, we'll get the realm instance
// inside each function that needs it.

export const clientRepository = {
    // Fetches clients from the API and syncs them to the local Realm database.
    async fetchClients() {
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
            try {
                const { data } = await getApi().get('/clients');
                await cacheData('clients', data);
                return { success: true, data };
            } catch (err) {
                console.error('Failed to fetch clients from API:', err);
                const cachedData = await getCachedData('clients');
                if (cachedData) {
                    return { success: true, data: cachedData, fromCache: true };
                }
                return { success: false, error: err.response?.data?.msg || 'Failed to fetch clients.' };
            }
        } else {
            const cachedData = await getCachedData('clients');
            if (cachedData) {
                return { success: true, data: cachedData, fromCache: true };
            }
            return { success: false, error: 'You are offline and no cached data is available.' };
        }
    },

    // Creates a new client in the local Realm database.
    async createClient(clientData) {
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
            try {
                const { data } = await getApi().post('/clients', clientData);
                // Update cache
                const cachedData = await getCachedData('clients') || [];
                const newData = [...cachedData, data];
                await cacheData('clients', newData);
                return { success: true, data };
            } catch (error) {
                console.error('Failed to create client:', error);
                return { success: false, error: error.response?.data?.msg || 'Failed to create client.' };
            }
        } else {
            // Optimistic update
            const cachedData = await getCachedData('clients') || [];
            const newClient = { ...clientData, _id: `temp-${Date.now()}`, optimistic: true }; // Temporary ID
            const newData = [...cachedData, newClient];
            await cacheData('clients', newData);

            addRequestToQueue({
                method: 'post',
                url: '/clients',
                data: clientData,
            });

            return { success: true, data: newClient, optimistic: true };
        }
    },

    // Updates an existing client in the local Realm database.
    async updateClient(clientId, updates) {
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
            try {
                const { data } = await getApi().put(`/clients/${clientId}`, updates);
                // Update cache
                const cachedData = await getCachedData('clients') || [];
                const newData = cachedData.map(c => c._id === clientId ? data : c);
                await cacheData('clients', newData);
                return { success: true, data };
            } catch (error) {
                console.error('Failed to update client:', error);
                return { success: false, error: error.response?.data?.msg || 'Failed to update client.' };
            }
        } else {
            // Optimistic update
            const cachedData = await getCachedData('clients') || [];
            const updatedClient = { ...cachedData.find(c => c._id === clientId), ...updates, optimistic: true };
            const newData = cachedData.map(c => c._id === clientId ? updatedClient : c);
            await cacheData('clients', newData);

            addRequestToQueue({
                method: 'put',
                url: `/clients/${clientId}`,
                data: updates,
            });

            return { success: true, data: updatedClient, optimistic: true };
        }
    },

    // Marks a client for deletion in the local Realm database.
    async deleteClient(clientId) {
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
            try {
                await getApi().delete(`/clients/${clientId}`);
                // Update cache
                const cachedData = await getCachedData('clients') || [];
                const newData = cachedData.filter(c => c._id !== clientId);
                await cacheData('clients', newData);
                return { success: true };
            } catch (error) {
                console.error('Failed to delete client:', error);
                return { success: false, error: error.response?.data?.msg || 'Failed to delete client.' };
            }
        } else {
            // Optimistic update
            const cachedData = await getCachedData('clients') || [];
            const newData = cachedData.filter(c => c._id !== clientId);
            await cacheData('clients', newData);

            addRequestToQueue({
                method: 'delete',
                url: `/clients/${clientId}`,
            });

            return { success: true, optimistic: true };
        }
    },
};
