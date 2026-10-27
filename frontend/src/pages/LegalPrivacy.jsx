// src/pages/PrivacyPolicy.jsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Lock, EyeOff, Server, HardDrive, FileCheck2,
  AlertCircle, CheckCircle2, ArrowRight, Download, RefreshCw, Mail
} from 'lucide-react';
import PublicHeader from '../components/common/PublicHeader';
import LandingFooter from '../components/landing/LandingFooter';

export default function LegalPrivacy() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="landing-page-root docs-page-root">
      <PublicHeader activeTab="privacy" />

      <main className="docs-main-container">
        {/* Page Hero Header */}
        <section className="docs-hero-section">
          <div className="docs-hero-badge">
            <ShieldCheck size={14} className="text-emerald" />
            <span>Enterprise Data Protection Standards</span>
          </div>
          <h1 className="docs-hero-title">Privacy &amp; Security Policy</h1>
          <p className="docs-hero-sub">
            How DevType protects your developer identity, keystroke telemetry, and intellectual property.
          </p>
          <div className="docs-meta-row">
            <span className="badge badge-teal">Version 2.0.4</span>
            <span className="docs-meta-item">Effective: October 2026</span>
            <span className="docs-meta-item">Jurisdiction: Global / GDPR &amp; CCPA</span>
          </div>
        </section>

        {/* Core Guarantees Callout Banner */}
        <div className="docs-callout-banner">
          <div className="docs-callout-icon">
            <Lock size={24} className="text-emerald" />
          </div>
          <div className="docs-callout-content">
            <h3>Zero Source Code Scraping Guarantee</h3>
            <p>
              DevType <strong>never stores, reads, ingests, or monetizes</strong> your proprietary
              code, variable names, or project files. We do not use your typing practice sessions
              or keyboard telemetry to train external artificial intelligence models.
            </p>
          </div>
        </div>

        {/* Content Layout with Table of Contents */}
        <div className="docs-layout-grid">
          {/* Sticky Table of Contents */}
          <aside className="docs-sidebar-toc">
            <div className="toc-title">Table of Contents</div>
            <nav className="toc-nav">
              <a href="#philosophy" className="toc-link">1. Our Privacy Philosophy</a>
              <a href="#data-collection" className="toc-link">2. Data We Collect</a>
              <a href="#what-we-dont-collect" className="toc-link">3. What We Never Collect</a>
              <a href="#telemetry-details" className="toc-link">4. Keystroke Telemetry Engine</a>
              <a href="#security-architecture" className="toc-link">5. Cryptographic Security</a>
              <a href="#data-retention" className="toc-link">6. Retention &amp; Storage Lifecycle</a>
              <a href="#user-rights" className="toc-link">7. GDPR &amp; CCPA Rights</a>
              <a href="#subprocessors" className="toc-link">8. Sub-Processors &amp; Infrastructure</a>
              <a href="#contact" className="toc-link">9. Security Contact &amp; Disclosures</a>
            </nav>
          </aside>

          {/* Legal Document Content */}
          <article className="docs-article-body">
            {/* Section 1 */}
            <section id="philosophy" className="docs-section">
              <h2>1. Our Privacy Philosophy</h2>
              <p>
                DevType is engineered by software developers, for software developers. We believe that
                typing cadence, muscle memory training, and syntactic fluency data should belong
                exclusively to the engineer who generated it. We do not sell user data, run tracking
                advertisements, or trade telemetry with marketing networks.
              </p>
              <p>
                This Privacy and Security Policy applies to all services, web interfaces, and REST API
                endpoints provided under the DevType platform (including <code>devtype.io</code> and
                associated services).
              </p>
            </section>

            {/* Section 2 */}
            <section id="data-collection" className="docs-section">
              <h2>2. Information We Collect and Process</h2>
              <p>
                To provide authenticated session synchronization, streak tracking, and leaderboard
                placement, DevType processes the following minimal categories of data:
              </p>
              <div className="docs-table-wrapper">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Data Category</th>
                      <th>Specific Data Points</th>
                      <th>Purpose &amp; Legal Basis</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Account Identity</strong></td>
                      <td>Display name, username, email address, cryptographic password hash.</td>
                      <td>Account authentication, password recovery, and profile identity (Contract fulfillment).</td>
                    </tr>
                    <tr>
                      <td><strong>Typing Metrics</strong></td>
                      <td>Gross WPM, net WPM, accuracy percentage, total session duration, error count.</td>
                      <td>Performance reporting, streak calculation, and global leaderboard ranking.</td>
                    </tr>
                    <tr>
                      <td><strong>Keystroke Telemetry</strong></td>
                      <td>Microsecond timestamps (deltas between key-down and key-up), character index.</td>
                      <td>Calculating key latency, cadence consistency, and mistake concentration heatmaps.</td>
                    </tr>
                    <tr>
                      <td><strong>Technical Metadata</strong></td>
                      <td>Browser user-agent, operating system, and IP address for session security.</td>
                      <td>Rate limiting, abuse mitigation, and anti-cheat validation.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 3 */}
            <section id="what-we-dont-collect" className="docs-section">
              <h2>3. What DevType Never Collects</h2>
              <ul className="docs-bullet-list">
                <li>
                  <strong>No Cross-Tab Keylogging:</strong> DevType captures keyboard events strictly
                  while the active browser focus is placed directly inside the typing code editor.
                  Keystrokes in other browser tabs, password fields, or system windows are never observed.
                </li>
                <li>
                  <strong>No Proprietary Code Harvester:</strong> When typing curated algorithmic drills,
                  snippets are loaded from public open-source libraries. When typing custom snippets,
                  data remains encrypted and associated solely with your user profile.
                </li>
                <li>
                  <strong>No Biometric or Surveillance Data:</strong> We never request webcam, microphone,
                  or biometric sensors.
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="telemetry-details" className="docs-section">
              <h2>4. The Keystroke Telemetry Engine</h2>
              <p>
                DevType computes performance metrics locally using high-resolution monotonic clock
                telemetry via <code>window.performance.now()</code>.
              </p>
              <p>
                When a typing session concludes, a condensed cryptographic telemetry summary payload
                is submitted to the Spring Boot REST API (<code>/api/v1/practice/sessions</code>). The
                backend verifies:
              </p>
              <ol className="docs-num-list">
                <li>Gross WPM and net WPM mathematical consistency.</li>
                <li>Time delta bounds (ensuring non-zero keypress distribution to reject scripted macros).</li>
                <li>Accuracy penalty calculation based on Levenshtein and character mismatch indices.</li>
              </ol>
            </section>

            {/* Section 5 */}
            <section id="security-architecture" className="docs-section">
              <h2>5. Cryptographic Security Architecture</h2>
              <p>
                DevType is designed according to defense-in-depth principles:
              </p>
              <div className="docs-security-cards">
                <div className="card docs-sec-card">
                  <div className="sec-card-header">
                    <CheckCircle2 size={16} className="text-emerald" />
                    <h4>BCrypt Password Hashing</h4>
                  </div>
                  <p>
                    All passwords are salted and hashed using BCrypt (work factor 12) inside the Spring
                    Security authentication provider. Raw plaintext passwords are never logged or stored.
                  </p>
                </div>

                <div className="card docs-sec-card">
                  <div className="sec-card-header">
                    <CheckCircle2 size={16} className="text-cobalt" />
                    <h4>Stateless JWT Tokens</h4>
                  </div>
                  <p>
                    Session tokens use JSON Web Tokens (HMAC-SHA256 signed) with strict expiration
                    windows and stateless verification on protected routes.
                  </p>
                </div>

                <div className="card docs-sec-card">
                  <div className="sec-card-header">
                    <CheckCircle2 size={16} className="text-indigo" />
                    <h4>Encryption in Transit &amp; Rest</h4>
                  </div>
                  <p>
                    All API communication requires TLS 1.3 encryption. Backend database persistence
                    layers utilize AES-256 volume encryption.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section id="data-retention" className="docs-section">
              <h2>6. Data Retention and Lifecycle</h2>
              <p>
                Account data is retained for as long as your account remains active. If an account is
                inactive for 24 consecutive months, we will notify you via email prior to archiving.
              </p>
              <p>
                Session logs and typing telemetry are stored to provide your historical graphs and
                annual contribution streaks. If you delete your account, all associated session records,
                telemetry logs, and leaderboard placements are permanently and irreversibly purged
                within 30 days.
              </p>
            </section>

            {/* Section 7 */}
            <section id="user-rights" className="docs-section">
              <h2>7. Your Rights under GDPR, UK GDPR, and CCPA</h2>
              <p>
                Regardless of your geographic location, DevType affords all registered developers the
                following fundamental privacy entitlements:
              </p>
              <ul className="docs-bullet-list">
                <li><strong>Right of Access:</strong> Review all telemetry and account metadata we hold.</li>
                <li><strong>Right to Portability:</strong> Export your session history and WPM progression in standard JSON format.</li>
                <li><strong>Right of Rectification:</strong> Update your display name, email, or credentials anytime via Profile Settings.</li>
                <li><strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request instantaneous and permanent deletion of your profile and data.</li>
                <li><strong>Right to Object &amp; Restrict Processing:</strong> Opt out of public leaderboard rankings while retaining personal practice analytics.</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section id="subprocessors" className="docs-section">
              <h2>8. Sub-Processors &amp; Infrastructure</h2>
              <p>
                DevType works with trusted infrastructure providers that comply with SOC 2 Type II,
                ISO 27001, and GDPR standards:
              </p>
              <div className="docs-table-wrapper">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Entity</th>
                      <th>Service Role</th>
                      <th>Data Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Cloud Hosting &amp; Compute</td>
                      <td>API Application Server &amp; Spring Boot Runtime</td>
                      <td>United States / European Union</td>
                    </tr>
                    <tr>
                      <td>PostgreSQL &amp; Redis</td>
                      <td>Persistent Encrypted Database &amp; Cache</td>
                      <td>United States / European Union</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 9 */}
            <section id="contact" className="docs-section">
              <h2>9. Security Disclosures &amp; Inquiries</h2>
              <p>
                If you have questions regarding this Privacy Policy, wish to exercise your data rights,
                or believe you have discovered a potential security vulnerability, please contact our
                security team directly:
              </p>
              <div className="docs-contact-box">
                <div className="docs-contact-row">
                  <Mail size={16} className="text-cobalt" />
                  <span>Email: <strong>privacy@devtype.io</strong> or <strong>security@devtype.io</strong></span>
                </div>
                <div className="docs-contact-row">
                  <ShieldCheck size={16} className="text-emerald" />
                  <span>Security Team SLA: Responses within 24 business hours.</span>
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
