import api from './axiosInstance';

export const login = (data) => api.post('/api/auth/login', data);
export const register = (data) => api.post('/api/auth/register', data);
export const registerOwner = (data) => api.post('/api/auth/owner/register', data);
