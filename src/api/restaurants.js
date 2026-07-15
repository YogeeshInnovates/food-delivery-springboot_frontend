import api from './axiosInstance';

// Public
export const listRestaurants = (page = 0, size = 10) =>
  api.get(`/api/restaurants?page=${page}&size=${size}`);

export const getRestaurant = (id) => api.get(`/api/restaurants/${id}`);

export const filterRestaurants = (city, cuisine) =>
  api.get('/api/restaurants/filter', { params: { city, cuisine } });

// Owner-specific
export const getMyRestaurants = () => api.get('/api/owner/restaurants/my');

export const getMyRestaurantById = (id) => api.get(`/api/owner/restaurants/${id}`);

export const addRestaurant = (data) => api.post('/api/owner/restaurants', data);

export const updateRestaurant = (id, data) => api.put(`/api/owner/restaurants/${id}`, data);

export const toggleRestaurantStatus = (id) =>
  api.patch(`/api/owner/restaurants/${id}/status`);

export const uploadRestaurantImage = (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/api/owner/restaurants/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteRestaurantImage = (id, imageUrl) =>
  api.delete(`/api/owner/restaurants/${id}/image`, { params: { imageUrl } });

export const completeRegistration = (id, data) =>
  api.put(`/api/owner/restaurants/${id}/complete-registration`, data);
