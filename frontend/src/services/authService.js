import api from './api';

export const authService = {
  /**
   * Login with (email or phoneNumber) + password.
   * Pass { email, password } OR { phoneNumber, password }.
   */
  async login({ email, phoneNumber, password }) {
    const payload = email ? { email, password } : { phoneNumber, password };
    const { data } = await api.post('/auth/login/', payload);
    localStorage.setItem('access_token', data.tokens.access);
    localStorage.setItem('refresh_token', data.tokens.refresh);
    return data;
  },

  /**
   * Register a new account with email OR phone number.
   * Pass { email, password, firstName, lastName } OR { phoneNumber, password, firstName, lastName }.
   * Returns { detail, identifier, identifierType } — no tokens yet (must verify via OTP).
   */
  async register({ email, phoneNumber, password, firstName, lastName }) {
    const payload = email
      ? { email, password, firstName, lastName }
      : { phoneNumber, password, firstName, lastName };
    const { data } = await api.post('/auth/register/', payload);
    return data;  // { detail, identifier, identifierType }
  },

  /**
   * Fetch the authenticated user's profile.
   */
  async me() {
    const { data } = await api.get('/auth/me/');
    return data;
  },

  /**
   * Update profile (fullName, phone, profile.dateOfBirth, profile.avatar).
   */
  async updateProfile(payload) {
    const { data } = await api.patch('/auth/me/', payload);
    return data;
  },

  /**
   * Change password.
   */
  async changePassword(oldPassword, newPassword) {
    const { data } = await api.post('/auth/change-password/', {
      oldPassword,
      newPassword,
    });
    return data;
  },

  /**
   * Logout — clear tokens locally (no server-side blocklist call needed
   * since simplejwt blacklisting happens on refresh rotation).
   */
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  /**
   * Request OTP to email or phone number.
   * Pass { email } or { phoneNumber }.
   */
  async requestOtp({ email, phoneNumber } = {}) {
    const payload = email ? { email } : { phoneNumber };
    const { data } = await api.post('/auth/otp/request/', payload);
    return data;
  },

  /**
   * Verify OTP code. Returns { access, refresh, user }.
   * Pass { email } or { phoneNumber } along with code.
   */
  async verifyOtp({ email, phoneNumber, code } = {}) {
    const payload = email ? { email, code } : { phoneNumber, code };
    const { data } = await api.post('/auth/otp/verify/', payload);
    localStorage.setItem('access_token', data.tokens.access);
    localStorage.setItem('refresh_token', data.tokens.refresh);
    return data;
  },

  // ─── Addresses ─────────────────────────────────────────────────────────────

  async getAddresses() {
    const { data } = await api.get('/auth/addresses/');
    return data.results ?? data;
  },

  async createAddress(payload) {
    const { data } = await api.post('/auth/addresses/', payload);
    return data;
  },

  async updateAddress(id, payload) {
    const { data } = await api.patch(`/auth/addresses/${id}/`, payload);
    return data;
  },

  async deleteAddress(id) {
    await api.delete(`/auth/addresses/${id}/`);
  },

  /**
   * Request password reset email.
   */
  async requestPasswordReset(email) {
    const { data } = await api.post('/auth/password/reset/', { email });
    return data;
  },

  async resetPassword(token, password) {
    const { data } = await api.post('/auth/password/reset/confirm/', { token, password });
    return data;
  },
};
