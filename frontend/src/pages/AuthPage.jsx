import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  User, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle,
  ArrowLeft, Check, CheckCircle2, ShieldCheck, Sparkles,
  Zap, Code2, Terminal, Flame, Trophy, KeyRound, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

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

/* ================================================================
   COMPANION CODE SHOWCASE WIDGET
   ================================================================ */
const CODE_SNIPPETS = [
  {
    lang: 'typescript',
    title: 'telemetryEngine.ts',
    code: `// Sub-millisecond keystroke telemetry
export function measureCadence(events: KeyStroke[]): Metric {
  const delta = performance.now() - events[0].time;
  const grossWpm = (events.length / 5) / (delta / 60000);
  return { wpm: Math.round(grossWpm), latencyMs: 0.8 };
}`,
  },
  {
    lang: 'rust',
    title: 'syntax_buffer.rs',
    code: `// Zero-allocation bracket balance lexer
pub fn verify_token_stream(buf: &[u8]) -> Result<Telemetry, Error> {
    let mut depth: i32 = 0;
    for &ch in buf {
        if ch == b'{' { depth += 1; }
        else if ch == b'}' { depth -= 1; }
    }
    Ok(Telemetry::clean(depth == 0))
}`,
  },
  {
    lang: 'python',
    title: 'streak_optimizer.py',
    code: `# Daily streak & muscle memory validator
def calculate_velocity(sessions: list[Session]) -> dict:
    net_wpm = [s.gross_wpm * (s.acc / 100.0) for s in sessions]
    return {
        "peak_velocity": max(net_wpm),
        "consistency_score": round(sum(net_wpm) / len(net_wpm), 2)
    }`,
  },
];

