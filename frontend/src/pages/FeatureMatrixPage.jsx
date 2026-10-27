// src/pages/FeatureMatrixPage.jsx
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Layers, Check, Sparkles, ArrowRight, ShieldCheck,
  Zap, Code2, Trophy, Terminal, HelpCircle
} from 'lucide-react';
import PublicHeader from '../components/common/PublicHeader';
import LandingFooter from '../components/landing/LandingFooter';
import { useAuth } from '../context/AuthContext';

export default function FeatureMatrixPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="landing-page-root docs-page-root">
      <PublicHeader activeTab="features" />

      <main className="docs-main-container">
        {/* Page Hero Header */}
        <section className="docs-hero-section">
          <div className="docs-hero-badge">
            <Layers size={14} className="text-teal" />
            <span>Platform Capabilities &amp; Roadmap</span>
          </div>
          <h1 className="docs-hero-title">Platform Feature Matrix</h1>
          <p className="docs-hero-sub">
            Complete breakdown of features across Guest Mode, Free Developer Accounts, and the Pro Roadmap.
          </p>
          <div className="docs-meta-row">
            <span className="badge badge-teal">Transparent Tiers</span>
            <span className="docs-meta-item">No Credit Card Required for Free Tier</span>
          </div>
        </section>

        {/* Feature Matrix Table Section */}
        <section className="docs-section" style={{ marginTop: 24 }}>
          <div className="matrix-table-wrap docs-matrix-large">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Core Capabilities</th>
                  <th style={{ width: '20%' }}>Guest Mode</th>
                  <th style={{ width: '20%' }}>Developer (Free)</th>
                  <th style={{ width: '20%' }}>Pro &amp; Roadmap</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="matrix-feat-name">
                    <strong>Real Code Syntax Drills</strong>
                    <p className="matrix-feat-desc">Type real algorithmic patterns, braces, semicolons, and arrows.</p>
                  </td>
                  <td><span className="badge badge-gray">5 Demo Snippets</span></td>
                  <td><span className="badge badge-teal"><Check size={12} /> Full 120+ Library</span></td>
                  <td><span className="badge badge-indigo"><Check size={12} /> Custom Team Drills</span></td>
                </tr>

                <tr>
                  <td className="matrix-feat-name">
                    <strong>Multi-Language Support</strong>
                    <p className="matrix-feat-desc">C++, JavaScript, Python, Go, and Rust with lexical AST highlighting.</p>
                  </td>
                  <td><span className="badge badge-gray">JavaScript Only</span></td>
                  <td><span className="badge badge-teal"><Check size={12} /> All 5 Languages</span></td>
                  <td><span className="badge badge-indigo"><Check size={12} /> Custom Grammars</span></td>
                </tr>

                <tr>
                  <td className="matrix-feat-name">
                    <strong>Sub-ms Keystroke Telemetry</strong>
                    <p className="matrix-feat-desc">Microsecond delta capture, key hesitation, and error concentration.</p>
                  </td>
                  <td><span className="badge badge-gray">Session Summary Only</span></td>
                  <td><span className="badge badge-teal"><Check size={12} /> Persistent Heatmaps</span></td>
                  <td><span className="badge badge-indigo"><Check size={12} /> Predictive Weakness AI</span></td>
                </tr>

                <tr>
                  <td className="matrix-feat-name">
                    <strong>Daily Streaks &amp; Activity Grid</strong>
                    <p className="matrix-feat-desc">GitHub-style annual contribution heatmap to build consistency.</p>
                  </td>
                  <td><span className="badge badge-gray">—</span></td>
                  <td><span className="badge badge-teal"><Check size={12} /> Unlimited History</span></td>
                  <td><span className="badge badge-indigo"><Check size={12} /> Team Leaderboards</span></td>
                </tr>

                <tr>
                  <td className="matrix-feat-name">
                    <strong>Custom Code Template Generator</strong>
                    <p className="matrix-feat-desc">Create custom syntax drills to practice your own company codebase.</p>
                  </td>
                  <td><span className="badge badge-gray">—</span></td>
                  <td><span className="badge badge-teal"><Check size={12} /> Up to 50 Templates</span></td>
                  <td><span className="badge badge-indigo"><Check size={12} /> Unlimited Synced</span></td>
                </tr>

                <tr>
                  <td className="matrix-feat-name">
                    <strong>AI Code Drill Generator</strong>
                    <p className="matrix-feat-desc">Synthesize focused drills on syntax bottlenecks using generative AI.</p>
                  </td>
                  <td><span className="badge badge-gray">Preview Only</span></td>
                  <td><span className="badge badge-teal"><Check size={12} /> 20 Generations / Hr</span></td>
                  <td><span className="badge badge-indigo"><Check size={12} /> Custom LLM Keys</span></td>
                </tr>

                <tr>
                  <td className="matrix-feat-name">
                    <strong>Global Developer Leaderboards</strong>
                    <p className="matrix-feat-desc">Benchmark against software engineers with verified anti-cheat telemetry.</p>
                  </td>
                  <td><span className="badge badge-gray">View Only</span></td>
                  <td><span className="badge badge-teal"><Check size={12} /> Official ELO Ranking</span></td>
                  <td><span className="badge badge-indigo"><Check size={12} /> Verified Divisions</span></td>
                </tr>

                <tr>
                  <td className="matrix-feat-name">
                    <strong>Synchronous 1v1 Multiplayer Duels</strong>
                    <p className="matrix-feat-desc">Real-time room code duels with synchronized live cursor racing.</p>
                  </td>
                  <td><span className="badge badge-gray">Spectate</span></td>
                  <td><span className="badge badge-indigo"><Sparkles size={12} /> 1v1 Room Codes</span></td>
                  <td><span className="badge badge-indigo"><Check size={12} /> Tournament Brackets</span></td>
                </tr>

                <tr>
                  <td className="matrix-feat-name">
                    <strong>Data Portability &amp; Telemetry Export</strong>
                    <p className="matrix-feat-desc">Export your velocity logs and mistake diagnostics in JSON/CSV.</p>
                  </td>
                  <td><span className="badge badge-gray">—</span></td>
                  <td><span className="badge badge-teal"><Check size={12} /> 1-Click JSON Export</span></td>
                  <td><span className="badge badge-indigo"><Check size={12} /> Webhooks &amp; REST API</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Call to Action Card */}
          <div className="docs-cta-card" style={{ marginTop: 36 }}>
            <h3>Ready to accelerate your code typing speed?</h3>
            <p>
              Join software engineers training real algorithmic syntax, data structures, and production patterns.
            </p>
            <div className="docs-cta-actions">
              {isAuthenticated ? (
                <>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => navigate(user?.role === 'ADMIN' ? '/admin' : '/dashboard')}
                  >
                    <span>{user?.role === 'ADMIN' ? 'Go to Admin Console' : 'Go to Dashboard'}</span>
                    <ArrowRight size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => navigate('/practice')}
                  >
                    <span>Launch Practice Drill</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => navigate('/signup')}
                  >
                    <span>Create Free Developer Account</span>
                    <ArrowRight size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => navigate('/login')}
                  >
                    <span>Sign In</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
