import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
    baseURL: `http://172.20.10.3:5000/api`, // Adjust this to your backend URL
    timeout: 800000, // Set a timeout for requests
   
});

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

export default api;

