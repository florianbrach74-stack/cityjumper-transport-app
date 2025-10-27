import api from './api';

export const cmrAPI = {
  getMyCMRs: () => api.get('/cmr/my'),
  getCMRByOrderId: (orderId) => api.get(`/cmr/order/${orderId}`),
  getCMRByCMRNumber: (cmrNumber) => api.get(`/cmr/number/${cmrNumber}`),
  addSignature: (cmrId, data) => api.post(`/cmr/${cmrId}/signature`, data),
  addPublicSignature: (cmrNumber, data) => {
    // Public route - no auth token needed
    const apiUrl = import.meta.env.VITE_API_URL || 'https://cityjumper-api-production-01e4.up.railway.app';
    return fetch(`${apiUrl}/api/cmr/public/${cmrNumber}/signature`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json());
  },
};

export default cmrAPI;
