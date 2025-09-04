// mobile/src/hooks/useClients.js
import { useState, useEffect, useCallback } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { clientRepository } from '../data/clientRepository';
import { useNotification } from '../context/NotificationContext';

export const useClients = () => {
    const netInfo = useNetInfo();
    const { showNotification } = useNotification();

    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchClientsData = useCallback(async () => {
        setLoading(true);
        setError(null);
        const result = await clientRepository.fetchClients();
        if (result.success) {
            setClients(result.data);
            if (result.fromCache) {
                showNotification('You are offline. Displaying cached data.', 'info');
            } else {
                showNotification('Clients synced successfully!', 'success');
            }
        } else {
            setError(result.error);
            showNotification(result.error, 'error');
        }
        setLoading(false);
    }, [showNotification]);

    useEffect(() => {
        // Fetch data when the hook is first used
        fetchClientsData();
    }, [fetchClientsData]);

    const addClient = useCallback(async (clientData) => {
        const result = await clientRepository.createClient(clientData);
        if (result.success) {
            setClients(prevClients => [...prevClients, result.data]);
            showNotification('Client added successfully!', 'success');
        } else {
            showNotification(result.error, 'error');
        }
        return result;
    }, [showNotification]);

    const updateClient = useCallback(async (clientId, updates) => {
        const result = await clientRepository.updateClient(clientId, updates);
        if (result.success) {
            setClients(prevClients => prevClients.map(c => c._id === clientId ? result.data : c));
            showNotification('Client updated successfully!', 'success');
        } else {
            showNotification(result.error, 'error');
        }
        return result;
    }, [showNotification]);

    const deleteClient = useCallback(async (clientId) => {
        const result = await clientRepository.deleteClient(clientId);
        if (result.success) {
            setClients(prevClients => prevClients.filter(c => c._id !== clientId));
            showNotification('Client deleted successfully!', 'success');
        } else {
            showNotification(result.error, 'error');
        }
        return result;
    }, [showNotification]);

    return {
        clients,
        loading,
        error,
        refresh: fetchClientsData, // Expose a refresh function
        addClient,
        updateClient,
        deleteClient,
    };
};
