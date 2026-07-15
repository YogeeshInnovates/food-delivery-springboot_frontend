import axios from 'axios';
import useAuthStore from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : 'http://localhost:8080'),
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global response error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('AXIOS ERROR INTERCEPTOR CAUGHT:', error);
    if (error.response) {
      console.error('ERROR RESPONSE DATA:', error.response.data);
    }

    if (error.response?.status === 401) {
      // Don't intercept 401s for login requests so the component can handle it
      if (!error.config?.url?.includes('/api/auth/login')) {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    let message = error.response?.data?.message || error.response?.data?.error;
    if (!message && error.response?.status === 401) message = 'Invalid email or password';
    if (!message && error.response?.status === 403) message = 'Access denied';
    if (!message && error.code === 'ERR_NETWORK') message = 'Unable to connect to the server. Make sure the backend is running.';
    if (!message) message = 'Something went wrong';

    return Promise.reject(new Error(message));
  }
);

export default api;