function AuthCompanionShowcase() {
  const [snippetIndex, setSnippetIndex] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const activeSnippet = CODE_SNIPPETS[snippetIndex];

  // Auto-typing animation simulation
  useEffect(() => {
    let timer;
    if (typedChars < activeSnippet.code.length) {
      const delay = Math.random() * 35 + 20; // 20-55ms typing interval
      timer = setTimeout(() => {
        setTypedChars((prev) => prev + 1);
      }, delay);
    } else {
      // Pause on finished snippet, then move to next
      timer = setTimeout(() => {
        setTypedChars(0);
        setSnippetIndex((prev) => (prev + 1) % CODE_SNIPPETS.length);
      }, 4000);
    }
    return () => clearTimeout(timer);
  }, [typedChars, activeSnippet]);

  const displayedText = activeSnippet.code.slice(0, typedChars);

  return (
    <div className="auth-showcase-container">
      {/* Platform Value Header */}
      <div className="showcase-header">
        <div className="hero-badge" style={{ marginBottom: 12 }}>
          <Sparkles size={13} className="hero-badge-icon" />
          <span>Real Developer Muscle Memory</span>
        </div>
        <h2 className="showcase-title">
          Type Real Syntax at <br />
          <span className="landing-gradient-text">Production Velocity</span>
        </h2>
        <p className="showcase-desc">
          Stop typing prose dictionaries. DevType trains the brackets, arrows,
          indentation, and operators that define modern software engineering.
        </p>
      </div>

      {/* Live Animated IDE Terminal Card */}
      <div className="card showcase-terminal-card">
        <div className="showcase-terminal-header">
          <div className="sidebar-traffic-lights" aria-hidden="true">
            <span className="tl tl-close" />
            <span className="tl tl-minimize" />
            <span className="tl tl-maximize" />
          </div>
          <div className="showcase-tab-title">
            <Code2 size={13} />
            <span>{activeSnippet.title}</span>
          </div>
          <span className="badge badge-teal" style={{ fontSize: '0.72rem' }}>
            {activeSnippet.lang}
          </span>
        </div>

        <div className="showcase-terminal-body">
          <pre className="showcase-code-pre">
            <code>
              {displayedText}
              <span className="showcase-cursor" />
            </code>
          </pre>
        </div>

        {/* Live Telemetry HUD Bar */}
        <div className="showcase-hud-bar">
          <div className="hud-metric">
            <span className="hud-label">LIVE SPEED</span>
            <span className="hud-val text-cobalt">114 WPM</span>
          </div>
          <div className="hud-divider" />
          <div className="hud-metric">
            <span className="hud-label">ACCURACY</span>
            <span className="hud-val text-emerald">99.4%</span>
          </div>
          <div className="hud-divider" />
          <div className="hud-metric">
            <span className="hud-label">KEY LATENCY</span>
            <span className="hud-val text-indigo">0.8ms</span>
          </div>
          <div className="hud-divider" />
          <div className="hud-metric">
            <span className="hud-label">STREAK</span>
            <span className="hud-val text-amber">🔥 21d</span>
          </div>
        </div>
      </div>

      {/* Trust & Guarantee Badges */}
      <div className="showcase-trust-grid">
        <div className="showcase-trust-item">
          <ShieldCheck size={16} className="text-emerald" />
          <span>AES-256 encrypted telemetry</span>
        </div>
        <div className="showcase-trust-item">
          <Zap size={16} className="text-cobalt" />
          <span>Sub-millisecond keystroke loop</span>
        </div>
        <div className="showcase-trust-item">
          <Trophy size={16} className="text-amber" />
          <span>Global verified ELO leaderboards</span>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   MAIN AUTHPAGE COMPONENT
   ================================================================ */
export default function AuthPage({ initialMode = 'login' }) {
  const { login, register } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode state: 'login' | 'signup'
  const [mode, setMode] = useState(() => {
    if (location.pathname === '/signup') return 'signup';
    if (location.pathname === '/login') return 'login';
    return initialMode;
  });

  // Synchronize when route URL changes
  useEffect(() => {
    if (location.pathname === '/signup' && mode !== 'signup') {
      setMode('signup');
      setLoginError('');
      setSignupError('');
    } else if (location.pathname === '/login' && mode !== 'login') {
      setMode('login');
      setLoginError('');
      setSignupError('');
    }
  }, [location.pathname, mode]);

  // Destination intended by route guard, or dashboard fallback
  const redirectDestination = location.state?.from?.pathname || '/dashboard';
  const infoNotice = location.state?.notice || '';

  // ── Login Form State ──
  const [loginData, setLoginData] = useState({
    usernameOrEmail: '',
    password: '',
  });
  const [loginShowPassword, setLoginShowPassword] = useState(false);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginFieldErrors, setLoginFieldErrors] = useState({});

  // ── Signup Form State ──
  const [signupData, setSignupData] = useState({
    displayName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [signupShowPassword, setSignupShowPassword] = useState(false);
  const [signupShowConfirmPassword, setSignupShowConfirmPassword] = useState(false);
  const [signupSubmitting, setSignupSubmitting] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupFieldErrors, setSignupFieldErrors] = useState({});

  // Mode Switcher handler with realistic directional animation and React Router sync
  const switchMode = (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    // Clear transient errors
    setLoginError('');
    setSignupError('');
    navigate(`/${newMode}`, { replace: true, state: location.state });
  };

  // ── Password Strength Calculation (Signup) ──
  const passwordStrength = useMemo(() => {
    const pwd = signupData.password;
    if (!pwd) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: '#E11D48' };
      case 2:
        return { score: 2, label: 'Fair', color: '#D97706' };
      case 3:
        return { score: 3, label: 'Strong', color: '#0D9488' };
      case 4:
        return { score: 4, label: 'Developer Grade', color: '#059669' };
      default:
        return { score: 1, label: 'Weak', color: '#E11D48' };
    }
  }, [signupData.password]);

  const hasMinLength = signupData.password.length >= 8;
  const hasLetterAndDigit = /(?=.*[A-Za-z])(?=.*\d)/.test(signupData.password);
  const passwordsMatch =
    Boolean(signupData.password) && signupData.password === signupData.confirmPassword;

  // ── Login Handlers ──
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
    if (loginError) setLoginError('');
    if (loginFieldErrors[name]) {
      setLoginFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleDemoFill = () => {
    setLoginData({
      usernameOrEmail: 'demo_dev',
      password: 'Password123!',
    });
    setLoginError('');
    setLoginFieldErrors({});
  };

  const validateLoginForm = () => {
    const errors = {};
    if (!loginData.usernameOrEmail.trim()) {
      errors.usernameOrEmail = 'Username or email is required';
    }
    if (!loginData.password) {
      errors.password = 'Password is required';
    }
    setLoginFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!validateLoginForm()) return;

    setLoginSubmitting(true);
    try {
      const authData = await login({
        usernameOrEmail: loginData.usernameOrEmail,
        password: loginData.password,
      });
      const targetDestination = authData?.user?.role === 'ADMIN'
        ? '/admin'
        : (location.state?.from?.pathname || redirectDestination);
      navigate(targetDestination, { replace: true });
    } catch (err) {
      if (err.status === 401) {
        setLoginError('Invalid username/email or password. Please try again.');
      } else if (err.status === 403) {
        setLoginError(err.message || 'Account is suspended or deactivated.');
      } else if (err.status === 0) {
        setLoginError('Unable to connect to DevType backend. Please ensure the server is running on port 8080.');
      } else {
        setLoginError(err.message || 'An unexpected error occurred during sign in.');
      }
    } finally {
      setLoginSubmitting(false);
    }
  };

  // ── Signup Handlers ──
  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupData((prev) => ({ ...prev, [name]: value }));
    if (signupError) setSignupError('');
    if (signupFieldErrors[name]) {
      setSignupFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateSignupForm = () => {
    const errors = {};
    if (!signupData.displayName.trim()) {
      errors.displayName = 'Display name is required';
    } else if (signupData.displayName.trim().length > 100) {
      errors.displayName = 'Display name cannot exceed 100 characters';
    }

    const usernameTrimmed = signupData.username.trim();
    if (!usernameTrimmed) {
      errors.username = 'Username is required';
    } else if (usernameTrimmed.length < 3 || usernameTrimmed.length > 30) {
      errors.username = 'Username must be between 3 and 30 characters';
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(usernameTrimmed)) {
      errors.username = 'Only letters, numbers, underscores, dots, and hyphens allowed';
    }

    const emailTrimmed = signupData.email.trim();
    if (!emailTrimmed) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!signupData.password) {
      errors.password = 'Password is required';
    } else if (!hasMinLength) {
      errors.password = 'Password must be at least 8 characters long';
    } else if (!hasLetterAndDigit) {
      errors.password = 'Password must contain both letters and digits';
    }

    if (!signupData.confirmPassword) {
      errors.confirmPassword = 'Confirmation password is required';
    } else if (signupData.password !== signupData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setSignupFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupError('');
    if (!validateSignupForm()) return;

    setSignupSubmitting(true);
    try {
      const authData = await register({
        displayName: signupData.displayName,
        username: signupData.username,
        email: signupData.email,
        password: signupData.password,
      });

      if (authData?.accessToken) {
        navigate('/dashboard', { replace: true });
      } else {
        switchMode('login');
        setLoginError('');
      }
    } catch (err) {
      if (err.validationErrors && err.validationErrors.length > 0) {
        const backendErrors = {};
        err.validationErrors.forEach((v) => {
          backendErrors[v.field] = v.message;
        });
        setSignupFieldErrors(backendErrors);
        setSignupError('Please review the highlighted field requirements.');
      } else if (err.status === 409) {
        setSignupError(err.message || 'Username or email already exists. Please choose another.');
      } else if (err.status === 0) {
        setSignupError('Unable to connect to DevType backend. Please ensure the server is running on port 8080.');
      } else {
        setSignupError(err.message || 'Registration failed. Please check your information and try again.');
      }
    } finally {
      setSignupSubmitting(false);
    }
  };

  return (
    <div className="auth-page-root">
      {/* Decorative Ambient Radial Gradient Blooms */}
      <div className="auth-ambient-bloom bloom-cobalt" aria-hidden="true" />
      <div className="auth-ambient-bloom bloom-violet" aria-hidden="true" />
      <div className="auth-ambient-bloom bloom-emerald" aria-hidden="true" />

      {/* Top Navigation Bar in standard layout flow (no absolute collision) */}
      <header className="auth-top-nav">
        <Link to="/" className="auth-back-link" aria-label="Return to DevType Home">
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
        <div className="auth-nav-center">
          <LogoMark />
          <span className="logo-wordmark">DevType</span>
        </div>
        <div className="auth-nav-right">
          <button
            type="button"
            className="auth-theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <div className="auth-security-chip">
            <ShieldCheck size={14} className="text-emerald" />
            <span>256-Bit SSL Encrypted</span>
          </div>
        </div>
      </header>

      {/* Main Split Layout: Companion Showcase + Liquid Glass Auth Card */}
      <div className="auth-layout-wrapper">
        {/* Left Companion Showcase (Visible on Desktop) */}
        <div className="auth-showcase-panel">
          <AuthCompanionShowcase />
        </div>

        {/* Right macOS Liquid Glass Auth Card */}
        <div className="auth-card-container">
          <div className="card auth-card">
            {/* macOS Title Bar with Interactive Traffic Lights */}
            <div className="auth-card-header">
              <div className="sidebar-traffic-lights" aria-hidden="true">
                <span
                  className="tl tl-close"
                  onClick={() => navigate('/')}
                  title="Return to DevType Home"
                />
                <span className="tl tl-minimize" />
                <span className="tl tl-maximize" />
              </div>
              <div className="auth-card-mode-pill">
                <span className="chip-dot" />
                <span key={mode} className="auth-mode-text-fade">
                  {mode === 'login' ? 'Authentication Gate' : 'Developer Registration'}
                </span>
              </div>
            </div>

            <div className="auth-card-body">
              {/* Segmented Control Mode Switcher with Fluid Sliding Pill */}
              <div className="auth-segmented-switcher" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'login'}
                  className={`auth-segment-btn ${mode === 'login' ? 'active' : ''}`}
                  onClick={() => switchMode('login')}
                  id="tab-sign-in"
                >
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'signup'}
                  className={`auth-segment-btn ${mode === 'signup' ? 'active' : ''}`}
                  onClick={() => switchMode('signup')}
                  id="tab-create-account"
                >
                  <span>Create Account</span>
                </button>
                {/* Fluid Pill Slider */}
                <div
                  className={`auth-segment-slider ${mode === 'signup' ? 'pos-signup' : 'pos-login'}`}
                  aria-hidden="true"
                />
              </div>

              {/* Responsive Fluid Form Container */}
              <div className="auth-form-container">
                {mode === 'login' ? (
                  <div key="login-pane" className="auth-form-pane auth-fade-in">
                    <div className="auth-headings">
                      <h1 className="auth-title">Welcome Back</h1>
                      <p className="auth-subtitle">
                        Sign in to continue your code drills, sync streaks, and climb rankings.
                      </p>
                    </div>

                    {infoNotice && !loginError && (
                      <div className="auth-alert auth-alert-info" role="status">
                        <span>{infoNotice}</span>
                      </div>
                    )}

                    {loginError && (
                      <div className="auth-alert auth-alert-error" role="alert">
                        <AlertCircle size={16} className="auth-alert-icon" />
                        <div className="auth-alert-text">{loginError}</div>
                      </div>
                    )}

                    <form onSubmit={handleLoginSubmit} className="auth-form" noValidate>
                      {/* Username or Email */}
                      <div className="auth-field-group">
                        <label htmlFor="login-identifier" className="auth-label">
                          Username or Email
                        </label>
                        <div className={`auth-input-wrap ${loginFieldErrors.usernameOrEmail ? 'has-error' : ''}`}>
                          <User size={16} className="auth-input-lead-icon" aria-hidden="true" />
                          <input
                            id="login-identifier"
                            name="usernameOrEmail"
                            type="text"
                            className="auth-input"
                            placeholder="Enter username or email"
                            value={loginData.usernameOrEmail}
                            onChange={handleLoginChange}
                            autoComplete="username"
                            disabled={loginSubmitting}
                          />
                        </div>
                        {loginFieldErrors.usernameOrEmail && (
                          <span className="auth-field-error" role="alert">
                            {loginFieldErrors.usernameOrEmail}
                          </span>
                        )}
                      </div>

                      {/* Password */}
                      <div className="auth-field-group">
                        <div className="auth-label-row">
                          <label htmlFor="login-password" className="auth-label">
                            Password
                          </label>
                          <button
                            type="button"
                            className="auth-quick-fill-btn"
                            onClick={handleDemoFill}
                            title="Fill demo evaluation credentials"
                          >
                            <KeyRound size={12} />
                            <span>Quick Demo Fill</span>
                          </button>
                        </div>
                        <div className={`auth-input-wrap ${loginFieldErrors.password ? 'has-error' : ''}`}>
                          <Lock size={16} className="auth-input-lead-icon" aria-hidden="true" />
                          <input
                            id="login-password"
                            name="password"
                            type={loginShowPassword ? 'text' : 'password'}
                            className="auth-input"
                            placeholder="Enter your password"
                            value={loginData.password}
                            onChange={handleLoginChange}
                            autoComplete="current-password"
                            disabled={loginSubmitting}
                          />
                          <button
                            type="button"
                            className="auth-pwd-toggle-btn"
                            onClick={() => setLoginShowPassword(!loginShowPassword)}
                            aria-label={loginShowPassword ? 'Hide password' : 'Show password'}
                          >
                            {loginShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {loginFieldErrors.password && (
                          <span className="auth-field-error" role="alert">
                            {loginFieldErrors.password}
                          </span>
                        )}
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        className="btn btn-primary auth-submit-btn"
                        id="btn-login-submit"
                        disabled={loginSubmitting}
                      >
                        {loginSubmitting ? (
                          <>
                            <span className="auth-spinner-sm" aria-hidden="true" />
                            <span>Signing In...</span>
                          </>
                        ) : (
                          <>
                            <span>Sign In to DevType</span>
                            <ArrowRight size={15} strokeWidth={2.2} />
                          </>
                        )}
                      </button>
                    </form>

                    {/* Switcher Footer */}
                    <div className="auth-card-footer">
                      <span className="auth-footer-text">New to DevType?</span>
                      <button
                        type="button"
                        className="auth-footer-switch-btn"
                        onClick={() => switchMode('signup')}
                      >
                        Create free account
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key="signup-pane" className="auth-form-pane auth-fade-in">
                    <div className="auth-headings">
                      <h1 className="auth-title">Create Developer Account</h1>
                      <p className="auth-subtitle">
                        Build syntactic muscle memory across 5 programming languages.
                      </p>
                    </div>

                    {signupError && (
                      <div className="auth-alert auth-alert-error" role="alert">
                        <AlertCircle size={16} className="auth-alert-icon" />
                        <div className="auth-alert-text">{signupError}</div>
                      </div>
                    )}

                    <form onSubmit={handleSignupSubmit} className="auth-form" noValidate>
                      {/* Display Name */}
                      <div className="auth-field-group">
                        <label htmlFor="signup-displayname" className="auth-label">
                          Display Name
                        </label>
                        <div className={`auth-input-wrap ${signupFieldErrors.displayName ? 'has-error' : ''}`}>
                          <ShieldCheck size={16} className="auth-input-lead-icon" aria-hidden="true" />
                          <input
                            id="signup-displayname"
                            name="displayName"
                            type="text"
                            className="auth-input"
                            placeholder="e.g. Alex Spoor"
                            value={signupData.displayName}
                            onChange={handleSignupChange}
                            autoComplete="name"
                            disabled={signupSubmitting}
                          />
                        </div>
                        {signupFieldErrors.displayName && (
                          <span className="auth-field-error" role="alert">
                            {signupFieldErrors.displayName}
                          </span>
                        )}
                      </div>

                      {/* Username & Email in Compact Row */}
                      <div className="auth-field-row-split">
                        <div className="auth-field-group">
                          <label htmlFor="signup-username" className="auth-label">
                            Username
                          </label>
                          <div className={`auth-input-wrap ${signupFieldErrors.username ? 'has-error' : ''}`}>
                            <User size={16} className="auth-input-lead-icon" aria-hidden="true" />
                            <input
                              id="signup-username"
                              name="username"
                              type="text"
                              className="auth-input"
                              placeholder="alex_spoor"
                              value={signupData.username}
                              onChange={handleSignupChange}
                              autoComplete="username"
                              disabled={signupSubmitting}
                            />
                          </div>
                          {signupFieldErrors.username && (
                            <span className="auth-field-error" role="alert">
                              {signupFieldErrors.username}
                            </span>
                          )}
                        </div>

                        <div className="auth-field-group">
                          <label htmlFor="signup-email" className="auth-label">
                            Email Address
                          </label>
                          <div className={`auth-input-wrap ${signupFieldErrors.email ? 'has-error' : ''}`}>
                            <Mail size={16} className="auth-input-lead-icon" aria-hidden="true" />
                            <input
                              id="signup-email"
                              name="email"
                              type="email"
                              className="auth-input"
                              placeholder="alex@example.com"
                              value={signupData.email}
                              onChange={handleSignupChange}
                              autoComplete="email"
                              disabled={signupSubmitting}
                            />
                          </div>
                          {signupFieldErrors.email && (
                            <span className="auth-field-error" role="alert">
                              {signupFieldErrors.email}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Password */}
                      <div className="auth-field-group">
                        <div className="auth-label-row">
                          <label htmlFor="signup-password" className="auth-label">
                            Password
                          </label>
                          {signupData.password && (
                            <span className="auth-pwd-strength-label" style={{ color: passwordStrength.color }}>
                              {passwordStrength.label}
                            </span>
                          )}
                        </div>
                        <div className={`auth-input-wrap ${signupFieldErrors.password ? 'has-error' : ''}`}>
                          <Lock size={16} className="auth-input-lead-icon" aria-hidden="true" />
                          <input
                            id="signup-password"
                            name="password"
                            type={signupShowPassword ? 'text' : 'password'}
                            className="auth-input"
                            placeholder="At least 8 chars, letters & digits"
                            value={signupData.password}
                            onChange={handleSignupChange}
                            autoComplete="new-password"
                            disabled={signupSubmitting}
                          />
                          <button
                            type="button"
                            className="auth-pwd-toggle-btn"
                            onClick={() => setSignupShowPassword(!signupShowPassword)}
                            aria-label={signupShowPassword ? 'Hide password' : 'Show password'}
                          >
                            {signupShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>

                        {/* Interactive Password Strength Progress Bar */}
                        {signupData.password && (
                          <div className="auth-pwd-meter-track" aria-hidden="true">
                            <div
                              className={`meter-bar ${passwordStrength.score >= 1 ? 'filled' : ''}`}
                              style={{ backgroundColor: passwordStrength.score >= 1 ? passwordStrength.color : undefined }}
                            />
                            <div
                              className={`meter-bar ${passwordStrength.score >= 2 ? 'filled' : ''}`}
                              style={{ backgroundColor: passwordStrength.score >= 2 ? passwordStrength.color : undefined }}
                            />
                            <div
                              className={`meter-bar ${passwordStrength.score >= 3 ? 'filled' : ''}`}
                              style={{ backgroundColor: passwordStrength.score >= 3 ? passwordStrength.color : undefined }}
                            />
                            <div
                              className={`meter-bar ${passwordStrength.score >= 4 ? 'filled' : ''}`}
                              style={{ backgroundColor: passwordStrength.score >= 4 ? passwordStrength.color : undefined }}
                            />
                          </div>
                        )}

                        {signupFieldErrors.password && (
                          <span className="auth-field-error" role="alert">
                            {signupFieldErrors.password}
                          </span>
                        )}

                        {signupData.password && (
                          <div className="password-checklist">
                            <div className={`checklist-item ${hasMinLength ? 'met' : ''}`}>
                              {hasMinLength ? <Check size={12} /> : <span className="chk-bullet" />}
                              <span>8+ characters</span>
                            </div>
                            <div className={`checklist-item ${hasLetterAndDigit ? 'met' : ''}`}>
                              {hasLetterAndDigit ? <Check size={12} /> : <span className="chk-bullet" />}
                              <span>Letters &amp; digits</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div className="auth-field-group">
                        <label htmlFor="signup-confirmpassword" className="auth-label">
                          Confirm Password
                        </label>
                        <div className={`auth-input-wrap ${signupFieldErrors.confirmPassword ? 'has-error' : ''}`}>
                          <Lock size={16} className="auth-input-lead-icon" aria-hidden="true" />
                          <input
                            id="signup-confirmpassword"
                            name="confirmPassword"
                            type={signupShowConfirmPassword ? 'text' : 'password'}
                            className="auth-input"
                            placeholder="Re-enter your password"
                            value={signupData.confirmPassword}
                            onChange={handleSignupChange}
                            autoComplete="new-password"
                            disabled={signupSubmitting}
                          />
                          <button
                            type="button"
                            className="auth-pwd-toggle-btn"
                            onClick={() => setSignupShowConfirmPassword(!signupShowConfirmPassword)}
                            aria-label={signupShowConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                          >
                            {signupShowConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {signupFieldErrors.confirmPassword && (
                          <span className="auth-field-error" role="alert">
                            {signupFieldErrors.confirmPassword}
                          </span>
                        )}
                        {signupData.confirmPassword && (
                          <div className="password-checklist">
                            <div className={`checklist-item ${passwordsMatch ? 'met' : ''}`}>
                              {passwordsMatch ? <CheckCircle2 size={12} /> : <span className="chk-bullet" />}
                              <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match yet'}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        className="btn btn-primary auth-submit-btn"
                        id="btn-signup-submit"
                        disabled={signupSubmitting}
                      >
                        {signupSubmitting ? (
                          <>
                            <span className="auth-spinner-sm" aria-hidden="true" />
                            <span>Creating Developer Account...</span>
                          </>
                        ) : (
                          <>
                            <span>Create Free Account</span>
                            <ArrowRight size={15} strokeWidth={2.2} />
                          </>
                        )}
                      </button>
                    </form>

                    {/* Switcher Footer */}
                    <div className="auth-card-footer">
                      <span className="auth-footer-text">Already registered?</span>
                      <button
                        type="button"
                        className="auth-footer-switch-btn"
                        onClick={() => switchMode('login')}
                      >
                        Sign in instead
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* React Router outlet for nested route compatibility */}
      <Outlet />
    </div>
  );
}
