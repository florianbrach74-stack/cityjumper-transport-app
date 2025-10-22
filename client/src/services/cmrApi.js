import api from './api';

export const cmrAPI = {
  getMyCMRs: () => api.get('/cmr/my-cmrs'),
  getCMRByOrderId: (orderId) => api.get(`/cmr/order/${orderId}`),
  getCMRByCMRNumber: (cmrNumber) => api.get(`/cmr/${cmrNumber}`),
  addSignature: (cmrId, data) => api.post(`/cmr/${cmrId}/signature`, data),
};

export default cmrAPI;
