// src/components/practice/PracticeResultsModal.jsx
import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import {
  Trophy, RotateCcw, ArrowRight, LayoutDashboard,
  Zap, Target, Clock, Star, CheckCircle, ShieldCheck,
  Flame, Code2, BarChart3, AlertCircle, Languages
} from 'lucide-react';
import { getPerformanceTier } from '../../utils/typingMetrics';
import KeyHeatmap from '../reports/KeyHeatmap';
import TemplateErrorLocations from '../reports/TemplateErrorLocations';

export default function PracticeResultsModal({
  isOpen,
  metrics = {},
  snippet,
  keyErrorMap = null,
  errorLocations = null,
  onRetry,
  onNextSnippet,
  onBackToDashboard,
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'heatmap' | 'template'

  // Fire celebration confetti when modal opens & lock body overflow
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563EB', '#38BDF8', '#10B981', '#F59E0B', '#E11D48'],
      });
      setActiveTab('overview');
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Resolve telemetry props or attached metrics
  const resolvedKeyErrorMap = useMemo(() => {
    return keyErrorMap || metrics.keyErrorMap || {};
  }, [keyErrorMap, metrics.keyErrorMap]);

  const resolvedErrorLocations = useMemo(() => {
    return errorLocations || metrics.errorLocations || [];
  }, [errorLocations, metrics.errorLocations]);

  const templateCode = useMemo(() => {
    return snippet?.code || snippet?.content || metrics.code || '';
  }, [snippet, metrics.code]);

  if (!isOpen) return null;

  const tier = getPerformanceTier(metrics.netWpm, metrics.accuracy);
  const errorCount = metrics.errorCount || resolvedErrorLocations.length || 0;

  return createPortal(
    <div className="modal-backdrop-portal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="results-modal-panel">
        {/* Header Ribbon with Achievement Badge */}
        <div className="results-header">
          <div className="results-trophy-wrap" style={{ borderColor: tier.color }}>
            <Trophy size={32} color={tier.color} strokeWidth={2} />
          </div>
          <div className="results-tier-pill" style={{ background: `${tier.color}15`, color: tier.color }}>
            {tier.badge}
          </div>
          <h2 className="results-title" id="modal-title">Session Complete!</h2>
          <p className="results-desc">{tier.desc}</p>
        </div>

        {/* Snippet summary pill */}
        <div className="results-snippet-pill" style={{ flexWrap: 'wrap', gap: 8 }}>
          <span className="results-snippet-name">{snippet?.title}</span>
          <span className="badge badge-teal">{snippet?.language}</span>
          {metrics.isServerVerified ? (
            <span
              className="badge"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#059669',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
              title="Verified and calculated by the DevType server authority"
            >
              <ShieldCheck size={12} strokeWidth={2.5} />
              Server Verified
            </span>
          ) : null}
          {metrics.xpEarned != null ? (
            <span
              className="results-xp-gain"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: 'rgba(217, 119, 6, 0.15)',
                color: '#D97706',
                border: '1px solid rgba(217, 119, 6, 0.3)',
                padding: '3px 8px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: '0.8rem',
              }}
            >
              <Star size={13} fill="currentColor" />
              +{metrics.xpEarned} XP Earned
            </span>
          ) : (
            <span className="results-xp-gain">
              <Star size={13} fill="currentColor" />
              +{snippet?.xp || 50} XP
            </span>
          )}
        </div>

        {/* ── Sub-Navigation Tabs: Overview | Key Heatmap | Error Locations ── */}
        <div className="results-tabs-bar" style={{ width: '100%', maxWidth: 720, margin: '14px 0 18px' }}>
          <button
            type="button"
            className={`results-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <BarChart3 size={15} />
            <span>Performance Overview</span>
          </button>
          <button
            type="button"
            className={`results-tab-btn ${activeTab === 'heatmap' ? 'active' : ''}`}
            onClick={() => setActiveTab('heatmap')}
          >
            <Flame size={15} />
            <span>Key Error Heatmap</span>
            {errorCount > 0 && <span className="results-tab-badge">{errorCount}</span>}
          </button>
          <button
            type="button"
            className={`results-tab-btn ${activeTab === 'template' ? 'active' : ''}`}
            onClick={() => setActiveTab('template')}
          >
            <Code2 size={15} />
            <span>Template Error Places</span>
            {resolvedErrorLocations.length > 0 && (
              <span className="results-tab-badge">{resolvedErrorLocations.length}</span>
            )}
          </button>
        </div>

        {/* ── Tab Content (Shown Above Achievements) ── */}
        <div style={{ width: '100%', minHeight: 280, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {activeTab === 'overview' && (
            <div className="results-metrics-grid" style={{ width: '100%' }}>
              {/* Net WPM */}
              <div className="results-metric-card">
                <div className="results-metric-top">
                  <Zap size={20} color="#2563EB" />
                  <span className="results-metric-lbl">Net Speed</span>
                </div>
                <div className="results-metric-val">
                  {metrics.netWpm}
                  <span className="results-val-unit">WPM</span>
                </div>
                <div className="results-metric-sub">
                  {metrics.grossWpm} Gross WPM {metrics.peakWpm ? `• Peak ${metrics.peakWpm} WPM` : ''}
                </div>
              </div>

              {/* Accuracy */}
              <div className="results-metric-card">
                <div className="results-metric-top">
                  <Target size={20} color="#059669" />
                  <span className="results-metric-lbl">Accuracy</span>
                </div>
                <div className="results-metric-val">
                  {metrics.accuracy}
                  <span className="results-val-unit">%</span>
                </div>
                <div className="results-metric-sub">
                  {metrics.errorCount === 0 ? 'Flawless precision' : `${metrics.errorCount} total errors recorded`}
                </div>
              </div>

              {/* Elapsed Time */}
              <div className="results-metric-card">
                <div className="results-metric-top">
                  <Clock size={20} color="#D97706" />
                  <span className="results-metric-lbl">Time</span>
                </div>
                <div className="results-metric-val">
                  {metrics.formattedTime || `${metrics.elapsedSeconds || 0}s`}
                </div>
                <div className="results-metric-sub">
                  {metrics.elapsedSeconds}s total duration
                </div>
              </div>

              {/* Characters Typed */}
              <div className="results-metric-card">
                <div className="results-metric-top">
                  <CheckCircle size={20} color="#7C3AED" />
                  <span className="results-metric-lbl">Characters</span>
                </div>
                <div className="results-metric-val">
                  {snippet?.code?.length || templateCode.length || 0}
                </div>
                <div className="results-metric-sub">
                  100% completed
                </div>
              </div>
            </div>
          )}

          {activeTab === 'heatmap' && (
            <div className="results-diagnostic-section" style={{ width: '100%' }}>
              <KeyHeatmap
                keyErrorMap={resolvedKeyErrorMap}
                totalErrors={errorCount}
              />
            </div>
          )}

          {activeTab === 'template' && (
            <div className="results-diagnostic-section" style={{ width: '100%' }}>
              <TemplateErrorLocations
                code={templateCode}
                language={snippet?.language || 'javascript'}
                errorLocations={resolvedErrorLocations}
                syntaxErrors={metrics.syntaxErrors}
              />
            </div>
          )}
        </div>

        {/* ── Newly Unlocked Achievements & Milestones (Positioned Below Report) ── */}
        {metrics.newlyUnlockedAchievements && metrics.newlyUnlockedAchievements.length > 0 && (
          <div
            style={{
              width: '100%',
              margin: '20px 0 12px',
              padding: '14px 18px',
              borderRadius: 12,
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1.5px solid rgba(245, 158, 11, 0.35)',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: '#D97706', fontWeight: 800, fontSize: '0.92rem' }}>
              <Trophy size={18} />
              <span>Newly Unlocked Milestone Achievement{metrics.newlyUnlockedAchievements.length > 1 ? 's' : ''}!</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
              {metrics.newlyUnlockedAchievements.map((ach) => (
                <div
                  key={ach.id || ach.code}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.85)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--t1)' }}>{ach.name}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--t3)' }}>{ach.description}</div>
                  </div>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: '#D97706',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      background: 'rgba(245, 158, 11, 0.15)',
                      padding: '3px 8px',
                      borderRadius: 10,
                    }}
                  >
                    <Star size={12} fill="currentColor" />
                    +{ach.rewardXp || 50} XP
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Level Progression Progress Bar (Positioned Below Report) */}
        {metrics.currentLevel != null && (
          <div
            style={{
              width: '100%',
              margin: '8px 0 16px',
              padding: '12px 18px',
              borderRadius: 12,
              background: 'rgba(37, 99, 235, 0.05)',
              border: '1px solid rgba(37, 99, 235, 0.18)',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--brand)' }}>
                Level {metrics.currentLevel}
              </span>
              <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
                {(metrics.totalXp || 0).toLocaleString()} / {(metrics.nextLevelXp || 200).toLocaleString()} XP ({metrics.levelProgressPercent || 0}%)
              </span>
            </div>
            <div className="xp-bar" style={{ height: 7, background: 'rgba(0, 0, 0, 0.08)', borderRadius: 4, overflow: 'hidden' }}>
              <div
                className="xp-bar-fill"
                style={{ width: `${Math.min(100, Math.max(0, metrics.levelProgressPercent || 0))}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="results-actions" style={{ flexWrap: 'wrap', gap: 10, justifyContent: 'center', width: '100%', marginTop: 8 }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onBackToDashboard}
            id="btn-results-dashboard"
          >
            <LayoutDashboard size={15} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary-glass"
            onClick={onRetry}
            id="btn-results-retry"
          >
            <RotateCcw size={15} />
            <span>Retry Drill</span>
          </button>

          {/* Practice in Next Language */}
          <button
            type="button"
            className="btn btn-secondary-glass"
            onClick={() => onNextSnippet('next_language')}
            title="Practice the same algorithmic drill in the next programming language"
            id="btn-results-next-lang"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Languages size={15} />
            <span>Try in Next Language</span>
          </button>

          {/* Next Drill in current language */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onNextSnippet('next_template')}
            title={`Continue to the next problem in ${snippet?.language || 'current language'}`}
            id="btn-results-next"
          >
            <span>Next {snippet?.language || ''} Drill</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
