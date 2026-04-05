import api from './api';

const BASE = '/admin/catalog';

export const adminCatalogService = {
  // Products
  getProducts: (params = {}) => api.get(`${BASE}/products/`, { params }).then((r) => r.data),
  getProduct: (id) => api.get(`${BASE}/products/${id}/`).then((r) => r.data),
  createProduct: (data) => api.post(`${BASE}/products/`, data).then((r) => r.data),
  updateProduct: (id, data) => api.patch(`${BASE}/products/${id}/`, data).then((r) => r.data),
  deleteProduct: (id) => api.delete(`${BASE}/products/${id}/`),
  generateProductDescription: (data) =>
    api.post(`${BASE}/products/generate-description/`, data).then((r) => r.data),
  generateProductDetails: (data) =>
    api.post(`${BASE}/products/generate-details/`, data).then((r) => r.data),
  generateProductImage: (data) =>
    api.post(`${BASE}/products/generate-image/`, data).then((r) => r.data),

  // Product images
  uploadProductImage: (productId, formData) =>
    api.post(`${BASE}/products/${productId}/images/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),
  deleteProductImage: (productId, imageId) =>
    api.delete(`${BASE}/products/${productId}/images/${imageId}/`),
  updateImageOrder: (productId, imageId, sortOrder) =>
    api.patch(`${BASE}/products/${productId}/images/${imageId}/`, { sortOrder }).then((r) => r.data),

  // Variants
  getVariants: (productId) => api.get(`${BASE}/products/${productId}/variants/`).then((r) => r.data),
  createVariant: (productId, data) =>
    api.post(`${BASE}/products/${productId}/variants/`, data).then((r) => r.data),
  updateVariant: (productId, variantId, data) =>
    api.patch(`${BASE}/products/${productId}/variants/${variantId}/`, data).then((r) => r.data),
  deleteVariant: (productId, variantId) =>
    api.delete(`${BASE}/products/${productId}/variants/${variantId}/`),

  // Categories
  getCategories: (params = {}) => api.get(`${BASE}/categories/`, { params }).then((r) => r.data),
  getCategory: (id) => api.get(`${BASE}/categories/${id}/`).then((r) => r.data),
  createCategory: (data) => api.post(`${BASE}/categories/`, data).then((r) => r.data),
  updateCategory: (id, data) => api.patch(`${BASE}/categories/${id}/`, data).then((r) => r.data),
  deleteCategory: (id) => api.delete(`${BASE}/categories/${id}/`),

  // Attributes
  getAttributes: (params = {}) => api.get(`${BASE}/attributes/`, { params }).then((r) => r.data),
  getAttribute: (id) => api.get(`${BASE}/attributes/${id}/`).then((r) => r.data),
  createAttribute: (data) => api.post(`${BASE}/attributes/`, data).then((r) => r.data),
  updateAttribute: (id, data) => api.patch(`${BASE}/attributes/${id}/`, data).then((r) => r.data),
  deleteAttribute: (id) => api.delete(`${BASE}/attributes/${id}/`),

  // Attribute values
  getAttributeValues: (params = {}) =>
    api.get(`${BASE}/attribute-values/`, { params }).then((r) => r.data),
  createAttributeValue: (data) =>
    api.post(`${BASE}/attribute-values/`, data).then((r) => r.data),
  updateAttributeValue: (id, data) =>
    api.patch(`${BASE}/attribute-values/${id}/`, data).then((r) => r.data),
  deleteAttributeValue: (id) => api.delete(`${BASE}/attribute-values/${id}/`),
};
