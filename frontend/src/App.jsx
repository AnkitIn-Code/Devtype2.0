import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import ToastBanner from './components/notifications/ToastBanner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicOnlyRoute from './components/auth/PublicOnlyRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AuthPage from './pages/AuthPage';
import LegalPrivacy from './pages/LegalPrivacy';
import TermsOfService from './pages/TermsOfService';
import EngineArchitecture from './pages/EngineArchitecture';
import FeatureMatrixPage from './pages/FeatureMatrixPage';
import AboutUs from './pages/AboutUs';
import HowItWorksPage from './pages/HowItWorksPage';
import RoadmapPage from './pages/RoadmapPage';
import AppShell from './components/AppShell';
import Dashboard from './pages/Dashboard';
import Practice from './pages/Practice';
import Templates from './pages/Templates';
import Reports from './pages/Reports';
import CustomStudio from './pages/CustomStudio';
import Multiplayer from './pages/Multiplayer';
import Leaderboard from './pages/Leaderboard';
import Achievements from './pages/Achievements';
import Revision from './pages/Revision';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import AdminRoute from './components/auth/AdminRoute';
import { useAuth } from './context/AuthContext';

function RootRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="auth-loading-overlay">
        <div className="auth-spinner" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />;
  }

  return <LandingPage />;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <NotificationProvider>
          <AuthProvider>
            {/* Universal Ambient Glowing Radial Blooms */}
            <div className="global-ambient-bloom bloom-cobalt" aria-hidden="true" />
            <div className="global-ambient-bloom bloom-violet" aria-hidden="true" />
            <div className="global-ambient-bloom bloom-emerald" aria-hidden="true" />
            <div className="global-ambient-bloom bloom-sky" aria-hidden="true" />
            <div className="global-ambient-bloom bloom-amber" aria-hidden="true" />

            {/* Floating Toast Notification Banner */}
            <ToastBanner />

            <Routes>
          {/* Smart Root Route: Dashboard/Admin when logged in, Landing Page when not */}
          <Route path="/" element={<RootRoute />} />

          {/* Public-only Auth Pages */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <AuthPage initialMode="login" />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnlyRoute>
                <AuthPage initialMode="signup" />
              </PublicOnlyRoute>
            }
          />

          {/* Public Legal & Technical Documentation Pages */}
          <Route path="/about" element={<AboutUs />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/privacy" element={<LegalPrivacy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/engine" element={<EngineArchitecture />} />
          <Route path="/feature-matrix" element={<FeatureMatrixPage />} />
          <Route path="/features" element={<FeatureMatrixPage />} />

          {/* Authenticated Application Routes guarded by ProtectedRoute */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="dashboard"     element={<Dashboard />} />
              <Route path="practice"      element={<Practice />} />
              <Route path="templates"     element={<Templates />} />
              <Route path="custom-studio" element={<CustomStudio />} />
              <Route path="ai-generator"  element={<Navigate to="/custom-studio" replace />} />
              <Route path="revision"      element={<Revision />} />
              <Route path="challenges"    element={<Navigate to="/revision" replace />} />
              <Route path="reports"       element={<Reports />} />
              <Route path="multiplayer"   element={<Multiplayer />} />
              <Route path="leaderboard"   element={<Leaderboard />} />
              <Route path="achievements"  element={<Achievements />} />
              <Route path="profile"       element={<Profile />} />
              <Route path="settings"      element={<Settings />} />
            </Route>

            <Route element={<AdminRoute />}>
              <Route path="admin/*" element={<Admin />} />
            </Route>
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
          </AuthProvider>
        </NotificationProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
