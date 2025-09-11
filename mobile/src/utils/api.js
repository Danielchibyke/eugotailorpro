
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { addRequestToQueue } from './offlineManager';
import { jwtDecode } from 'jwt-decode';

let logoutCallback = null;
export const setApiLogoutCallback = (callback) => {
    logoutCallback = callback;
};

let refreshTokenPromise = null;
//for local dev server
// http://172.20.10.3:5000/api

//https://eugotailorpro.onrender.com/api  for production

const getApi = () => {
    const api = axios.create({
        baseURL: "http://172.20.10.3:5000/api",
        timeout: 800000,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    api.interceptors.request.use(
        async (config) => {
            const userInfo = await AsyncStorage.getItem('userInfo');
            const { token, refreshToken } = userInfo ? JSON.parse(userInfo) : {};

            if (!token) {
                return config;
            }

            // Check if the token is expired or needs proactive refresh
            const decodedToken = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            const expiryThreshold = 300; // 5 minutes

            if (decodedToken.exp < currentTime + expiryThreshold) {
                if (!refreshTokenPromise) {
                    console.log('API Interceptor: Token expired or needs refresh. Initiating refresh.');
                    refreshTokenPromise = axios.post(`${api.defaults.baseURL}/auth/refresh-token`, { refreshToken })
                        .then(async (response) => {
                            const { token: newAccessToken, refreshToken: newRefreshToken } = response.data;
                            const newUserInfo = { ...JSON.parse(userInfo), token: newAccessToken, refreshToken: newRefreshToken };
                            await AsyncStorage.setItem('userInfo', JSON.stringify(newUserInfo));
                            
                            console.log('API Interceptor: Token refreshed successfully.');
                            refreshTokenPromise = null; // Clear promise after success
                            return newAccessToken;
                        })
                        .catch(async (error) => {
                            console.error('API Interceptor: Token refresh failed.', error.response?.data || error);
                            refreshTokenPromise = null; // Clear promise after failure
                            if (logoutCallback) {
                                logoutCallback();
                            }
                            return Promise.reject(error);
                        });
                }

                return refreshTokenPromise.then(newAccessToken => {
                    config.headers.Authorization = `Bearer ${newAccessToken}`;
                    return config;
                });
            }

            config.headers.Authorization = `Bearer ${token}`;
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    api.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            const netInfoState = await NetInfo.fetch();
            if (!netInfoState.isConnected) {
                console.log('Offline: Adding request to queue.', originalRequest.url);
                await addRequestToQueue({
                    method: originalRequest.method,
                    url: originalRequest.url,
                    data: originalRequest.data,
                });
                return Promise.reject({ isOffline: true, message: 'Request queued due to offline status.' });
            }

            if (error.response && error.response.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;

                if (!refreshTokenPromise) {
                    console.log('API Interceptor (401): No active refresh. Initiating refresh.');
                    const userInfo = await AsyncStorage.getItem('userInfo');
                    const { refreshToken } = userInfo ? JSON.parse(userInfo) : {};

                    if (!refreshToken) {
                        if (logoutCallback) logoutCallback();
                        return Promise.reject(error);
                    }

                    refreshTokenPromise = axios.post(`${api.defaults.baseURL}/auth/refresh-token`, { refreshToken })
                        .then(async (response) => {
                            const { token: newAccessToken, refreshToken: newRefreshToken } = response.data;
                            const newUserInfo = { ...JSON.parse(userInfo), token: newAccessToken, refreshToken: newRefreshToken };
                            await AsyncStorage.setItem('userInfo', JSON.stringify(newUserInfo));

                            console.log('API Interceptor (401): Token refreshed successfully.');
                            refreshTokenPromise = null;
                            return newAccessToken;
                        })
                        .catch((err) => {
                            console.error('API Interceptor (401): Token refresh failed.', err.response?.data || err);
                            refreshTokenPromise = null;
                            if (logoutCallback) {
                                logoutCallback();
                            }
                            return Promise.reject(err);
                        });
                }

                return refreshTokenPromise.then(newAccessToken => {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return api(originalRequest);
                });
            }

            return Promise.reject(error);
        }
    );

    return api;
};

export { getApi };
