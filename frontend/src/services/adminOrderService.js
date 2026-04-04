import api from './api';

export const adminOrderService = {
  getOrders: (params = {}) => api.get('/admin/orders/', { params }).then((r) => r.data),
  getOrder: (id) => api.get(`/admin/orders/${id}/`).then((r) => r.data),
  updateOrderStatus: (id, data) =>
    api.patch(`/admin/orders/${id}/status/`, data).then((r) => r.data),
};

export const adminReturnService = {
  getReturns: (params = {}) => api.get('/admin/returns/', { params }).then((r) => r.data),
  getReturn: (id) => api.get(`/admin/returns/${id}/`).then((r) => r.data),
  approveReturn: (id, data = {}) =>
    api.patch(`/admin/returns/${id}/approve/`, data).then((r) => r.data),
  rejectReturn: (id, data = {}) =>
    api.patch(`/admin/returns/${id}/reject/`, data).then((r) => r.data),
};
