import api from './api';

export const adminUserService = {
  getUsers: (params = {}) => api.get('/admin/users/', { params }).then((r) => r.data),
  getUser: (id) => api.get(`/admin/users/${id}/`).then((r) => r.data),
  updateUser: (id, data) => api.patch(`/admin/users/${id}/`, data).then((r) => r.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}/`).then((r) => r.data),
  setUserPassword: (id, data) => api.post(`/admin/users/${id}/set-password/`, data).then((r) => r.data),
  getStats: (params = {}) => api.get('/admin/stats/', { params }).then((r) => r.data),
};
