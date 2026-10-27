// src/components/auth/PublicOnlyRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="auth-loading-overlay">
        <div className="auth-spinner" />
      </div>
    );
  }

  if (isAuthenticated) {
    // If the user arrived with an intended destination preserved in state, redirect there (admin always to /admin)
    const destination = user?.role === 'ADMIN' ? '/admin' : (location.state?.from?.pathname || '/dashboard');
    return <Navigate to={destination} replace />;
  }

  return children;
}
