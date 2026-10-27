// src/components/landing/LandingNavbar.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, LayoutDashboard, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function LogoMark() {
  return (
    <div className="logo-mark" aria-hidden="true">
      <svg width="18" height="13" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.5 1L1 5.5L4.5 10" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M11.5 1L15 5.5L11.5 10" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9.5 0.5L6.5 10.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

export default function LandingNavbar() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="landing-nav" role="banner">
      <div className="landing-nav-inner">
        {/* Logo and Brand */}
        <Link to="/" className="landing-logo-link" aria-label="DevType Home">
          <LogoMark />
          <span className="logo-wordmark">DevType</span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="landing-desktop-links" aria-label="Main Navigation">
          <Link to="/about" className="landing-nav-link-btn">
            About
          </Link>
          <Link to="/feature-matrix" className="landing-nav-link-btn">
            Feature Matrix
          </Link>
          <Link to="/how-it-works" className="landing-nav-link-btn">
            How It Works
          </Link>
          <Link to="/practice" className="landing-nav-link-btn">
            Practice
          </Link>
        </nav>

        {/* Desktop Action Buttons */}
        <div className="landing-nav-actions">
          {isAuthenticated ? (
            <div className="landing-auth-user-group">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/profile')}
                title="View Profile"
              >
                <User size={15} strokeWidth={2} />
                <span>{user?.displayName || user?.username || 'Developer'}</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                id="btn-nav-dashboard"
                onClick={() => navigate(user?.role === 'ADMIN' ? '/admin' : '/dashboard')}
              >
                <LayoutDashboard size={14} strokeWidth={2} />
                <span>{user?.role === 'ADMIN' ? 'Admin Console' : 'Go to Dashboard'}</span>
              </button>
            </div>
          ) : (
            <div className="landing-guest-actions">
              <Link to="/login" className="btn btn-ghost btn-sm" id="btn-nav-login">
                Log In
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm" id="btn-nav-signup">
                <span>Sign Up</span>
                <ArrowRight size={13} strokeWidth={2.2} />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          className="landing-mobile-toggle"
          aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="landing-mobile-drawer">
          <Link
            to="/about"
            className="landing-mobile-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            About Us
          </Link>
          <Link
            to="/feature-matrix"
            className="landing-mobile-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Feature Matrix
          </Link>
          <Link
            to="/how-it-works"
            className="landing-mobile-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            How It Works
          </Link>
          <Link
            to="/practice"
            className="landing-mobile-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Practice
          </Link>
          <div className="landing-mobile-divider" />
          {isAuthenticated ? (
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(user?.role === 'ADMIN' ? '/admin' : '/dashboard');
                }}
              >
                <LayoutDashboard size={15} />
                <span>{user?.role === 'ADMIN' ? 'Admin Console' : 'Go to Dashboard'}</span>
              </button>
          ) : (
            <div className="landing-mobile-auth-stack">
              <Link
                to="/login"
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started Free
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
