// src/components/common/PublicHeader.jsx
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, ShieldCheck, Sparkles, LayoutDashboard,
  ChevronDown, ChevronLeft, ChevronRight, Cpu, LayoutGrid,
  Milestone, Zap, FileText, X, Layers
} from 'lucide-react';
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

export const DOC_SECTIONS = [
  {
    id: 'about',
    path: '/about',
    label: 'About Us',
    shortLabel: 'About Us',
    badge: 'Mission',
    desc: 'DevType engineering philosophy, syntactic velocity, and core team.',
    icon: Sparkles,
  },
  {
    id: 'how-it-works',
    path: '/how-it-works',
    label: 'How It Works',
    shortLabel: 'How It Works',
    badge: 'Architecture',
    desc: '4-stage real-time keystroke telemetry loop, accuracy, and latency engine.',
    icon: Cpu,
  },
  {
    id: 'features',
    path: '/feature-matrix',
    label: 'Feature Matrix',
    shortLabel: 'Feature Matrix',
    badge: 'Compare Plans',
    desc: 'Detailed breakdown comparing Community, Pro Developer, and Enterprise tiers.',
    icon: LayoutGrid,
  },
  {
    id: 'roadmap',
    path: '/roadmap',
    label: 'Roadmap',
    shortLabel: 'Roadmap',
    badge: 'Releases',
    desc: 'Quarterly milestones: WASM lexers, custom multi-file repositories, and Vim mode.',
    icon: Milestone,
  },
  {
    id: 'engine',
    path: '/engine',
    label: 'Liquid Engine',
    shortLabel: 'Engine',
    badge: 'WASM 0.8ms',
    desc: 'Zero-latency keystroke measurement, sub-ms timing, and bracket lexing.',
    icon: Zap,
  },
  {
    id: 'privacy',
    path: '/privacy',
    label: 'Privacy & Security',
    shortLabel: 'Privacy',
    badge: 'AES-256',
    desc: 'Enterprise security, telemetry encryption, and strict zero-code retention.',
    icon: ShieldCheck,
  },
  {
    id: 'terms',
    path: '/terms',
    label: 'Terms of Service',
    shortLabel: 'Terms',
    badge: 'Fair Play',
    desc: 'Governing platform rules, anti-cheat telemetry verification, and IP rights.',
    icon: FileText,
  },
];

