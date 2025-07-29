import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

let logoutCallback = null; // To store the logout function from AuthContext

export const setApiLogoutCallback = (callback) => {
    logoutCallback = callback;
};

const api = axios.create({
    baseURL: `http://172.20.10.3:5000/api`, // Adjust this to your backend URL
    timeout: 800000, // Set a timeout for requests
});

// Request interceptor to add the access token
api.interceptors.request.use(
    async (config) => {
        const userInfo = await AsyncStorage.getItem('userInfo');
        const token = userInfo ? JSON.parse(userInfo).token : null;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
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

        // If error is 401 (Unauthorized) and it's not a refresh token request
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Mark request as retried

            try {
                const userInfo = await AsyncStorage.getItem('userInfo');
                const { refreshToken } = userInfo ? JSON.parse(userInfo) : {};

                if (!refreshToken) {
                    // No refresh token, trigger logout
                    if (logoutCallback) {
                        logoutCallback();
                    }
                    return Promise.reject(error); 
                }

                // Request a new access token using the refresh token
                const { data } = await axios.post(`http://172.20.10.3:5000/api/auth/refresh-token`, { refreshToken });

                const { token: newAccessToken, refreshToken: newRefreshToken } = data;

                // Update tokens in AsyncStorage
                const updatedUserInfo = { ...JSON.parse(userInfo), token: newAccessToken, refreshToken: newRefreshToken };
                await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));

                // Update default authorization header for subsequent requests
                api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                // Retry the original request with the new token
                return api(originalRequest);

            } catch (refreshError) {
                // Refresh token failed or expired, log out the user
                if (logoutCallback) {
                    logoutCallback();
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;

