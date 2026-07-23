import api from './axiosInstance';

export const placeOrder = () => api.post('/api/orders');
export const payForOrder = (id, paymentMethod) =>
  api.post(`/api/orders/${id}/pay`, { paymentMethod });
export const updateDeliveryAddress = (id, data) =>
  api.patch(`/api/orders/${id}/delivery-address`, data);
export const getMyOrders = (page = 0, size = 10) =>
  api.get(`/api/orders?page=${page}&size=${size}`);
export const getOrderDetails = (id) => api.get(`/api/orders/${id}`);
export const cancelOrder = (id, reason) => api.post(`/api/orders/${id}/cancel`, { reason });
export const getMyTotalSpend = () => api.get('/api/orders/summary');
export const updateOrderStatus = (id, status) =>
  api.patch(`/api/orders/${id}/status?status=${status}`);
export const confirmDelivery = (id) =>
  api.post(`/api/orders/${id}/confirm-delivery`);
