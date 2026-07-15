import api from './axiosInstance';

export const getAdminUsers = (page = 0, size = 10) =>
  api.get(`/api/admin/users?page=${page}&size=${size}`);
export const toggleUserBlock = (id) => api.patch(`/api/admin/users/${id}/block`);
export const getAdminRestaurants = () => api.get('/api/admin/restaurants');
export const approveRestaurant = (id) => api.patch(`/api/admin/restaurants/${id}/approve`);
export const toggleRestaurantApproval = (id) => api.patch(`/api/admin/restaurants/${id}/toggle-approval`);
export const getAdminOrders = (page = 0, size = 10) =>
  api.get(`/api/admin/orders?page=${page}&size=${size}`);
export const getDashboardStats = () => api.get('/api/admin/dashboard');
export const createAdmin = (data) => api.post('/api/admin/users/create-admin', data);
