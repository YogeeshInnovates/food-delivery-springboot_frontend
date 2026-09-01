import api from './axiosInstance';

export const login = (data) => api.post('/api/auth/login', data);
export const register = (data) => api.post('/api/auth/register', data);
export const registerOwner = (data) => api.post('/api/auth/owner/register', data);
export const verifyOtp = (data) => api.post('/api/auth/verify-otp', data);
export const forgotPassword = (data) => api.post('/api/auth/forgot-password', data);
export const resetPassword = (data) => api.post('/api/auth/reset-password', data);
