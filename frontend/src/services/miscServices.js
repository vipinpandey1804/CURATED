import api from './api';

export const wishlistService = {
  /**
   * Get all wishlist items.
   */
  async getWishlist() {
    const { data } = await api.get('/wishlists/');
    return data.results ?? data;
  },

  /**
   * Toggle a product on/off the wishlist.
   * Returns { wishlisted: bool }.
   */
  async toggle(productId) {
    const { data } = await api.post('/wishlists/toggle/', { productId });
    return data;
  },

  /**
   * Check whether a product is wishlisted.
   * Returns { wishlisted: bool }.
   */
  async check(productId) {
    const { data } = await api.get('/wishlists/check/', { params: { productId } });
    return data;
  },
};

export const reviewService = {
  /**
   * Get approved reviews for a product.
   */
  async getReviews(productSlug, page = 1) {
    const { data } = await api.get(`/reviews/products/${productSlug}/reviews/`, {
      params: { page },
    });
    return data;
  },

  /**
   * Get rating summary for a product.
   */
  async getRatingSummary(productSlug) {
    const { data } = await api.get(`/reviews/products/${productSlug}/rating/`);
    return data;
  },

  /**
   * Submit a review.
   * @param {object} payload — { productId, rating, title, body }
   */
  async createReview(payload) {
    const { data } = await api.post('/reviews/', payload);
    return data;
  },
};

export const searchService = {
  /**
   * Full-text search.
   */
  async search(query, params = {}) {
    const { data } = await api.get('/search/', { params: { q: query, ...params } });
    return data;
  },
};
