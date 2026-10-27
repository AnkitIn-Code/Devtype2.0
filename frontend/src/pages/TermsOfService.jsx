// src/pages/TermsOfService.jsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, ShieldAlert, Award, Code2, Users, Cpu,
  CheckCircle2, AlertTriangle, ArrowRight, Mail, Scale
} from 'lucide-react';
import PublicHeader from '../components/common/PublicHeader';
import LandingFooter from '../components/landing/LandingFooter';

export default function TermsOfService() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="landing-page-root docs-page-root">
      <PublicHeader activeTab="terms" />

      <main className="docs-main-container">
        {/* Page Hero Header */}
        <section className="docs-hero-section">
          <div className="docs-hero-badge">
            <Scale size={14} className="text-cobalt" />
            <span>Developer Service Agreement</span>
          </div>
          <h1 className="docs-hero-title">Terms of Service</h1>
          <p className="docs-hero-sub">
            The rules, guidelines, and fair play requirements governing the DevType developer platform.
          </p>
          <div className="docs-meta-row">
            <span className="badge badge-teal">Version 2.0.4</span>
            <span className="docs-meta-item">Effective Date: October 2026</span>
            <span className="docs-meta-item">Binding Legal Agreement</span>
          </div>
        </section>

        {/* Anti-Bot Callout Banner */}
        <div className="docs-callout-banner alert-warning-theme">
          <div className="docs-callout-icon">
            <ShieldAlert size={24} className="text-rose" />
          </div>
          <div className="docs-callout-content">
            <h3>Leaderboard Integrity &amp; Strict Anti-Bot Policy</h3>
            <p>
              DevType is created solely for human software developers building syntactic muscle memory.
              The use of automated keystroke injection drivers, headless browser scripts (e.g. Puppeteer,
              Playwright), or macros on public leaderboards is strictly forbidden and results in
              permanent score disqualification.
            </p>
          </div>
        </div>

        {/* Content Layout with Table of Contents */}
        <div className="docs-layout-grid">
          {/* Sticky Table of Contents */}
          <aside className="docs-sidebar-toc">
            <div className="toc-title">Table of Contents</div>
            <nav className="toc-nav">
              <a href="#acceptance" className="toc-link">1. Acceptance of Terms</a>
              <a href="#accounts" className="toc-link">2. Account Registration</a>
              <a href="#acceptable-use" className="toc-link">3. Permitted Platform Use</a>
              <a href="#anti-cheat" className="toc-link">4. Anti-Cheat &amp; Telemetry Audits</a>
              <a href="#intellectual-property" className="toc-link">5. Code Licensing &amp; IP</a>
              <a href="#multiplayer-rules" className="toc-link">6. Multiplayer Fair Play</a>
              <a href="#rate-limits" className="toc-link">7. API Quotas &amp; Fair Limits</a>
              <a href="#disclaimers" className="toc-link">8. Disclaimer of Warranties</a>
              <a href="#termination" className="toc-link">9. Suspension &amp; Termination</a>
              <a href="#governing-law" className="toc-link">10. Governing Law &amp; Contact</a>
            </nav>
          </aside>

          {/* Legal Document Content */}
          <article className="docs-article-body">
            {/* Section 1 */}
            <section id="acceptance" className="docs-section">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing, browsing, registering an account on, or interacting with the DevType
                platform (including its web application, API endpoints, and associated services), you
                agree to be bound by these Terms of Service (&quot;Terms&quot;) and our Privacy &amp; Security Policy.
                If you do not agree to these Terms, you must immediately discontinue use of the platform.
              </p>
            </section>

            {/* Section 2 */}
            <section id="accounts" className="docs-section">
              <h2>2. Account Registration and Credentials</h2>
              <p>
                To access personalized typing practice telemetry, custom template generation, and
                streak tracking, you must register for an account. By registering, you affirm that:
              </p>
              <ul className="docs-bullet-list">
                <li>You are at least 13 years of age (or the age of legal consent in your jurisdiction).</li>
                <li>You will provide accurate, current, and complete registration information.</li>
                <li>You are solely responsible for safeguarding your login credentials and JWT tokens.</li>
                <li>You will immediately notify DevType of any unauthorized use or security compromise.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="acceptable-use" className="docs-section">
              <h2>3. Permitted Platform Use</h2>
              <p>
                DevType grants you a revocable, non-exclusive, non-transferable license to utilize the
                platform for educational, professional training, and benchmarking purposes. Prohibited
                activities include:
              </p>
              <ul className="docs-bullet-list">
                <li>Reverse engineering or decompiling the proprietary telemetry analysis algorithms.</li>
                <li>Interfering with, disrupting, or launching denial-of-service attacks against backend services.</li>
                <li>Attempting to bypass authentication route guards or impersonate other developers.</li>
                <li>Scraping or harvesting personal information of other registered users.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="anti-cheat" className="docs-section">
              <h2>4. Anti-Cheat Heuristics and Telemetry Audits</h2>
              <p>
                Global leaderboards and competitive sprints are governed by rigorous automated
                telemetry integrity verification algorithms running inside the Spring Boot backend:
              </p>
              <div className="docs-security-cards">
                <div className="card docs-sec-card">
                  <div className="sec-card-header">
                    <CheckCircle2 size={16} className="text-emerald" />
                    <h4>Variance Distribution Audits</h4>
                  </div>
                  <p>
                    Human keystrokes exhibit natural microsecond variance based on finger travel distances
                    and syntactic complexity. Submissions exhibiting near-zero variance are flagged.
                  </p>
                </div>

                <div className="card docs-sec-card">
                  <div className="sec-card-header">
                    <CheckCircle2 size={16} className="text-rose" />
                    <h4>Biomechanical Velocity Limits</h4>
                  </div>
                  <p>
                    Sessions recording speeds in excess of 240 Net WPM undergo mathematical cadence
                    and burst ratio evaluation to verify physical keystroke validity.
                  </p>
                </div>

                <div className="card docs-sec-card">
                  <div className="sec-card-header">
                    <CheckCircle2 size={16} className="text-amber" />
                    <h4>Score Nullification</h4>
                  </div>
                  <p>
                    Any verified script or macro injection results in immediate removal of affected
                    records and potential forfeiture of competitive division badges.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="intellectual-property" className="docs-section">
              <h2>5. Code Snippet Licensing &amp; Intellectual Property</h2>
              <p>
                Our policy regarding code snippets and practice templates is clear and developer-friendly:
              </p>
              <ul className="docs-bullet-list">
                <li>
                  <strong>Curated Platform Templates:</strong> Algorithmic snippets, data structure drills,
                  and utility functions provided by DevType are drawn from open-source repositories licensed
                  under permissive open-source licenses (MIT, Apache 2.0, BSD-3-Clause) with full respect
                  for copyright attribution.
                </li>
                <li>
                  <strong>User-Created Templates:</strong> Any custom code snippet or template you
                  create or import remains your sole intellectual property. You grant DevType only the
                  limited, worldwide license necessary to host and render the snippet for your practice sessions.
                </li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="multiplayer-rules" className="docs-section">
              <h2>6. Multiplayer Racing &amp; Community Conduct</h2>
              <p>
                In synchronous 1v1 duels, room codes, and community challenges, developers are expected
                to uphold the DevType Community Code of Conduct:
              </p>
              <ul className="docs-bullet-list">
                <li>Zero tolerance for hate speech, harassment, or offensive display names.</li>
                <li>Intentional match dodging or griefing in ranked ELO lobbies will result in cooldown penalties.</li>
                <li>Good sportsmanship is expected across all public lobbies and spectator modes.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="rate-limits" className="docs-section">
              <h2>7. API Quotas and Fair Limits</h2>
              <p>
                To maintain 99.9% availability for all developers, API rate limits are enforced:
              </p>
              <div className="docs-table-wrapper">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Endpoint Area</th>
                      <th>Rate Limit</th>
                      <th>Behavior on Exceeded</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Session Submission (<code>/api/v1/practice/sessions</code>)</td>
                      <td>60 requests / minute per IP/Account</td>
                      <td>HTTP 429 Too Many Requests</td>
                    </tr>
                    <tr>
                      <td>Authentication (<code>/api/v1/auth/*</code>)</td>
                      <td>10 attempts / 5 minutes</td>
                      <td>Temporary IP backoff delay</td>
                    </tr>
                    <tr>
                      <td>AI Generator (<code>/api/v1/ai/generate</code>)</td>
                      <td>20 generations / hour</td>
                      <td>Hourly refill quota</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 8 */}
            <section id="disclaimers" className="docs-section">
              <h2>8. Disclaimer of Warranties &amp; Limitation of Liability</h2>
              <p>
                DevType services are provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis
                without warranties of any kind, whether express or implied. DevType does not warrant
                that the service will be uninterrupted, error-free, or entirely bug-free.
              </p>
              <p>
                To the fullest extent permitted by applicable law, in no event shall DevType or its
                team be liable for any indirect, incidental, consequential, special, or punitive damages
                arising out of or in connection with your use of the platform.
              </p>
            </section>

            {/* Section 9 */}
            <section id="termination" className="docs-section">
              <h2>9. Account Suspension and Termination</h2>
              <p>
                You may terminate your account at any time via Settings. DevType reserves the right,
                in its sole discretion, to suspend or terminate accounts that violate these Terms,
                engage in automated leaderboard manipulation, or compromise system infrastructure.
              </p>
            </section>

            {/* Section 10 */}
            <section id="governing-law" className="docs-section">
              <h2>10. Governing Law &amp; Legal Notices</h2>
              <p>
                These Terms are governed by and construed in accordance with the laws of the applicable
                jurisdiction, without regard to conflict of law principles.
              </p>
              <div className="docs-contact-box">
                <div className="docs-contact-row">
                  <Mail size={16} className="text-cobalt" />
                  <span>Legal Team Inquiries: <strong>legal@devtype.io</strong></span>
                </div>
                <div className="docs-contact-row">
                  <FileText size={16} className="text-indigo" />
                  <span>Formal Notices: DevType Legal Department, Developer Platform Operations.</span>
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
