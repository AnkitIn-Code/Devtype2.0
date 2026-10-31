import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import ToastBanner from './components/notifications/ToastBanner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicOnlyRoute from './components/auth/PublicOnlyRoute';
import AdminRoute from './components/auth/AdminRoute';
import AppShell from './components/AppShell';
import AuthPage from './pages/AuthPage';
import { useAuth } from './context/AuthContext';

// ── Code-Split Lazy Loaded Page Components ──
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Practice = lazy(() => import('./pages/Practice'));
const Templates = lazy(() => import('./pages/Templates'));
const Theory = lazy(() => import('./pages/Theory'));
const Reports = lazy(() => import('./pages/Reports'));
const CustomStudio = lazy(() => import('./pages/CustomStudio'));
const Multiplayer = lazy(() => import('./pages/Multiplayer'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Achievements = lazy(() => import('./pages/Achievements'));
const Revision = lazy(() => import('./pages/Revision'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Admin = lazy(() => import('./pages/Admin'));

// ── Documentation and Marketing Pages ──
const LegalPrivacy = lazy(() => import('./pages/LegalPrivacy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const EngineArchitecture = lazy(() => import('./pages/EngineArchitecture'));
const FeatureMatrixPage = lazy(() => import('./pages/FeatureMatrixPage'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));
const RoadmapPage = lazy(() => import('./pages/RoadmapPage'));

function RouteSuspenseFallback() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        width: '100%',
        gap: '16px',
      }}
    >
      <div className="auth-spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      <div
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '0.8rem',
          color: 'var(--t3, #94a3b8)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        Synchronizing View Telemetry...
      </div>
    </div>
  );
}

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

            <Suspense fallback={<RouteSuspenseFallback />}>
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
                    <Route path="theory/:slug?" element={<Theory />} />
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
            </Suspense>
          </AuthProvider>
        </NotificationProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
