import axios from 'axios';

// Use production backend URL
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
    console.log('🔑 Token added to request:', config.url);
  } else {
    console.warn('⚠️ No token found in localStorage for request:', config.url);
  }
  return config;
}, (error) => {
  console.error('❌ Request interceptor error:', error);
  return Promise.reject(error);
});

// Handle 401 and 403 errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response received:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('🔒 Authentication error - redirecting to login');
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
  updateOrderPrice: (id, newPrice) => api.put(`/orders/${id}/price`, { price: newPrice }),
};

// Bids API
export const bidsAPI = {
  createBid: (orderId, data) => api.post(`/bids/orders/${orderId}/bid`, data),
  getMyBids: () => api.get('/bids/my-bids'),
  getBidsForOrder: (orderId) => api.get(`/bids/orders/${orderId}`),
  acceptBid: (bidId) => api.post(`/bids/${bidId}/accept`),
  rejectBid: (bidId) => api.post(`/bids/${bidId}/reject`),
};

// Verification API
export const verificationAPI = {
  submitVerification: (data) => api.post('/verification/submit', data),
  getStatus: () => api.get('/verification/status'),
  approveContractor: (userId, notes) => api.post(`/verification/${userId}/approve`, { notes }),
  rejectContractor: (userId, reason) => api.post(`/verification/${userId}/reject`, { reason }),
  getAllContractorsWithDocuments: () => api.get('/verification/contractors'),
  getContractorDocuments: (userId) => api.get(`/verification/contractors/${userId}/documents`),
  downloadDocument: (documentId) => `${API_URL}/verification/documents/${documentId}/download`,
};

export default api;
