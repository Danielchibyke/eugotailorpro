import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';

const OFFLINE_QUEUE_KEY = 'offline_request_queue';
const CACHE_PREFIX = 'api_cache_';

let isProcessingQueue = false;
let offlineQueue = [];

// Function to load the queue from AsyncStorage
const loadQueue = async () => {
    try {
        const queueString = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
        if (queueString) {
            offlineQueue = JSON.parse(queueString);
            console.log('Offline queue loaded:', offlineQueue.length, 'items');
        }
    } catch (error) {
        console.error('Failed to load offline queue:', error);
    }
};

// Function to save the queue to AsyncStorage
const saveQueue = async () => {
    try {
        await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(offlineQueue));
        console.log('Offline queue saved:', offlineQueue.length, 'items');
    } catch (error) {
        console.error('Failed to save offline queue:', error);
    }
};

// Add a request to the queue
export const addRequestToQueue = async (request) => {
    offlineQueue.push(request);
    await saveQueue();
};

// Process the offline queue
export const processQueue = async (showNotification) => {
    if (isProcessingQueue || offlineQueue.length === 0) {
        return;
    }

    isProcessingQueue = true;
    showNotification('Attempting to sync offline changes...', 'info');

    let successCount = 0;
    let failCount = 0;
    const failedRequests = [];

    while (offlineQueue.length > 0) {
        const request = offlineQueue.shift(); // Get the first request
        try {
            // Re-create axios instance to ensure fresh headers/interceptors if needed
            const client = axios.create({
                baseURL: request.baseURL,
                headers: request.headers,
                timeout: request.timeout,
            });
            
            const response = await client({
                method: request.method,
                url: request.url,
                data: request.data,
                params: request.params,
            });
            console.log('Offline request successful:', request.url, response.status);
            successCount++;
        } catch (error) {
            console.error('Offline request failed:', request.url, error.message);
            failedRequests.push(request); // Add back to failed requests
            failCount++;
            // Optionally, add more sophisticated retry logic here (e.g., exponential backoff)
        }
    }

    offlineQueue = failedRequests; // Only keep requests that failed
    await saveQueue();

    if (successCount > 0) {
        showNotification(`Synced ${successCount} offline changes!`, 'success');
    }
    if (failCount > 0) {
        showNotification(`Failed to sync ${failCount} changes. Retrying later.`, 'error');
    }
    if (successCount === 0 && failCount === 0) {
        showNotification('No offline changes to sync.', 'info');
    }

    isProcessingQueue = false;
};

// Initialize the offline manager
export const initializeOfflineManager = (showNotification) => {
    loadQueue(); // Load queue on app start
    NetInfo.addEventListener(state => {
        if (state.isConnected) {
            console.log('Network is online. Processing offline queue...');
            processQueue(showNotification);
        }
    });
};

// --- Data Caching Functions ---

export const cacheData = async (key, data) => {
    try {
        await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
        console.log('Data cached for key:', key);
    } catch (error) {
        console.error('Failed to cache data:', key, error);
    }
};

export const getCachedData = async (key) => {
    try {
        const dataString = await AsyncStorage.getItem(CACHE_PREFIX + key);
        if (dataString) {
            console.log('Data retrieved from cache for key:', key);
            return JSON.parse(dataString);
        }
        return null;
    } catch (error) {
        console.error('Failed to get cached data:', key, error);
        return null;
    }
};

export const clearCache = async (key) => {
    try {
        await AsyncStorage.removeItem(CACHE_PREFIX + key);
        console.log('Cache cleared for key:', key);
    } catch (error) {
        console.error('Failed to clear cache:', key, error);
    }
};
