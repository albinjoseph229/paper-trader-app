// src/services/api.js
import axios from 'axios';

const apiClient = axios.create({
  // This line is the only change needed.
  // It tells the app to use the VITE_API_URL when deployed,
  // but fall back to your local server during development.
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
});

// This is an "interceptor". It's a function that runs before every request is sent.
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // If a token exists, add it to the Authorization header
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;