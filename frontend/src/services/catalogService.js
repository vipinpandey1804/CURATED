import api from './api';

export const catalogService = {
  /**
   * Get all categories (tree structure).
   */
  async getCategories() {
    const { data } = await api.get('/catalog/categories/');
    return data.results ?? data;
  },

  /**
   * Get paginated product list.
   * @param {object} params — { page, pageSize, category, isNew, isFeatured, search, ordering, minPrice, maxPrice }
   */
  async getProducts(params = {}) {
    const query = {};
    if (params.page) query.page = params.page;
    if (params.pageSize) query.page_size = params.pageSize;
    if (params.category) query.category__slug = params.category;
    if (params['category__slug']) query.category__slug = params['category__slug'];
    if (params['category__slug__in']) query['category__slug__in'] = params['category__slug__in'];
    if (params.size) query.size = params.size;
    if (params.page_size) query.page_size = params.page_size;
    if (params.isNew !== undefined) query.is_new = params.isNew;
    if (params.isFeatured !== undefined) query.is_featured = params.isFeatured;
    if (params.search) query.search = params.search;
    if (params.ordering) query.ordering = params.ordering;
    if (params.minPrice !== undefined) query.base_price__gte = params.minPrice;
    if (params.maxPrice !== undefined) query.base_price__lte = params.maxPrice;
    if (params.max_price !== undefined) query.base_price__lte = params.max_price;

    const { data } = await api.get('/catalog/products/', { params: query });
    return data; // { count, next, previous, results }
  },

  /**
   * Get a single product by slug.
   */
  async getProduct(slug) {
    const { data } = await api.get(`/catalog/products/${slug}/`);
    return data;
  },

  /**
   * Get new arrivals (is_new=true, ordered by newest first).
   */
  async getNewArrivals(page = 1) {
    return catalogService.getProducts({ isNew: true, page, ordering: '-created_at' });
  },

  /**
   * Get featured products for homepage.
   */
  async getFeatured() {
    return catalogService.getProducts({ isFeatured: true });
  },
};
