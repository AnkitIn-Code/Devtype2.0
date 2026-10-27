// src/pages/EngineArchitecture.jsx
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Cpu, Zap, Sparkles, Layers, Terminal, Server,
  CheckCircle2, ArrowRight, Activity, Gauge, Flame, Code2
} from 'lucide-react';
import PublicHeader from '../components/common/PublicHeader';
import LandingFooter from '../components/landing/LandingFooter';

export default function EngineArchitecture() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="landing-page-root docs-page-root">
      <PublicHeader activeTab="engine" />

      <main className="docs-main-container">
        {/* Page Hero Header */}
        <section className="docs-hero-section">
          <div className="docs-hero-badge">
            <Cpu size={14} className="text-purple" />
            <span>Technical Whitepaper &amp; System Architecture</span>
          </div>
          <h1 className="docs-hero-title">DevType v2.0 Liquid Glass Engine</h1>
          <p className="docs-hero-sub">
            Under the hood of the sub-millisecond keystroke telemetry engine, macOS Sequoia design system, and Spring Boot 3 backend.
          </p>
          <div className="docs-meta-row">
            <span className="badge badge-purple">Engine Release v2.0.4</span>
            <span className="badge badge-teal">React 19 Concurrent</span>
            <span className="badge badge-indigo">Java 21 / Spring Boot 3.4</span>
            <span className="docs-meta-item">Telemetry Precision: &lt; 0.1ms</span>
          </div>
        </section>

        {/* Live Metrics Showcase Banner */}
        <div className="docs-metrics-banner">
          <div className="metric-box">
            <div className="metric-num text-cobalt">&lt; 1.2ms</div>
            <div className="metric-lbl">Key-to-Render Latency</div>
          </div>
          <div className="metric-sep" />
          <div className="metric-box">
            <div className="metric-num text-emerald">120 FPS</div>
            <div className="metric-lbl">Locked UI Refresh Rate</div>
          </div>
          <div className="metric-sep" />
          <div className="metric-box">
            <div className="metric-num text-purple">5 Languages</div>
            <div className="metric-lbl">Native AST Tokenizers</div>
          </div>
          <div className="metric-sep" />
          <div className="metric-box">
            <div className="metric-num text-amber">&lt; 15ms</div>
            <div className="metric-lbl">API Session Sync Roundtrip</div>
          </div>
        </div>

        {/* Content Layout with Sidebar Table of Contents */}
        <div className="docs-layout-grid">
          <aside className="docs-sidebar-toc">
            <div className="toc-title">Architecture Sections</div>
            <nav className="toc-nav">
              <a href="#overview" className="toc-link">1. Architectural Overview</a>
              <a href="#telemetry" className="toc-link">2. Sub-ms Telemetry Loop</a>
              <a href="#liquid-glass" className="toc-link">3. Liquid Glass UI Engine</a>
              <a href="#tokenizer" className="toc-link">4. AST Syntax Tokenization</a>
              <a href="#backend" className="toc-link">5. Spring Boot REST Services</a>
              <a href="#benchmarks" className="toc-link">6. Performance Benchmarks</a>
              <a href="#sandbox" className="toc-link">7. Test Drive the Engine</a>
            </nav>
          </aside>

          <article className="docs-article-body">
            {/* Section 1 */}
            <section id="overview" className="docs-section">
              <h2>1. Architectural Overview</h2>
              <p>
                Conventional typing platforms are built for basic prose and vocabulary dictionary drills.
                They employ standard HTML text inputs that introduce input queue lag, lack syntactic
                tokenization, and suffer from garbage collection stutters when calculating telemetry.
              </p>
              <p>
                DevType v2.0 Liquid Glass Engine was engineered from the ground up as a native-grade
                developer performance runtime. It decouples keystroke event intake from React&apos;s
                render reconciliation loop using dedicated microsecond buffer streams.
              </p>

              {/* Architecture ASCII / Visual Diagram */}
              <div className="docs-arch-diagram">
                <div className="arch-layer client-layer">
                  <div className="arch-layer-title">CLIENT RUNTIME (React 19 + Prism.js)</div>
                  <div className="arch-components-row">
                    <div className="arch-chip">Event Intake Loop (window.performance.now)</div>
                    <div className="arch-arrow">➔</div>
                    <div className="arch-chip">AST Tokenizer &amp; Syntax Renderer</div>
                    <div className="arch-arrow">➔</div>
                    <div className="arch-chip">Hardware Liquid Glass Compositor</div>
                  </div>
                </div>

                <div className="arch-connector-v">
                  <span>TLS 1.3 / JSON REST + JWT Authorization</span>
                </div>

                <div className="arch-layer server-layer">
                  <div className="arch-layer-title">BACKEND SERVICES (Java 21 + Spring Boot 3.4)</div>
                  <div className="arch-components-row">
                    <div className="arch-chip">Stateless JWT Filter Chain</div>
                    <div className="arch-arrow">➔</div>
                    <div className="arch-chip">Anti-Cheat Telemetry Evaluator</div>
                    <div className="arch-arrow">➔</div>
                    <div className="arch-chip">Transactional Persistence (PostgreSQL/H2)</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section id="telemetry" className="docs-section">
              <h2>2. Sub-Millisecond Telemetry Loop</h2>
              <p>
                Every keystroke inside the DevType code editor captures a high-resolution timestamp
                via the browser&apos;s monotonic <code>window.performance.now()</code> API. This guarantees
                sub-millisecond accuracy independent of system clock drift.
              </p>

              <div className="docs-code-block">
                <div className="code-block-header">
                  <span>telemetryFormulas.ts</span>
                  <span className="badge badge-teal">Core Math</span>
                </div>
                <pre><code>{`// Gross WPM (Standard 5-character normalized words)
GrossWPM = (TotalKeystrokes / 5) / (ElapsedMilliseconds / 60000);

// Net WPM (Penalizing uncorrected syntactic errors)
NetWPM = Math.max(0, GrossWPM - (UncorrectedErrors / (ElapsedMilliseconds / 60000)));

// Microsecond Inter-Key Cadence (Hesitation Delta)
deltaLatencyMs = currentKeyTimestamp - previousKeyTimestamp;`}</code></pre>
              </div>

              <p>
                By aggregating <code>deltaLatencyMs</code> across character categories, DevType generates
                detailed diagnostic heatmaps showing whether an engineer hesitates predominantly on curly
                braces <code>&#123; &#125;</code>, pointer arrows <code>-&gt;</code>, or variable camelCase transitions.
              </p>
            </section>

            {/* Section 3 */}
            <section id="liquid-glass" className="docs-section">
              <h2>3. Liquid Glass macOS Sequoia UI Engine</h2>
              <p>
                The DevType aesthetic follows modern Apple Silicon macOS Sequoia Human Interface
                Guidelines. It pairs a crisp, glare-free background with high-contrast cool-grey
                translucent liquid glass containers:
              </p>
              <div className="docs-security-cards">
                <div className="card docs-sec-card">
                  <div className="sec-card-header">
                    <Sparkles size={16} className="text-purple" />
                    <h4>Hardware Blur Shaders</h4>
                  </div>
                  <p>
                    Utilizes <code>backdrop-filter: blur(35px) saturate(170%)</code> executed directly on
                    the user&apos;s GPU compositor to eliminate CPU render cycles.
                  </p>
                </div>

                <div className="card docs-sec-card">
                  <div className="sec-card-header">
                    <Layers size={16} className="text-cobalt" />
                    <h4>Specular Highlight Edges</h4>
                  </div>
                  <p>
                    Dual-boundary borders featuring a 1.5px subtle glass perimeter complemented by an
                    opaque 2px pure white specular top reflection edge.
                  </p>
                </div>

                <div className="card docs-sec-card">
                  <div className="sec-card-header">
                    <Flame size={16} className="text-amber" />
                    <h4>Zero Neon Halos</h4>
                  </div>
                  <p>
                    Restrained, human-crafted slate gradients replacing noisy neon glows for superior
                    focus during sustained multi-hour programming drills.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="tokenizer" className="docs-section">
              <h2>4. Lexical AST Syntax Tokenization</h2>
              <p>
                Real code practice requires authentic syntax highlighting. DevType integrates custom
                tokenizers built on top of Prism.js that pre-process code snippets into token streams:
              </p>
              <div className="docs-table-wrapper">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Language</th>
                      <th>Token Grammar</th>
                      <th>Highlight Precision</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>C++</strong></td>
                      <td>Pointers, templates, namespaces, preprocessor directives</td>
                      <td>Full AST Lexing</td>
                    </tr>
                    <tr>
                      <td><strong>Rust</strong></td>
                      <td>Lifetimes, pattern matching, macros, traits</td>
                      <td>Full AST Lexing</td>
                    </tr>
                    <tr>
                      <td><strong>Python</strong></td>
                      <td>Decorators, list comprehensions, indentation blocks</td>
                      <td>Full AST Lexing</td>
                    </tr>
                    <tr>
                      <td><strong>Go</strong></td>
                      <td>Goroutines, channel operators, struct tags</td>
                      <td>Full AST Lexing</td>
                    </tr>
                    <tr>
                      <td><strong>JavaScript / TS</strong></td>
                      <td>Async/await, arrow closures, generic interfaces</td>
                      <td>Full AST Lexing</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 5 */}
            <section id="backend" className="docs-section">
              <h2>5. High-Throughput Spring Boot 3 Backend</h2>
              <p>
                The DevType backend is built with modern Java 21 and Spring Boot 3.4. Key highlights:
              </p>
              <ul className="docs-bullet-list">
                <li>
                  <strong>Stateless Security:</strong> Filter chain utilizing HMAC-SHA256 Bearer JWT
                  authentication tokens with zero server session overhead.
                </li>
                <li>
                  <strong>Connection Pooling:</strong> HikariCP high-concurrency database connection
                  pooling delivering sub-5ms SQL query execution.
                </li>
                <li>
                  <strong>Anti-Cheat Telemetry Auditing:</strong> Automated validation of telemetry arrays
                  detecting synthetic injection drivers before leaderboard persistence.
                </li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="benchmarks" className="docs-section">
              <h2>6. Performance &amp; Latency Benchmarks</h2>
              <div className="docs-table-wrapper">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Benchmark Vector</th>
                      <th>DevType v2.0 Engine</th>
                      <th>Industry Average</th>
                      <th>Advantage</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Input Event Latency</td>
                      <td><strong>0.82 ms</strong></td>
                      <td>16.4 ms</td>
                      <td><span className="badge badge-teal">20x Faster</span></td>
                    </tr>
                    <tr>
                      <td>DOM Layout Shifts (CLS)</td>
                      <td><strong>0.000</strong></td>
                      <td>0.082</td>
                      <td><span className="badge badge-teal">Zero Shift</span></td>
                    </tr>
                    <tr>
                      <td>UI Frame Stability</td>
                      <td><strong>Locked 60 / 120 FPS</strong></td>
                      <td>42 - 58 FPS</td>
                      <td><span className="badge badge-teal">Fluid macOS</span></td>
                    </tr>
                    <tr>
                      <td>Telemetry Payload Size</td>
                      <td><strong>1.8 KB (Compressed)</strong></td>
                      <td>14.2 KB</td>
                      <td><span className="badge badge-teal">87% Lighter</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 7 */}
            <section id="sandbox" className="docs-section">
              <h2>7. Experience the Engine Live</h2>
              <p>
                Put the DevType v2.0 Liquid Glass Engine to the test with real code snippets in your
                language of choice:
              </p>
              <div className="docs-cta-card">
                <h3>Ready to benchmark your keystroke velocity?</h3>
                <p>Launch the practice editor or browse the curated algorithm templates library.</p>
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
                    <span>Explore Code Templates</span>
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
