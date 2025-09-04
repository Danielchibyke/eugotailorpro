import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { addRequestToQueue } from './offlineManager';
import { jwtDecode } from 'jwt-decode'; // Added jwtDecode import

let logoutCallback = null; // To store the logout function from AuthContext

export const setApiLogoutCallback = (callback) => {
    logoutCallback = callback;
};

// Function to get the configured API instance
const getApi = () => {
    const api = axios.create({
        baseURL: `https://eugotailorpro.onrender.com/api`,
        timeout: 800000, // Set a timeout for requests
    });

    let isRefreshing = false;
    let failedQueue = [];

    const processQueue = (error, token = null) => {
        failedQueue.forEach(prom => {
            if (error) {
                prom.reject(error);
            } else {
                prom.resolve(token);
            }
        });
        failedQueue = [];
    };

    // Request interceptor to add the access token and handle proactive refresh
    api.interceptors.request.use(
        async (config) => {
            const userInfo = await AsyncStorage.getItem('userInfo');
            const { token, refreshToken } = userInfo ? JSON.parse(userInfo) : {};

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;

                try {
                    const decodedToken = jwtDecode(token);
                    const currentTime = Date.now() / 1000; // in seconds
                    const expiryThreshold = 300; // Refresh if token expires in next 5 minutes (300 seconds)

                    if (decodedToken.exp < currentTime + expiryThreshold) {
                        console.log('API Interceptor (Request): Access token is expired or near expiration. Attempting refresh.');

                        if (!isRefreshing) {
                            isRefreshing = true;
                            console.log('API Interceptor (Request): Initiating token refresh.');
                            try {
                                const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh-token`, { refreshToken });
                                const { token: newAccessToken, refreshToken: newRefreshToken } = data;

                                const updatedUserInfo = { ...JSON.parse(userInfo), token: newAccessToken, refreshToken: newRefreshToken };
                                await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));

                                api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                                config.headers.Authorization = `Bearer ${newAccessToken}`; // Update current request header
                                console.log('API Interceptor (Request): Token refreshed successfully. Processing queue.');
                                processQueue(null, newAccessToken);
                            } catch (refreshError) {
                                console.log('API Interceptor (Request): Proactive refresh failed.', refreshError.response?.data || refreshError);
                                // Check if the refresh error was due to network issues
                                if (refreshError.code === 'ERR_NETWORK' || !refreshError.response) {
                                    console.log('API Interceptor (Request): Proactive refresh failed due to network. Not logging out.');
                                    return Promise.reject({ isOffline: true, message: 'Proactive refresh failed due to network.' });
                                } else {
                                    console.log('API Interceptor (Request): Proactive refresh failed for other reasons (e.g., invalid token). Logging out.');
                                    await AsyncStorage.removeItem('userInfo');
                                    if (logoutCallback) {
                                        logoutCallback();
                                    }
                                    processQueue(refreshError); // Reject all queued requests
                                    return Promise.reject(refreshError);
                                }
                            } finally {
                                isRefreshing = false;
                            }
                        } else {
                            console.log('API Interceptor (Request): Token refresh already in progress. Queuing request.');
                            // If a refresh is already in progress, queue the original request
                            return new Promise((resolve, reject) => {
                                failedQueue.push({ resolve, reject });
                            }).then(token => {
                                config.headers.Authorization = `Bearer ${token}`;
                                return Promise.resolve(config);
                            }).catch(err => {
                                return Promise.reject(err);
                            });
                        }
                    }
                }
             catch (decodeError) {
                console.log('API Interceptor (Request): Error decoding token or token invalid.', decodeError);
                // If token is invalid, clear it and proceed without it (might lead to 401 later)
                await AsyncStorage.removeItem('userInfo');
                if (typeof logoutCallback === 'function') {
                    logoutCallback();
                }
            }
        } // Added missing brace here
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Response interceptor for token refresh
    api.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            // Check if offline
            const netInfoState = await NetInfo.fetch();
            if (!netInfoState.isConnected) {
                console.log('Offline: Adding request to queue.', originalRequest.url);
                await addRequestToQueue({
                    method: originalRequest.method,
                    url: originalRequest.url,
                    baseURL: originalRequest.baseURL,
                    headers: originalRequest.headers,
                    data: originalRequest.data,
                    params: originalRequest.params,
                    timeout: originalRequest.timeout,
                });
                // Return a rejected promise to stop further processing for this request
                return Promise.reject({ isOffline: true, message: 'Request queued due to offline status.' });
            }

            // If error is 401 (Unauthorized) and it's not a refresh token request
            if (error.response && error.response.status === 401 && !originalRequest._retry) {
                console.log('API Interceptor: Caught 401 Unauthorized.');
                originalRequest._retry = true; // Mark request as retried

                try {
                    console.log('API Interceptor: Attempting to get refresh token from AsyncStorage.');
                    const userInfo = await AsyncStorage.getItem('userInfo');
                    const { refreshToken } = userInfo ? JSON.parse(userInfo) : {};

                    if (!refreshToken) {
                        console.log('API Interceptor: No refresh token found. Logging out.');
                        // No refresh token, trigger logout
                        if (logoutCallback) {
                            logoutCallback();
                        }
                        return Promise.reject(error);
                    }

                    console.log('API Interceptor: Refresh token found. Requesting new access token.');
                    // Request a new access token using the refresh token
                    const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh-token`, { refreshToken });

                    const { token: newAccessToken, refreshToken: newRefreshToken } = data;
                    console.log('API Interceptor: Successfully received new access token.');

                    // Update tokens in AsyncStorage
                    const updatedUserInfo = { ...JSON.parse(userInfo), token: newAccessToken, refreshToken: newRefreshToken };
                    await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
                    console.log('API Interceptor: Tokens updated in AsyncStorage.');

                    // Update default authorization header for subsequent requests
                    api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    console.log('API Interceptor: Authorization header updated. Retrying original request.');

                    // Retry the original request with the new token
                    return api(originalRequest);

                } catch (refreshError) {
                    console.log('API Interceptor: Refresh token request failed.', refreshError.response?.data || refreshError);

                    // Check if the refresh error was due to network issues (using NetInfo and Axios error code)
                    const isNetworkError = (refreshError.code === 'ERR_NETWORK' || !refreshError.response || !(await NetInfo.fetch()).isConnected);

                    if (isNetworkError) {
                        console.log('API Interceptor: Refresh token request failed due to network. Not logging out.');
                        await addRequestToQueue({
                            method: originalRequest.method,
                            url: originalRequest.url,
                            baseURL: originalRequest.baseURL,
                            headers: originalRequest.headers,
                            data: originalRequest.data,
                            params: originalRequest.params,
                            timeout: originalRequest.timeout,
                        });
                        return Promise.reject({ isOffline: true, message: 'Refresh failed due to network. Original request queued.' });
                    } else {
                        console.log('API Interceptor: Refresh token request failed for other reasons (e.g., invalid token). Logging out.');
                        if (logoutCallback) {
                            logoutCallback();
                        }
                        return Promise.reject(refreshError);
                    }
                }
            }

            return Promise.reject(error);
        }
    );

    return api;
};

export { getApi }; // Export the function