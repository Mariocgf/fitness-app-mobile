import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5233',
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

export default apiClient;
