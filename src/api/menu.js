import api from './axiosInstance';

// Public
export const getMenu = (restaurantId, category, page = 0, size = 20) =>
  api.get(`/api/restaurants/${restaurantId}/menu`, {
    params: { category, page, size },
  });

export const getPopularItems = (page = 0, size = 20) =>
  api.get('/api/menu-items/popular', { params: { page, size } });

export const searchMenuItems = (query, page = 0, size = 20) =>
  api.get(`/api/menu-items/search`, { params: { q: query, page, size } });

// Owner-specific
export const addMenuItem = (restaurantId, data) =>
  api.post(`/api/owner/restaurants/${restaurantId}/menu-items`, data);

export const updateMenuItem = (itemId, data) =>
  api.put(`/api/owner/menu-items/${itemId}`, data);

export const toggleAvailability = (itemId) =>
  api.patch(`/api/owner/menu-items/${itemId}/availability`);

export const deleteMenuItem = (itemId) => api.delete(`/api/owner/menu-items/${itemId}`);

export const uploadMenuItemImage = (itemId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/api/owner/menu-items/${itemId}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const uploadTempMenuItemImage = (restaurantId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/api/owner/restaurants/${restaurantId}/menu-images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteTempMenuImage = (restaurantId, imageUrl) =>
  api.delete(`/api/owner/restaurants/${restaurantId}/menu-images?imageUrl=${encodeURIComponent(imageUrl)}`);
