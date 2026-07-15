import api from './axiosInstance';

export const getCart = () => api.get('/api/cart');
export const addToCart = (data) => api.post('/api/cart/items', data);
export const updateCartItem = (itemId, quantity) =>
  api.put(`/api/cart/items/${itemId}?quantity=${quantity}`);
export const removeFromCart = (itemId) => api.delete(`/api/cart/items/${itemId}`);
export const clearCart = () => api.delete('/api/cart');
