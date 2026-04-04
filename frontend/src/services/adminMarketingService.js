import api from './api';

export const adminMarketingService = {
  getCoupons: (params = {}) => api.get('/admin/marketing/coupons/', { params }).then((r) => r.data),
  getCoupon: (id) => api.get(`/admin/marketing/coupons/${id}/`).then((r) => r.data),
  createCoupon: (data) => api.post('/admin/marketing/coupons/', data).then((r) => r.data),
  updateCoupon: (id, data) =>
    api.patch(`/admin/marketing/coupons/${id}/`, data).then((r) => r.data),
  deleteCoupon: (id) => api.delete(`/admin/marketing/coupons/${id}/`),
};
