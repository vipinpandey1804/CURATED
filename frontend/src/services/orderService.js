import api from './api';

export const orderService = {
  /**
   * Create an order from the current cart.
   * @param {object} payload — { shippingAddressId, billingAddressId, shippingRuleId, couponCode? }
   */
  async createOrder(payload) {
    const { data } = await api.post('/orders/create/', payload);
    return data;
  },

  /**
   * Get list of the user's orders (paginated).
   */
  async getOrders(page = 1) {
    const { data } = await api.get('/orders/', { params: { page } });
    return data;
  },

  /**
   * Get a single order by order_number (e.g. "CUR-ABCD1234").
   */
  async getOrder(orderNumber) {
    const { data } = await api.get(`/orders/${orderNumber}/`);
    return data;
  },

  /**
   * Create a Stripe Checkout session for an order.
   * Returns { checkoutUrl, sessionId }.
   */
  async createCheckoutSession(orderNumber) {
    const { data } = await api.post('/payments/create-session/', { orderNumber });
    return data;
  },

  /**
   * Submit a return request.
   * @param {object} payload — { orderId, reason, lineItems: [{ orderItemId, quantity, reason }] }
   */
  async createReturn(payload) {
    const { data } = await api.post('/returns/', payload);
    return data;
  },

  /**
   * Get shipments for an order.
   */
  async getShipments(orderNumber) {
    const { data } = await api.get(`/fulfillment/orders/${orderNumber}/shipments/`);
    return data;
  },

  /**
   * Get available shipping rules (optionally filter by country code).
   */
  async getShippingRules(country) {
    const params = country ? { country } : {};
    const { data } = await api.get('/fulfillment/shipping-rules/', { params });
    return data.results ?? data;
  },
};
