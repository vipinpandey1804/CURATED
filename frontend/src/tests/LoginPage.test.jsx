import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';

const mockLogin = vi.fn();
const mockGoogleLogin = vi.fn();
const mockNavigate = vi.fn();

const authState = {
  user: null,
  isAuthenticated: false,
  loading: false,
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    googleLogin: mockGoogleLogin,
    ...authState,
  }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderLogin = () => render(
  <MemoryRouter>
    <LoginPage />
  </MemoryRouter>,
);

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.user = null;
    authState.isAuthenticated = false;
    authState.loading = false;
  });

  it('renders email mode by default', () => {
    renderLogin();

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation error when submitting with empty fields', async () => {
    renderLogin();

    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText('Please fill in all fields.')).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login with email payload and redirects normal users to storefront', async () => {
    mockLogin.mockResolvedValue({ user: { id: 1, isStaff: false } });
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'user@example.com',
        phoneNumber: undefined,
        password: 'password123',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('redirects admin users to admin panel after login', async () => {
    mockLogin.mockResolvedValue({ user: { id: 9, isStaff: true } });
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email address/i), 'admin@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin-panel', { replace: true });
    });
  });

  it('submits phone login payload in mobile mode', async () => {
    mockLogin.mockResolvedValue({ user: { id: 2, isStaff: false } });
    renderLogin();

    await userEvent.click(screen.getByRole('button', { name: /mobile number/i }));
    await userEvent.type(screen.getByLabelText(/mobile number/i), '+15551234567');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: undefined,
        phoneNumber: '+15551234567',
        password: 'password123',
      });
    });
  });

  it('shows the server detail message on login failure', async () => {
    mockLogin.mockRejectedValue({
      response: { data: { detail: 'Invalid credentials.' } },
    });
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email address/i), 'wrong@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials.')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('redirects already authenticated staff users away from login page', async () => {
    authState.user = { id: 11, isStaff: true };
    authState.isAuthenticated = true;
    renderLogin();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin-panel', { replace: true });
    });
  });
});
