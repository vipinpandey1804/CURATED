import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Protects admin routes — requires authenticated user with is_staff=true.
 * Redirects unauthenticated users to /login.
 * Redirects non-staff users to / with a message.
 */
export default function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.isStaff) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-2xl font-semibold text-gray-800">Access Denied</p>
        <p className="text-sm text-gray-500">You need staff privileges to access this area.</p>
        <a href="/" className="text-sm text-blue-600 underline">Go to storefront</a>
      </div>
    );
  }

  return children;
}
