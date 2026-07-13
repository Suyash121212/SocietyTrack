import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Shield } from 'lucide-react';

export const ProtectedRoute = ({ adminOnly = false, children }) => {
  const { token, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600">
            <Shield size={22} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400 [animation-delay:-0.3s]" />
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400 [animation-delay:-0.15s]" />
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400" />
          </div>
        </div>
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin()) return <Navigate to="/complaints" replace />;
  if (!adminOnly && isAdmin()) return <Navigate to="/admin/dashboard" replace />;

  return <>{children}</>;
};
