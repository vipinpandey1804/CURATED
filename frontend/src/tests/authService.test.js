import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the api axios instance before importing authService
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

  // ─── login ──────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('posts credentials to /auth/login/ and stores tokens', async () => {
      const mockData = {
        access: 'access-token',
        refresh: 'refresh-token',
        user: { id: 1, email: 'user@example.com' },
      };
      api.post.mockResolvedValue({ data: mockData });

      const result = await authService.login('user@example.com', 'password123');

      expect(api.post).toHaveBeenCalledWith('/auth/login/', {
        email: 'user@example.com',
        password: 'password123',
      });
      expect(localStorage.getItem('access_token')).toBe('access-token');
      expect(localStorage.getItem('refresh_token')).toBe('refresh-token');
      expect(result).toEqual(mockData);
    });

    it('propagates API errors to the caller', async () => {
      const error = { response: { data: { detail: 'No active account found.' } } };
      api.post.mockRejectedValue(error);

      await expect(authService.login('bad@example.com', 'wrong')).rejects.toEqual(error);
      expect(localStorage.getItem('access_token')).toBeNull();
    });
  });

  // ─── register ───────────────────────────────────────────────────────────────

  describe('register', () => {
    it('posts registration data to /auth/register/ and stores tokens', async () => {
      const mockData = {
        access: 'access-token',
        refresh: 'refresh-token',
        user: { id: 2, email: 'new@example.com' },
      };
      api.post.mockResolvedValue({ data: mockData });

      const result = await authService.register('new@example.com', 'password123', 'Jane Doe');

      expect(api.post).toHaveBeenCalledWith('/auth/register/', {
        email: 'new@example.com',
        password: 'password123',
        fullName: 'Jane Doe',
      });
      expect(localStorage.getItem('access_token')).toBe('access-token');
      expect(localStorage.getItem('refresh_token')).toBe('refresh-token');
      expect(result).toEqual(mockData);
    });

    it('propagates registration errors to the caller', async () => {
      const error = { response: { data: { email: ['A user with that email already exists.'] } } };
      api.post.mockRejectedValue(error);

      await expect(
        authService.register('dup@example.com', 'password123', 'Dup User'),
      ).rejects.toEqual(error);
    });
  });

  // ─── logout ─────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('removes access_token and refresh_token from localStorage', () => {
      localStorage.setItem('access_token', 'some-access-token');
      localStorage.setItem('refresh_token', 'some-refresh-token');

      authService.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });

  // ─── requestOtp ─────────────────────────────────────────────────────────────

  describe('requestOtp', () => {
    it('posts { email } when email is provided', async () => {
      api.post.mockResolvedValue({ data: { detail: 'OTP sent.' } });

      await authService.requestOtp({ email: 'user@example.com' });

      expect(api.post).toHaveBeenCalledWith('/auth/otp/request/', {
        email: 'user@example.com',
      });
    });

    it('posts { phoneNumber } when email is not provided', async () => {
      api.post.mockResolvedValue({ data: { detail: 'OTP sent.' } });

      await authService.requestOtp({ phoneNumber: '+15551234567' });

      expect(api.post).toHaveBeenCalledWith('/auth/otp/request/', {
        phoneNumber: '+15551234567',
      });
    });

    it('returns the response data', async () => {
      const responseData = { detail: 'OTP sent successfully.' };
      api.post.mockResolvedValue({ data: responseData });

      const result = await authService.requestOtp({ email: 'user@example.com' });

      expect(result).toEqual(responseData);
    });
  });

  // ─── verifyOtp ──────────────────────────────────────────────────────────────

  describe('verifyOtp', () => {
    it('posts { email, code } and stores tokens on success', async () => {
      const mockData = {
        tokens: { access: 'a-token', refresh: 'r-token' },
        user: { id: 3, email: 'user@example.com' },
      };
      api.post.mockResolvedValue({ data: mockData });

      const result = await authService.verifyOtp({ email: 'user@example.com', code: '123456' });

      expect(api.post).toHaveBeenCalledWith('/auth/otp/verify/', {
        email: 'user@example.com',
        code: '123456',
      });
      expect(localStorage.getItem('access_token')).toBe('a-token');
      expect(localStorage.getItem('refresh_token')).toBe('r-token');
      expect(result).toEqual(mockData);
    });

    it('posts { phoneNumber, code } when phone is provided instead', async () => {
      const mockData = {
        tokens: { access: 'p-access', refresh: 'p-refresh' },
        user: { id: 4 },
      };
      api.post.mockResolvedValue({ data: mockData });

      await authService.verifyOtp({ phoneNumber: '+15559876543', code: '654321' });

      expect(api.post).toHaveBeenCalledWith('/auth/otp/verify/', {
        phoneNumber: '+15559876543',
        code: '654321',
      });
      expect(localStorage.getItem('access_token')).toBe('p-access');
    });

    it('propagates OTP verification errors to the caller', async () => {
      const error = { response: { data: { detail: 'Invalid or expired OTP.' } } };
      api.post.mockRejectedValue(error);

      await expect(
        authService.verifyOtp({ email: 'user@example.com', code: '000000' }),
      ).rejects.toEqual(error);
    });
  });

  // ─── me ─────────────────────────────────────────────────────────────────────

  describe('me', () => {
    it('fetches the authenticated user profile', async () => {
      const profileData = { id: 1, email: 'user@example.com', fullName: 'Test User' };
      api.get.mockResolvedValue({ data: profileData });

      const result = await authService.me();

      expect(api.get).toHaveBeenCalledWith('/auth/me/');
      expect(result).toEqual(profileData);
    });
  });
});
