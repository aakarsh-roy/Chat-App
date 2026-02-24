import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;
      
      // Clear all auth data only if token is invalid
      if (errorCode === 'INVALID_TOKEN' || errorCode === 'TOKEN_EXPIRED') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Dispatch custom event for auth store to handle
        window.dispatchEvent(new Event('auth-logout'));
        
        // Show appropriate message based on error code
        if (errorCode === 'INVALID_TOKEN') {
          console.warn('Invalid authentication token. Please log in again.');
        } else if (errorCode === 'TOKEN_EXPIRED') {
          console.warn('Session expired. Please log in again.');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
