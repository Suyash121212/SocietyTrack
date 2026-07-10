import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export const ProtectedRoute = ({ adminOnly = false, children }) => {
  const { token, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;

  if (adminOnly && !isAdmin()) return <Navigate to="/complaints" replace />;

  if (!adminOnly && isAdmin()) return <Navigate to="/admin/dashboard" replace />;

  return <>{children}</>;
};
