import axios from 'axios';

// IMPORTANT: Replace this with your computer's IP address from Step 1
const YOUR_COMPUTER_IP = '192.168.1.10'; // Example: '192.168.1.10'

const api = axios.create({
    baseURL: `http://172.20.10.3:5000/api`,
});

export default api;

