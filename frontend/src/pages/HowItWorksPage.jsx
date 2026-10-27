// src/pages/HowItWorksPage.jsx
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Code2, Zap, Target, Flame, Layers, ShieldCheck,
  CheckCircle2, ArrowRight, Play, Terminal, HelpCircle
} from 'lucide-react';
import PublicHeader from '../components/common/PublicHeader';
import LandingFooter from '../components/landing/LandingFooter';

export default function HowItWorksPage() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="landing-page-root docs-page-root">
      <PublicHeader activeTab="how-it-works" />

      <main className="docs-main-container">
        {/* Page Hero Header */}
        <section className="docs-hero-section">
          <div className="docs-hero-badge">
            <Zap size={14} className="text-amber" />
            <span>Developer Training Workflow Guide</span>
          </div>
          <h1 className="docs-hero-title">How DevType Works</h1>
          <p className="docs-hero-sub">
            A step-by-step technical walkthrough of the code practice editor,
            sub-millisecond keystroke telemetry, and muscle memory training cycle.
          </p>
          <div className="docs-meta-row">
            <span className="badge badge-teal">Simple 4-Step Cycle</span>
            <span className="docs-meta-item">No Complex Setup</span>
            <span className="docs-meta-item">Instant Real-Time Feedback</span>
          </div>
        </section>

        {/* Workflow Overview Banner */}
        <div className="docs-callout-banner">
          <div className="docs-callout-icon">
            <Play size={24} className="text-cobalt" />
          </div>
          <div className="docs-callout-content">
            <h3>From Zero Hesitation to 100+ Net WPM</h3>
            <p>
              DevType eliminates the cognitive gap between thinking of code and seeing it appear on
              the screen. Practicing 15 minutes a day builds permanent muscle memory for language
              keywords, brackets, indentation, and special character combinations.
            </p>
          </div>
        </div>

        {/* Content Layout Grid */}
        <div className="docs-layout-grid">
          <aside className="docs-sidebar-toc">
            <div className="toc-title">Workflow Steps</div>
            <nav className="toc-nav">
              <a href="#step-1" className="toc-link">1. Choose Language &amp; Drill</a>
              <a href="#step-2" className="toc-link">2. Low-Latency Code Editor</a>
              <a href="#step-3" className="toc-link">3. Telemetry &amp; Mistake Heatmap</a>
              <a href="#step-4" className="toc-link">4. Streaks &amp; Leaderboards</a>
              <a href="#best-practices" className="toc-link">5. Best Practices &amp; Posture</a>
              <a href="#start" className="toc-link">6. Ready to Practice?</a>
            </nav>
          </aside>

          <article className="docs-article-body">
            {/* Step 1 */}
            <section id="step-1" className="docs-section">
              <h2>Step 1: Choose Your Language &amp; Difficulty</h2>
              <p>
                Select from 5 core developer languages: <strong>C++, Python, JavaScript/TypeScript, Go, or Rust</strong>.
                Each language has unique indentation conventions and symbol distributions.
              </p>
              <div className="docs-security-cards">
                <div className="card docs-sec-card">
                  <div className="sec-card-header">
                    <span className="badge badge-teal">Beginner</span>
                    <h4>Core Data Structures</h4>
                  </div>
                  <p>Arrays, hash maps, binary search, and basic conditional loops.</p>
                </div>

                <div className="card docs-sec-card">
                  <div className="sec-card-header">
                    <span className="badge badge-indigo">Intermediate</span>
                    <h4>Algorithms &amp; Systems</h4>
                  </div>
                  <p>Tree traversals, dynamic programming, async/await pipelines.</p>
                </div>

                <div className="card docs-sec-card">
                  <div className="sec-card-header">
                    <span className="badge badge-purple">Advanced</span>
                    <h4>Concurrency &amp; Traits</h4>
                  </div>
                  <p>Go channels, Rust lifetimes, C++ memory pointers, and threads.</p>
                </div>
              </div>
            </section>

            {/* Step 2 */}
            <section id="step-2" className="docs-section">
              <h2>Step 2: Type in the Low-Latency Editor</h2>
              <p>
                DevType&apos;s code editor is engineered for zero-layout-shift and sub-millisecond
                responsiveness. Key capabilities include:
              </p>
              <ul className="docs-bullet-list">
                <li>
                  <strong>Prism.js Lexical AST Highlighting:</strong> Code renders with authentic IDE
                  color tokenization for functions, variables, strings, and operators.
                </li>
                <li>
                  <strong>Real-Time Character Comparison:</strong> Characters turn green for correct
                  keystrokes and red for errors with immediate audio and visual cues.
                </li>
                <li>
                  <strong>Virtual Keyboard Heatmap:</strong> Displays physical key positions and finger
                  zones to encourage proper touch typing form.
                </li>
                <li>
                  <strong>Tactile Audio Feedback:</strong> Optional mechanical switch click sounds to
                  reinforce rhythmic typing cadence.
                </li>
              </ul>
            </section>

            {/* Step 3 */}
            <section id="step-3" className="docs-section">
              <h2>Step 3: Analyze Telemetry &amp; Mistake Forensics</h2>
              <p>
                When a session finishes, DevType computes in-depth keystroke telemetry:
              </p>
              <div className="docs-table-wrapper">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Telemetry Metric</th>
                      <th>How It&apos;s Calculated</th>
                      <th>Why It Matters</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Gross WPM</strong></td>
                      <td><code>(Total Characters / 5) / Minutes</code></td>
                      <td>Raw finger velocity before error penalties.</td>
                    </tr>
                    <tr>
                      <td><strong>Net WPM</strong></td>
                      <td><code>Gross WPM - (Uncorrected Errors / Minutes)</code></td>
                      <td>Your true usable coding speed in production.</td>
                    </tr>
                    <tr>
                      <td><strong>Key Latency</strong></td>
                      <td>Microseconds between successive keydown events</td>
                      <td>Detects hesitation on brackets and symbols.</td>
                    </tr>
                    <tr>
                      <td><strong>Accuracy</strong></td>
                      <td><code>(Correct Characters / Total Strokes) * 100</code></td>
                      <td>Ensures speed is backed by flawless precision.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Step 4 */}
            <section id="step-4" className="docs-section">
              <h2>Step 4: Build Daily Streaks &amp; Climb Leaderboards</h2>
              <p>
                Consistent daily practice is the secret to permanent muscle memory. DevType synchronizes
                your session history to your profile:
              </p>
              <ul className="docs-bullet-list">
                <li>
                  <strong>GitHub-Style Annual Heatmap:</strong> Visual grid showing daily contributions
                  and practice intensity throughout the year.
                </li>
                <li>
                  <strong>XP Progression &amp; Milestone Crowns:</strong> Unlock prestigious badges
                  as you hit 60 WPM, 90 WPM, 120 WPM, and 150+ WPM Elite status.
                </li>
                <li>
                  <strong>Anti-Cheat Verified Leaderboard:</strong> Compete with developers globally
                  under strict automated telemetry validation.
                </li>
              </ul>
            </section>

            {/* Best Practices */}
            <section id="best-practices" className="docs-section">
              <h2>5. Best Practices for Developers</h2>
              <div className="docs-security-cards">
                <div className="card docs-sec-card">
                  <div className="sec-card-header">
                    <CheckCircle2 size={16} className="text-emerald" />
                    <h4>15 Minutes Daily</h4>
                  </div>
                  <p>Daily short sprints build stronger neuromuscular connections than sporadic 2-hour binges.</p>
                </div>

                <div className="card docs-sec-card">
                  <div className="sec-card-header">
                    <CheckCircle2 size={16} className="text-cobalt" />
                    <h4>Accuracy Over Speed</h4>
                  </div>
                  <p>Target 98%+ accuracy first. Velocity naturally follows once syntactic hesitation disappears.</p>
                </div>

                <div className="card docs-sec-card">
                  <div className="sec-card-header">
                    <CheckCircle2 size={16} className="text-purple" />
                    <h4>Practice Your Weak Stack</h4>
                  </div>
                  <p>If you write Python by day, practice Rust or Go to train diverse symbol layouts.</p>
                </div>
              </div>
            </section>

            {/* CTA */}
            <section id="start" className="docs-section">
              <h2>6. Ready to Accelerate Your Typing?</h2>
              <div className="docs-cta-card">
                <h3>Launch your first practice drill now</h3>
                <p>No credit card required. Jump straight into the code typing editor.</p>
                <div className="docs-cta-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => navigate('/practice')}
                  >
                    <span>Launch Practice Workspace</span>
                    <ArrowRight size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => navigate('/templates')}
                  >
                    <span>Browse Templates Library</span>
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
