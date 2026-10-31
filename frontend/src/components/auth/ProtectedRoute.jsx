// src/components/auth/ProtectedRoute.jsx
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Educational Theory pages are freely accessible to all developers and learners
  if (location.pathname.startsWith('/theory')) {
    return <Outlet />;
  }

  if (isLoading) {
    return (
      <div className="auth-loading-overlay">
        <div className="auth-spinner" />
        <span className="auth-loading-text">Verifying session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    const routeTitles = {
      '/practice': 'Typing Practice',
      '/templates': 'Code Templates',
      '/custom-studio': 'Custom Studio',
      '/dashboard': 'Developer Dashboard',
      '/reports': 'Performance Reports',
      '/leaderboard': 'Global Leaderboard',
      '/achievements': 'Achievements',
      '/multiplayer': 'Multiplayer Arena',
      '/revision': 'SRS Revision Deck',
      '/settings': 'Settings',
      '/profile': 'Developer Profile',
    };
    const targetName = routeTitles[location.pathname] || 'this workspace';
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
          notice: `Please sign in or create an account to access ${targetName}.`,
        }}
        replace
      />
    );
  }

  return <Outlet />;
}
