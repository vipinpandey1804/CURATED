import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate user on mount if tokens exist
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      authService.me()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async ({ email, phoneNumber, password }) => {
    const data = await authService.login({ email, phoneNumber, password });
    setUser(data.user);
    return data;
  };

  const signup = async ({ email, phoneNumber, password, firstName, lastName }) => {
    // Returns { detail, identifier, identifierType } — no user/tokens yet
    const data = await authService.register({ email, phoneNumber, password, firstName, lastName });
    return data;
  };

  // Called after OTP verification to set the authenticated user
  const completeVerification = async ({ email, phoneNumber, code }) => {
    const data = await authService.verifyOtp({ email, phoneNumber, code });
    setUser(data.user);
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateProfile = async (payload) => {
    const updated = await authService.updateProfile(payload);
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, signup, completeVerification, updateProfile, isAuthenticated: !!user, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

