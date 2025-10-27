import axios from 'axios';

// Use production backend URL or fallback to local proxy
const API_URL = 'https://cityjumper-api-production-01e4.up.railway.app/api'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// Orders API
export const ordersAPI = {
  createOrder: (data) => api.post('/orders', data),
  getOrders: () => api.get('/orders'),
  getAvailableOrders: () => api.get('/orders/available'),
  acceptOrder: (id) => api.post(`/orders/${id}/accept`),
  getOrder: (id) => api.get(`/orders/${id}`),
  updateOrderStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
};

// Bids API
export const bidsAPI = {
  createBid: (orderId, data) => api.post(`/bids/orders/${orderId}/bid`, data),
  getMyBids: () => api.get('/bids/my-bids'),
  getBidsForOrder: (orderId) => api.get(`/bids/orders/${orderId}`),
  acceptBid: (bidId) => api.post(`/bids/${bidId}/accept`),
  rejectBid: (bidId) => api.post(`/bids/${bidId}/reject`),
};

export default api;
