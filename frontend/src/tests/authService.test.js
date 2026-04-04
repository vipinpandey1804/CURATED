import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

import { authService } from '../services/authService';
import api from '../services/api';

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('posts email credentials and stores jwt tokens', async () => {
      const mockData = {
        tokens: { access: 'access-token', refresh: 'refresh-token' },
        user: { id: 1, email: 'user@example.com', isStaff: false },
      };
      api.post.mockResolvedValue({ data: mockData });

      const result = await authService.login({ email: 'user@example.com', password: 'password123' });

      expect(api.post).toHaveBeenCalledWith('/auth/login/', {
        email: 'user@example.com',
        password: 'password123',
      });
      expect(localStorage.getItem('access_token')).toBe('access-token');
      expect(localStorage.getItem('refresh_token')).toBe('refresh-token');
      expect(result).toEqual(mockData);
    });

    it('posts phone credentials when phoneNumber is provided', async () => {
      const mockData = {
        tokens: { access: 'phone-access', refresh: 'phone-refresh' },
        user: { id: 2, phoneNumber: '+15551234567', isStaff: true },
      };
      api.post.mockResolvedValue({ data: mockData });

      await authService.login({ phoneNumber: '+15551234567', password: 'password123' });

      expect(api.post).toHaveBeenCalledWith('/auth/login/', {
        phoneNumber: '+15551234567',
        password: 'password123',
      });
      expect(localStorage.getItem('access_token')).toBe('phone-access');
    });

    it('propagates API errors to the caller', async () => {
      const error = { response: { data: { detail: 'Invalid credentials.' } } };
      api.post.mockRejectedValue(error);

      await expect(
        authService.login({ email: 'bad@example.com', password: 'wrong' }),
      ).rejects.toEqual(error);
      expect(localStorage.getItem('access_token')).toBeNull();
    });
  });

  describe('register', () => {
    it('posts email registration data and returns identifier details', async () => {
      const mockData = {
        detail: 'Verification code sent to your email.',
        identifier: 'new@example.com',
        identifierType: 'email',
      };
      api.post.mockResolvedValue({ data: mockData });

      const result = await authService.register({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Doe',
      });

      expect(api.post).toHaveBeenCalledWith('/auth/register/', {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Doe',
      });
      expect(result).toEqual(mockData);
      expect(localStorage.getItem('access_token')).toBeNull();
    });
  });

  describe('verifyOtp', () => {
    it('stores tokens after successful verification', async () => {
      const mockData = {
        tokens: { access: 'otp-access', refresh: 'otp-refresh' },
        user: { id: 3, email: 'user@example.com' },
      };
      api.post.mockResolvedValue({ data: mockData });

      const result = await authService.verifyOtp({ email: 'user@example.com', code: '123456' });

      expect(api.post).toHaveBeenCalledWith('/auth/otp/verify/', {
        email: 'user@example.com',
        code: '123456',
      });
      expect(localStorage.getItem('access_token')).toBe('otp-access');
      expect(localStorage.getItem('refresh_token')).toBe('otp-refresh');
      expect(result).toEqual(mockData);
    });
  });

  describe('me', () => {
    it('fetches the authenticated user profile', async () => {
      const profileData = { id: 1, email: 'user@example.com', isStaff: false };
      api.get.mockResolvedValue({ data: profileData });

      const result = await authService.me();

      expect(api.get).toHaveBeenCalledWith('/auth/me/');
      expect(result).toEqual(profileData);
    });
  });

  describe('logout', () => {
    it('removes access_token and refresh_token from localStorage', () => {
      localStorage.setItem('access_token', 'some-access-token');
      localStorage.setItem('refresh_token', 'some-refresh-token');

      authService.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });
});
