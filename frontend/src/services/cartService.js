import api from './api';

export const cartService = {
  /**
   * Get current cart.
   */
  async getCart() {
    const { data } = await api.get('/cart/');
    return data;
  },

  /**
   * Add a variant to the cart.
   * @param {string} variantId — UUID
   * @param {number} quantity
   */
  async addItem(variantId, quantity = 1) {
    const { data } = await api.post('/cart/items/', { variantId, quantity });
    return data;
  },

  /**
   * Update quantity of a cart item.
   * @param {string} itemId — cart item UUID
   * @param {number} quantity
   */
  async updateItem(itemId, quantity) {
    const { data } = await api.patch(`/cart/items/${itemId}/`, { quantity });
    return data;
  },

  /**
   * Remove a cart item.
   */
  async removeItem(itemId) {
    await api.delete(`/cart/items/${itemId}/`);
  },

  /**
   * Clear the entire cart.
   */
  async clearCart() {
    await api.post('/cart/clear/');
  },

  /**
   * Apply a coupon code.
   */
  async applyCoupon(code) {
    const { data } = await api.post('/cart/coupon/', { code });
    return data;
  },

  /**
   * Remove applied coupon.
   */
  async removeCoupon() {
    await api.delete('/cart/coupon/');
  },
};
