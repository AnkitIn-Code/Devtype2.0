// src/pages/LandingPage.jsx
import { Link, useNavigate } from 'react-router-dom';
import {
  Code2, Zap, Target, Flame, BarChart2, CheckCircle2,
  ArrowRight, Play, Terminal, Layers, ShieldCheck, Sparkles
} from 'lucide-react';
import LandingNavbar from '../components/landing/LandingNavbar';
import HeroPreview from '../components/landing/HeroPreview';
import LandingFooter from '../components/landing/LandingFooter';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handlePrimaryCta = () => {
    if (isAuthenticated) {
      navigate(user?.role === 'ADMIN' ? '/admin' : '/dashboard');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="landing-page-root">
      <LandingNavbar />

      <main className="landing-main-content">
        {/* ================================================================
            HERO SECTION
            ================================================================ */}
        <section className="landing-hero-section" aria-label="Hero">
          <div className="landing-hero-inner">
            {/* Pill Tag */}
            <div className="hero-badge">
              <Sparkles size={14} className="hero-badge-icon" />
              <span>Real Code Typing Practice Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="landing-hero-title">
              Master Code Typing Speed. <br />
              <span className="landing-gradient-text">Build Pure Muscle Memory.</span>
            </h1>

            {/* Description */}
            <p className="landing-hero-desc">
              Stop typing random prose. DevType trains software engineers to type actual
              programming syntax, algorithmic structures, and production patterns with
              high speed, pinpoint accuracy, and zero keystroke hesitation.
            </p>

            {/* CTA Group */}
            <div className="landing-hero-cta-group">
              <button
                type="button"
                className="btn btn-primary landing-btn-hero"
                id="hero-btn-primary"
                onClick={handlePrimaryCta}
              >
                <Play size={14} fill="currentColor" strokeWidth={0} />
                <span>{isAuthenticated ? 'Go to Dashboard' : 'Start Practicing Free'}</span>
                <ArrowRight size={15} strokeWidth={2.2} />
              </button>

              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="btn btn-ghost landing-btn-hero-sec"
                  id="hero-btn-login"
                >
                  <span>Log In to Account</span>
                </Link>
              )}
            </div>

            {/* Social / Feature Trust Badges */}
            <div className="landing-trust-row">
              <div className="trust-pill">
                <CheckCircle2 size={13} color="#059669" />
                <span>C++, Python, JS, Go &amp; Rust</span>
              </div>
              <div className="trust-pill">
                <CheckCircle2 size={13} color="#059669" />
                <span>Sub-millisecond Keystroke Telemetry</span>
              </div>
              <div className="trust-pill">
                <CheckCircle2 size={13} color="#059669" />
                <span>No Mock Data — Real Server Auth</span>
              </div>
            </div>

            {/* Visual Interface Preview */}
            <div className="landing-preview-container" id="hero-preview">
              <HeroPreview />
            </div>
          </div>
        </section>

        {/* ================================================================
            FEATURES SECTION
            ================================================================ */}
        <section className="landing-section" id="features" aria-label="Features">
          <div className="section-header">
            <div className="section-sup">Engineered for Developers</div>
            <h2 className="section-title">Everything you need to type code like second nature</h2>
            <p className="section-sub">
              Conventional typing tools train you on fiction and dictionary words.
              DevType trains the braces, semicolons, arrows, and indentation that make up real code.
            </p>
          </div>

          <div className="landing-features-grid">
            {/* Feature 1 */}
            <div className="card feature-card">
              <div className="feature-icon-box cobalt">
                <Code2 size={20} />
              </div>
              <h3 className="feature-title">Real Code Snippets</h3>
              <p className="feature-desc">
                Practise with authentic algorithms, data structure implementations, and
                production patterns in C++, Python, JavaScript, Go, and Rust.
              </p>
              <div className="feature-footer-badge">
                <span className="badge badge-teal">Live Feature</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="card feature-card">
              <div className="feature-icon-box rose">
                <Zap size={20} />
              </div>
              <h3 className="feature-title">WPM &amp; Accuracy Telemetry</h3>
              <p className="feature-desc">
                Track true gross WPM, net WPM, and character-level accuracy. Catch error
                concentrations across brackets, operators, and variable identifiers.
              </p>
              <div className="feature-footer-badge">
                <span className="badge badge-teal">Live Feature</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="card feature-card">
              <div className="feature-icon-box indigo">
                <BarChart2 size={20} />
              </div>
              <h3 className="feature-title">Review Previous Sessions</h3>
              <p className="feature-desc">
                Analyze your typing evolution over time with detailed session logs,
                speed percentiles, and mistake heatmaps to systematically eliminate bottlenecks.
              </p>
              <div className="feature-footer-badge">
                <span className="badge badge-teal">Live Feature</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="card feature-card">
              <div className="feature-icon-box amber">
                <Flame size={20} />
              </div>
              <h3 className="feature-title">Activity Tracking &amp; Streaks</h3>
              <p className="feature-desc">
                Build sustained consistency with daily practice streaks and GitHub-style
                annual contribution heatmaps that reward every minute of practice.
              </p>
              <div className="feature-footer-badge">
                <span className="badge badge-teal">Live Feature</span>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="card feature-card">
              <div className="feature-icon-box emerald">
                <Layers size={20} />
              </div>
              <h3 className="feature-title">Language &amp; Difficulty Levels</h3>
              <p className="feature-desc">
                Progress smoothly from Beginner utility functions to Intermediate systems
                logic and Advanced concurrency templates tailored to your stack.
              </p>
              <div className="feature-footer-badge">
                <span className="badge badge-teal">Live Feature</span>
              </div>
            </div>

            {/* Feature 6 - Planned */}
            <div className="card feature-card">
              <div className="feature-icon-box purple">
                <Terminal size={20} />
              </div>
              <h3 className="feature-title">Multiplayer Racing &amp; Duels</h3>
              <p className="feature-desc">
                Compete synchronously in heads-up typing sprints, 1v1 ELO-ranked duels,
                and cooperative team relays against developers worldwide.
              </p>
              <div className="feature-footer-badge">
                <span className="badge badge-indigo">Roadmap Feature</span>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            HOW IT WORKS SECTION
            ================================================================ */}
        <section className="landing-section" id="how-it-works" aria-label="How It Works">
          <div className="section-header">
            <div className="section-sup">Simple Three-Step Workflow</div>
            <h2 className="section-title">How DevType Accelerates Your Typing</h2>
            <p className="section-sub">
              No complicated onboarding. Jump straight into practice in three simple steps.
            </p>
          </div>

          <div className="steps-grid">
            {/* Step 1 */}
            <div className="card step-card">
              <div className="step-number">01</div>
              <div className="step-icon-wrap">
                <ShieldCheck size={22} color="var(--brand)" />
              </div>
              <h3 className="step-title">Create your account</h3>
              <p className="step-desc">
                Register in seconds to synchronize your session telemetry, save custom
                templates, and unlock streak tracking.
              </p>
            </div>

            {/* Step 2 */}
            <div className="card step-card">
              <div className="step-number">02</div>
              <div className="step-icon-wrap">
                <Code2 size={22} color="#0D9488" />
              </div>
              <h3 className="step-title">Select snippet &amp; practise</h3>
              <p className="step-desc">
                Choose a language, select a curated algorithm or generate a custom snippet,
                and begin typing directly in the low-latency code editor.
              </p>
            </div>

            {/* Step 3 */}
            <div className="card step-card">
              <div className="step-number">03</div>
              <div className="step-icon-wrap">
                <Target size={22} color="#E11D48" />
              </div>
              <h3 className="step-title">Track performance &amp; improve</h3>
              <p className="step-desc">
                Review your WPM velocity, pinpoint accuracy faults, gain XP, and watch your
                daily streak reflect your growing speed.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================
            FINAL CTA BANNER
            ================================================================ */}
        <section className="landing-cta-section" aria-label="Call to Action">
          <div className="landing-cta-banner">
            <div className="landing-cta-content">
              <div className="landing-cta-badge">
                <Flame size={14} fill="currentColor" strokeWidth={0} />
                <span>Start Typing Real Code</span>
              </div>
              <h2 className="landing-cta-title">
                Ready to turn typing into a developer superpower?
              </h2>
              <p className="landing-cta-desc">
                Create your DevType profile now to start building typing speed, accuracy,
                and confidence across your favorite languages.
              </p>
              <div className="landing-cta-actions">
                <button
                  type="button"
                  className="btn btn-primary landing-btn-cta"
                  id="cta-btn-start"
                  onClick={handlePrimaryCta}
                >
                  <span>{isAuthenticated ? 'Open Dashboard' : 'Get Started Free'}</span>
                  <ArrowRight size={15} strokeWidth={2.2} />
                </button>
                <Link to="/practice" className="btn btn-ghost landing-btn-cta-sec">
                  <span>Explore Practice Workspace</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
