import { Link, Navigate, Outlet } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <div className="auth-loading-overlay" role="status"><div className="auth-spinner" /><span className="auth-loading-text">Checking administrator access…</span></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN') return <main className="adm-access-denied"><ShieldAlert size={36} /><h1>Administrator access required</h1><p>Your account does not have access to the administration console. Contact a platform administrator if you need access.</p><Link to="/dashboard">Return to your dashboard</Link></main>;
  return <Outlet />;
}
