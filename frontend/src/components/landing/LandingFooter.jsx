// src/components/landing/LandingFooter.jsx
import { Link } from 'react-router-dom';
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

export default function LandingFooter() {
  const { isAuthenticated, user } = useAuth();
  const handleScrollToHowItWorks = (e) => {
    e.preventDefault();
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.hash = '#how-it-works';
    }
  };

  return (
    <footer className="landing-footer" role="contentinfo">
      <div className="landing-footer-inner">
        {/* Brand Column */}
        <div className="landing-footer-brand">
          <div className="landing-footer-logo-row">
            <LogoMark />
            <span className="logo-wordmark">DevType</span>
          </div>
          <p className="landing-footer-desc">
            The developer typing practice platform engineered for real code speed,
            accuracy, and syntactic muscle memory.
          </p>
          <div className="landing-footer-badge">
            <span className="chip-dot" />
            <span>Built with React &amp; Spring Boot</span>
          </div>
        </div>

        {/* Links Column: Practice & Explore */}
        <div className="landing-footer-col">
          <div className="landing-footer-heading">Platform</div>
          <ul className="landing-footer-list">
            <li>
              <Link to="/practice" className="landing-footer-link-btn">
                Typing Practice
              </Link>
            </li>
            <li>
              <Link to="/templates" className="landing-footer-link-btn">
                Code Templates
              </Link>
            </li>
            <li>
              <Link to="/custom-studio" className="landing-footer-link-btn">
                Custom Studio
              </Link>
            </li>
            <li>
              <Link to="/revision" className="landing-footer-link-btn">
                SRS Revision
              </Link>
            </li>
            <li>
              <Link to="/leaderboard" className="landing-footer-link-btn">
                Leaderboard
              </Link>
            </li>
          </ul>
        </div>

        {/* Links Column: Analytics & Accounts */}
        <div className="landing-footer-col">
          <div className="landing-footer-heading">Account &amp; Stats</div>
          <ul className="landing-footer-list">
            <li>
              <Link to={user?.role === 'ADMIN' ? '/admin' : '/dashboard'} className="landing-footer-link-btn">
                {user?.role === 'ADMIN' ? 'Admin Console' : 'Dashboard'}
              </Link>
            </li>
            <li>
              <Link to="/reports" className="landing-footer-link-btn">
                Performance Reports
              </Link>
            </li>
            {isAuthenticated ? (
              <>
                <li>
                  <Link to="/profile" className="landing-footer-link-btn">
                    Profile ({user?.displayName || user?.username || 'Active'})
                  </Link>
                </li>
                <li>
                  <Link to="/settings" className="landing-footer-link-btn">
                    Preferences &amp; Settings
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login" className="landing-footer-link-btn">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="landing-footer-link-btn">
                    Create Account
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Links Column: Documentation & Resources */}
        <div className="landing-footer-col">
          <div className="landing-footer-heading">Resources</div>
          <ul className="landing-footer-list">
            <li>
              <Link to="/about" className="landing-footer-link-btn">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/how-it-works" className="landing-footer-link-btn">
                How It Works
              </Link>
            </li>
            <li>
              <Link to="/feature-matrix" className="landing-footer-link-btn">
                Feature Matrix
              </Link>
            </li>
            <li>
              <Link to="/roadmap" className="landing-footer-link-btn">
                Multiplayer Roadmap
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="landing-footer-bottom">
        <div>&copy; {new Date().getFullYear()} DevType. All rights reserved.</div>
        <div className="landing-footer-bottom-links">
          <Link to="/privacy" className="landing-footer-bottom-btn">
            Privacy &amp; Security
          </Link>
          <span className="landing-footer-sep">&middot;</span>
          <Link to="/terms" className="landing-footer-bottom-btn">
            Terms of Service
          </Link>
          <span className="landing-footer-sep">&middot;</span>
          <Link to="/engine" className="landing-footer-bottom-btn">
            v2.0 Liquid Glass Engine
          </Link>
        </div>
      </div>
    </footer>
  );
}
