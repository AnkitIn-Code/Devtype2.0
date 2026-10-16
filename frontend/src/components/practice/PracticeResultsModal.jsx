// src/components/practice/PracticeResultsModal.jsx
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy, RotateCcw, ArrowRight, LayoutDashboard,
  Zap, Target, Clock, Star, CheckCircle
} from 'lucide-react';
import { getPerformanceTier } from '../../utils/typingMetrics';

export default function PracticeResultsModal({
  isOpen,
  metrics,
  snippet,
  onRetry,
  onNextSnippet,
  onBackToDashboard,
}) {
  // Fire celebration confetti when modal opens
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563EB', '#38BDF8', '#10B981', '#F59E0B', '#E11D48'],
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const tier = getPerformanceTier(metrics.netWpm, metrics.accuracy);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
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
        <div className="results-snippet-pill">
          <span className="results-snippet-name">{snippet?.title}</span>
          <span className="badge badge-teal">{snippet?.language}</span>
          <span className="results-xp-gain">
            <Star size={13} fill="currentColor" />
            +{snippet?.xp || 50} XP Earned
          </span>
        </div>

        {/* Big 4 Metrics Grid */}
        <div className="results-metrics-grid">
          {/* Net WPM */}
          <div className="results-metric-card">
            <div className="results-metric-top">
              <Zap size={18} color="#2563EB" />
              <span className="results-metric-lbl">Net Speed</span>
            </div>
            <div className="results-metric-val">
              {metrics.netWpm}
              <span className="results-val-unit">WPM</span>
            </div>
            <div className="results-metric-sub">
              {metrics.grossWpm} Gross WPM
            </div>
          </div>

          {/* Accuracy */}
          <div className="results-metric-card">
            <div className="results-metric-top">
              <Target size={18} color="#059669" />
              <span className="results-metric-lbl">Accuracy</span>
            </div>
            <div className="results-metric-val">
              {metrics.accuracy}
              <span className="results-val-unit">%</span>
            </div>
            <div className="results-metric-sub">
              {metrics.errorCount === 0 ? 'Flawless precision' : `${metrics.errorCount} total errors`}
            </div>
          </div>

          {/* Elapsed Time */}
          <div className="results-metric-card">
            <div className="results-metric-top">
              <Clock size={18} color="#D97706" />
              <span className="results-metric-lbl">Time</span>
            </div>
            <div className="results-metric-val">
              {metrics.formattedTime}
            </div>
            <div className="results-metric-sub">
              {metrics.elapsedSeconds}s total duration
            </div>
          </div>

          {/* Characters Typed */}
          <div className="results-metric-card">
            <div className="results-metric-top">
              <CheckCircle size={18} color="#7C3AED" />
              <span className="results-metric-lbl">Characters</span>
            </div>
            <div className="results-metric-val">
              {snippet?.code?.length || 0}
            </div>
            <div className="results-metric-sub">
              100% completed
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="results-actions">
          <button
            className="btn btn-ghost"
            onClick={onBackToDashboard}
            id="btn-results-dashboard"
          >
            <LayoutDashboard size={15} />
            <span>Dashboard</span>
          </button>

          <button
            className="btn btn-secondary-glass"
            onClick={onRetry}
            id="btn-results-retry"
          >
            <RotateCcw size={15} />
            <span>Retry Snippet</span>
          </button>

          <button
            className="btn btn-primary"
            onClick={onNextSnippet}
            id="btn-results-next"
          >
            <span>Next Snippet</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