export default function PublicHeader({ activeTab = '' }) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Sliding drawer toggle state
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Scroll container refs for horizontal sliding
  const navTrackRef = useRef(null);
  const shelfTrackRef = useRef(null);
  const headerRootRef = useRef(null);

  // Identify current active section
  const currentDoc = DOC_SECTIONS.find(
    (s) => s.id === activeTab || location.pathname === s.path
  ) || DOC_SECTIONS[0];

  // Auto-scroll active pill into view inside navbar sliding track
  useEffect(() => {
    if (navTrackRef.current) {
      const activeEl = navTrackRef.current.querySelector('.public-nav-pill.active');
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [activeTab, location.pathname]);

  // Click outside to close drawer
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (headerRootRef.current && !headerRootRef.current.contains(e.target)) {
        setDrawerOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
      }
    };

    if (drawerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [drawerOpen]);

  // Slide controls for navbar carousel
  const slideNav = (direction) => {
    if (!navTrackRef.current) return;
    const scrollAmount = direction === 'left' ? -200 : 200;
    navTrackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  // Slide controls for expanded shelf cards carousel
  const slideShelf = (direction) => {
    if (!shelfTrackRef.current) return;
    const scrollAmount = direction === 'left' ? -340 : 340;
    shelfTrackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleCardClick = (path) => {
    setDrawerOpen(false);
    navigate(path);
  };

  return (
    <header className="public-nav-header" role="banner" ref={headerRootRef}>
      <div className="public-nav-inner">
        {/* Left: Brand + Interactive Docs & Legal Trigger */}
        <div className="public-nav-left">
          <Link to="/" className="landing-logo-link" aria-label="DevType Home">
            <LogoMark />
            <span className="logo-wordmark">DevType</span>
          </Link>

          {/* Interactive Sliding Menu Trigger Pill */}
          <button
            type="button"
            className={`public-nav-trigger-btn ${drawerOpen ? 'open' : ''}`}
            onClick={() => setDrawerOpen((prev) => !prev)}
            aria-expanded={drawerOpen}
            aria-label="Toggle Documentation and Legal slider overview"
            title="Click to open or slide across all documentation and legal modules"
          >
            <span className="chip-dot" />
            <span className="trigger-label">Docs &amp; Legal</span>
            <span className="trigger-current-tag">{currentDoc.shortLabel}</span>
            <ChevronDown size={14} className={`trigger-chevron ${drawerOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Center: Sliding Pill Navigation Bar */}
        <div className="public-nav-slider-wrapper">
          <button
            type="button"
            className="public-nav-slide-arrow arrow-left"
            onClick={() => slideNav('left')}
            aria-label="Slide navigation left"
            title="Slide left"
          >
            <ChevronLeft size={14} />
          </button>

          <nav
            className="public-nav-slider-track"
            ref={navTrackRef}
            aria-label="Documentation Navigation Slider"
          >
            {DOC_SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isActive = sec.id === activeTab || location.pathname === sec.path;
              return (
                <Link
                  key={sec.id}
                  to={sec.path}
                  className={`public-nav-pill ${isActive ? 'active' : ''}`}
                >
                  <Icon size={13} className="pill-icon" />
                  <span>{sec.shortLabel}</span>
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            className="public-nav-slide-arrow arrow-right"
            onClick={() => slideNav('right')}
            aria-label="Slide navigation right"
            title="Slide right"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="public-nav-actions">
          <Link to="/" className="btn btn-ghost btn-sm">
            <ArrowLeft size={14} />
            <span>Home</span>
          </Link>

          {isAuthenticated ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => navigate(user?.role === 'ADMIN' ? '/admin' : '/dashboard')}
            >
              <LayoutDashboard size={14} />
              <span>{user?.role === 'ADMIN' ? 'Admin Console' : 'Dashboard'}</span>
            </button>
          ) : (
            <div className="public-nav-guest-stack">
              <Link to="/login" className="btn btn-ghost btn-sm">
                Log In
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                <span>Sign Up</span>
                <ArrowRight size={13} strokeWidth={2.2} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Sliding Shelf Drawer ("when one click that one is opened and we can slide as well to check anything") */}
      {drawerOpen && (
        <div className="public-nav-shelf-drawer" role="region" aria-label="Documentation Modules Slider">
          <div className="public-nav-shelf-inner">
            {/* Shelf Header */}
            <div className="shelf-header">
              <div className="shelf-header-info">
                <div className="shelf-badge">
                  <Layers size={13} />
                  <span>Explore DevType</span>
                </div>
                <h3 className="shelf-title">Guides and policies</h3>
                <p className="shelf-subtitle">
                  Find product guides, upcoming features, and account policies.
                </p>
              </div>

              {/* Shelf Slide Controls & Close */}
              <div className="shelf-header-actions">
                <div className="shelf-arrow-controls">
                  <button
                    type="button"
                    className="shelf-nav-btn"
                    onClick={() => slideShelf('left')}
                    aria-label="Slide cards left"
                    title="Slide cards left"
                  >
                    <ChevronLeft size={16} />
                    <span>Slide Left</span>
                  </button>
                  <button
                    type="button"
                    className="shelf-nav-btn"
                    onClick={() => slideShelf('right')}
                    aria-label="Slide cards right"
                    title="Slide cards right"
                  >
                    <span>Slide Right</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
                <button
                  type="button"
                  className="shelf-close-btn"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close documentation slider"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Horizontal Sliding Cards Track */}
            <div className="shelf-slider-container">
              <div className="shelf-slider-track" ref={shelfTrackRef}>
                {DOC_SECTIONS.map((sec) => {
                  const Icon = sec.icon;
                  const isActive = sec.id === activeTab || location.pathname === sec.path;
                  return (
                    <div
                      key={sec.id}
                      className={`shelf-card ${isActive ? 'card-active' : ''}`}
                      onClick={() => handleCardClick(sec.path)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleCardClick(sec.path);
                        }
                      }}
                    >
                      <div className="shelf-card-top">
                        <div className={`shelf-card-icon-wrap ${isActive ? 'icon-active' : ''}`}>
                          <Icon size={18} />
                        </div>
                        <span className="shelf-card-badge">{sec.badge}</span>
                      </div>

                      <h4 className="shelf-card-title">{sec.label}</h4>
                      <p className="shelf-card-desc">{sec.desc}</p>

                      <div className="shelf-card-action">
                        {isActive ? (
                          <span className="shelf-active-status">Currently Active ✓</span>
                        ) : (
                          <span className="shelf-open-link">
                            <span>Open Section</span>
                            <ArrowRight size={12} />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
