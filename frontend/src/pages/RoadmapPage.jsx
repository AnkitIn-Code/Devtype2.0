// src/pages/RoadmapPage.jsx
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trophy, Sparkles, Zap, Flag, Users, Cpu,
  CheckCircle2, ArrowRight, ShieldCheck, Timer
} from 'lucide-react';
import PublicHeader from '../components/common/PublicHeader';
import LandingFooter from '../components/landing/LandingFooter';

export default function RoadmapPage() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="landing-page-root docs-page-root">
      <PublicHeader activeTab="roadmap" />

      <main className="docs-main-container">
        {/* Page Hero Header */}
        <section className="docs-hero-section">
          <div className="docs-hero-badge">
            <Trophy size={14} className="text-amber" />
            <span>Multiplayer Arena &amp; Platform Roadmap</span>
          </div>
          <h1 className="docs-hero-title">Multiplayer &amp; Features Roadmap</h1>
          <p className="docs-hero-sub">
            The future of synchronous competitive coding: 1v1 duels, live ghost racing,
            and collaborative developer hackathons.
          </p>
          <div className="docs-meta-row">
            <span className="badge badge-amber">Multiplayer Arena</span>
            <span className="badge badge-teal">Phase 1 Live Alpha</span>
            <span className="docs-meta-item">Roadmap Cycle: 2026 - 2027</span>
          </div>
        </section>

        {/* Vision Banner */}
        <div className="docs-callout-banner">
          <div className="docs-callout-icon">
            <Sparkles size={24} className="text-purple" />
          </div>
          <div className="docs-callout-content">
            <h3>Synchronous Code Typing Competitions</h3>
            <p>
              Typing is inherently competitive. Whether racing your colleagues in a private sprint
              or testing your syntactic reflex against global masters, the DevType Multiplayer Arena
              brings real-time WebSocket synchronization with sub-10ms packet updates.
            </p>
          </div>
        </div>

        {/* Content Layout Grid */}
        <div className="docs-layout-grid">
          <aside className="docs-sidebar-toc">
            <div className="toc-title">Roadmap Phases</div>
            <nav className="toc-nav">
              <a href="#phase-1" className="toc-link">1. Phase 1: 1v1 Code Duels</a>
              <a href="#phase-2" className="toc-link">2. Phase 2: Live Ghost Racing</a>
              <a href="#phase-3" className="toc-link">3. Phase 3: ELO Matchmaking</a>
              <a href="#phase-4" className="toc-link">4. Phase 4: Team Relays</a>
              <a href="#netcode" className="toc-link">5. Real-Time Netcode</a>
              <a href="#try-multiplayer" className="toc-link">6. Join Multiplayer Beta</a>
            </nav>
          </aside>

          <article className="docs-article-body">
            {/* Phase 1 */}
            <section id="phase-1" className="docs-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span className="badge badge-teal">Live Alpha</span>
                <span className="docs-meta-item">Phase 01</span>
              </div>
              <h2>Phase 1: 1v1 Synchronous Code Duels</h2>
              <p>
                Create a private 6-digit room code, share it with a peer or teammate, and compete
                heads-up on the identical programming snippet in real-time.
              </p>
              <ul className="docs-bullet-list">
                <li>
                  <strong>Synchronized 3-2-1 Countdown:</strong> Zero start-time advantage with
                  millisecond-synchronized start triggers.
                </li>
                <li>
                  <strong>Real-Time Split Indicators:</strong> See your opponent&apos;s live character progress,
                  split-second lead/deficit delta, and accuracy car in real-time.
                </li>
                <li>
                  <strong>Instant Match Forensic Diff:</strong> Post-match telemetry overlay comparing
                  Gross WPM, Net WPM, error spikes, and hesitation heatmaps side-by-side.
                </li>
              </ul>
            </section>

            {/* Phase 2 */}
            <section id="phase-2" className="docs-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span className="badge badge-indigo">In Active Build</span>
                <span className="docs-meta-item">Phase 02</span>
              </div>
              <h2>Phase 2: Live Ghost Racing</h2>
              <p>
                Inspired by high-performance time-trial simulators, Ghost Racing records the full
                temporal trajectory of every keystroke in a practice run.
              </p>
              <ul className="docs-bullet-list">
                <li>
                  <strong>Personal Ghost:</strong> Race against your personal best historical run to
                  physically witness your cadence acceleration over time.
                </li>
                <li>
                  <strong>Leaderboard Master Replays:</strong> Download and race alongside the ghost
                  data of the #1 ranked developer for any snippet in the library.
                </li>
              </ul>
            </section>

            {/* Phase 3 */}
            <section id="phase-3" className="docs-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span className="badge badge-purple">Scheduled Q4 2026</span>
                <span className="docs-meta-item">Phase 03</span>
              </div>
              <h2>Phase 3: ELO Ranked Matchmaking</h2>
              <p>
                Competitive skill-based matchmaking designed to pair engineers with peers of equivalent
                syntactic velocity and language familiarity.
              </p>
              <div className="docs-security-cards">
                <div className="card docs-sec-card">
                  <div className="sec-card-header">
                    <Trophy size={16} className="text-amber" />
                    <h4>Competitive Divisions</h4>
                  </div>
                  <p>Climb from Bronze, Silver, Gold, Platinum, Diamond, to Grandmaster Syntactic.</p>
                </div>

                <div className="card docs-sec-card">
                  <div className="sec-card-header">
                    <ShieldCheck size={16} className="text-emerald" />
                    <h4>Anti-Cheat Match Integrity</h4>
                  </div>
                  <p>Real-time microsecond variance checks prevent bot injection during ranked matches.</p>
                </div>

                <div className="card docs-sec-card">
                  <div className="sec-card-header">
                    <Flag size={16} className="text-cobalt" />
                    <h4>Seasonal Resets &amp; Crowns</h4>
                  </div>
                  <p>Quarterly seasonal leagues with exclusive profile badges and streak crowns.</p>
                </div>
              </div>
            </section>

            {/* Phase 4 */}
            <section id="phase-4" className="docs-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span className="badge badge-gray">Research &amp; RFC</span>
                <span className="docs-meta-item">Phase 04</span>
              </div>
              <h2>Phase 4: Collaborative Team Relays &amp; Hackathons</h2>
              <p>
                Multi-developer team relays where teammates alternate typing successive functions
                and modules in a real multi-file architecture:
              </p>
              <ul className="docs-bullet-list">
                <li>Pass the virtual baton when function tests compile and pass.</li>
                <li>Company and university hackathon leaderboards.</li>
                <li>Live spectator broadcast view with telemetry HUDs.</li>
              </ul>
            </section>

            {/* Netcode Architecture */}
            <section id="netcode" className="docs-section">
              <h2>5. High-Frequency Real-Time Netcode</h2>
              <p>
                Multiplayer racing requires sub-20ms packet round-trip times. The DevType netcode
                combines:
              </p>
              <ul className="docs-bullet-list">
                <li>
                  <strong>Lightweight Delta Compression:</strong> Keystroke progress is packed into
                  compact binary WebSocket frames rather than verbose JSON strings.
                </li>
                <li>
                  <strong>Client-Side Interpolation:</strong> Smooth cursor and car movement between
                  heartbeat ticks for zero visual stutter.
                </li>
                <li>
                  <strong>Server-Authoritative Clock:</strong> High-precision monotonic timestamps
                  prevent clock spoofing across client machines.
                </li>
              </ul>
            </section>

            {/* CTA */}
            <section id="try-multiplayer" className="docs-section">
              <h2>6. Experience the Multiplayer Arena</h2>
              <div className="docs-cta-card">
                <h3>Ready to test your code typing speed heads-up?</h3>
                <p>Join the multiplayer workspace and invite your peers to a 1v1 sprint.</p>
                <div className="docs-cta-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => navigate('/multiplayer')}
                  >
                    <span>Open Multiplayer Arena</span>
                    <ArrowRight size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => navigate('/practice')}
                  >
                    <span>Solo Practice</span>
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
