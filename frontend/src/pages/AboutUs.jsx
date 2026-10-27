// src/pages/AboutUs.jsx
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, Sparkles, Target, Zap, ShieldCheck, Code2,
  Cpu, Heart, ArrowRight, Award, Terminal, CheckCircle2
} from 'lucide-react';
import PublicHeader from '../components/common/PublicHeader';
import LandingFooter from '../components/landing/LandingFooter';

export default function AboutUs() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="landing-page-root docs-page-root">
      <PublicHeader activeTab="about" />

      <main className="docs-main-container">
        {/* Page Hero Header */}
        <section className="docs-hero-section">
          <div className="docs-hero-badge">
            <Users size={14} className="text-cobalt" />
            <span>Built by Developers, for Developers</span>
          </div>
          <h1 className="docs-hero-title">About DevType</h1>
          <p className="docs-hero-sub">
            We are engineering the modern standard for software developer typing speed,
            accuracy, and syntactic muscle memory.
          </p>
          <div className="docs-meta-row">
            <span className="badge badge-teal">DevType Platform v2.0</span>
            <span className="docs-meta-item">Founded: 2026</span>
            <span className="docs-meta-item">Mission: Zero Syntactic Hesitation</span>
          </div>
        </section>

        {/* Vision Callout Banner */}
        <div className="docs-callout-banner">
          <div className="docs-callout-icon">
            <Target size={24} className="text-emerald" />
          </div>
          <div className="docs-callout-content">
            <h3>Why Conventional Typing Tests Fail Engineers</h3>
            <p>
              Traditional typing platforms test you on novels, dictionary nouns, and prose.
              When writing software, your bottleneck isn&apos;t typing the word &ldquo;apple&rdquo;—it&apos;s
              typing curly braces <code>&#123; &#125;</code>, pointer arrows <code>-&gt;</code>, async closures,
              bracket pairs <code>[ ]</code>, and nested conditionals without looking down or breaking flow.
              DevType was created to eliminate that friction.
            </p>
          </div>
        </div>

        {/* Two-Column Story Layout */}
        <div className="docs-layout-grid">
          <aside className="docs-sidebar-toc">
            <div className="toc-title">About DevType</div>
            <nav className="toc-nav">
              <a href="#mission" className="toc-link">1. Our Mission</a>
              <a href="#story" className="toc-link">2. The Origin Story</a>
              <a href="#principles" className="toc-link">3. Guiding Principles</a>
              <a href="#architecture-pillars" className="toc-link">4. Engineering Pillars</a>
              <a href="#community" className="toc-link">5. Open Community</a>
              <a href="#get-started" className="toc-link">6. Join the Movement</a>
            </nav>
          </aside>

          <article className="docs-article-body">
            {/* Section 1 */}
            <section id="mission" className="docs-section">
              <h2>1. Our Mission</h2>
              <p>
                Our mission is to help 1,000,000 software engineers worldwide reach 100+ Net WPM on
                real programming syntax. When you remove physical typing hesitation, your brain is
                freed to focus 100% on software architecture, algorithmic logic, and problem-solving.
              </p>
              <p>
                Typing code should feel as natural, fluid, and effortless as thinking.
              </p>
            </section>

            {/* Section 2 */}
            <section id="story" className="docs-section">
              <h2>2. The Origin Story</h2>
              <p>
                DevType began when a team of systems and full-stack engineers noticed a glaring gap:
                junior and senior developers alike would test at 110 WPM on standard typing tests,
                yet their velocity plummeted to 45 WPM when typing real C++, Rust, or JavaScript code.
              </p>
              <p>
                Special characters, indentation levels, and language-specific idioms require entirely
                distinct finger travel patterns. We built DevType 1.0 as an internal benchmark tool,
                and after seeing our own daily code velocity double, we engineered DevType 2.0 with
                sub-millisecond telemetry, a native macOS Sequoia liquid glass interface, and
                high-concurrency Spring Boot backend services.
              </p>
            </section>

            {/* Section 3 */}
            <section id="principles" className="docs-section">
              <h2>3. Our Guiding Principles</h2>
              <div className="docs-security-cards">
                <div className="card docs-sec-card">
                  <div className="sec-card-header">
                    <Code2 size={16} className="text-cobalt" />
                    <h4>Real Syntax Only</h4>
                  </div>
                  <p>
                    Every drill is extracted from real-world algorithmic patterns, systems code,
                    and production libraries across C++, Python, JavaScript, Go, and Rust.
                  </p>
                </div>

                <div className="card docs-sec-card">
                  <div className="sec-card-header">
                    <Zap size={16} className="text-rose" />
                    <h4>Sub-ms Telemetry</h4>
                  </div>
                  <p>
                    High-resolution timestamping via <code>performance.now()</code> catches individual
                    key hesitation spikes and character mistake concentrations.
                  </p>
                </div>

                <div className="card docs-sec-card">
                  <div className="sec-card-header">
                    <ShieldCheck size={16} className="text-emerald" />
                    <h4>Zero Code Scraping</h4>
                  </div>
                  <p>
                    We never harvest, store, or sell proprietary code, and we never train external
                    AI models on your typing telemetry.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="architecture-pillars" className="docs-section">
              <h2>4. Engineering Pillars</h2>
              <p>
                DevType is engineered to the highest standards of modern software design:
              </p>
              <ul className="docs-bullet-list">
                <li>
                  <strong>Frontend:</strong> React 19 Concurrent Mode, Prism.js lexical AST tokenizers,
                  and GPU-accelerated CSS liquid glass shaders.
                </li>
                <li>
                  <strong>Backend:</strong> Java 21 &amp; Spring Boot 3.4 REST services, stateless JWT
                  authorization filters, and sub-15ms roundtrip synchronization.
                </li>
                <li>
                  <strong>Anti-Cheat Telemetry:</strong> Microsecond variance auditing to guarantee
                  100% human-verified global leaderboards.
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="community" className="docs-section">
              <h2>5. Open Developer Community</h2>
              <p>
                DevType is supported by an international community of software engineers, competitive
                programmers, and open-source contributors. We believe in transparency, continuous
                improvement, and community-driven template libraries.
              </p>
            </section>

            {/* Section 6 */}
            <section id="get-started" className="docs-section">
              <h2>6. Join the Movement</h2>
              <div className="docs-cta-card">
                <h3>Ready to turn typing into your superpower?</h3>
                <p>
                  Start practicing with authentic algorithms or explore our platform feature matrix.
                </p>
                <div className="docs-cta-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => navigate('/practice')}
                  >
                    <span>Start Practicing Now</span>
                    <ArrowRight size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => navigate('/feature-matrix')}
                  >
                    <span>View Feature Matrix</span>
                  </button>
                </div>
              </div>
            </section>
          </article>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
