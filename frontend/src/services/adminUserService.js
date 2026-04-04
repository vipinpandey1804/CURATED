import api from './api';

export const adminUserService = {
  getUsers: (params = {}) => api.get('/admin/users/', { params }).then((r) => r.data),
  getUser: (id) => api.get(`/admin/users/${id}/`).then((r) => r.data),
  updateUser: (id, data) => api.patch(`/admin/users/${id}/`, data).then((r) => r.data),
  getStats: () => api.get('/admin/stats/').then((r) => r.data),
};
