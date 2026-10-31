import { useMemo } from 'react';
import {
  Zap, Flame, CheckCircle2, AlertTriangle, Clock,
  Activity, Volume2, VolumeX, RotateCcw, ArrowLeft, ShieldAlert
} from 'lucide-react';

/**
 * Unique Precision & Telemetry Card for Code Typing
 * Features:
 * • Circular Accuracy Arc with dynamic status glow
 * • Live Dual Speedometer (Net WPM + Instant Burst Peak)
 * • Keystroke Rhythm & Flow Bar with streak multiplier
 * • Syntax Friction Radar (diagnoses errors into Brackets, Punctuation, Identifiers, and Indent)
 * • Quick session controls (Audio toggle, Reset, Exit)
 */
export default function PracticeTelemetryCard({
  metrics,
  streak = 0,
  peakWpm = 0,
  syntaxErrors = { brackets: 0, punctuation: 0, identifiers: 0, whitespace: 0 },
  isTyping = false,
  soundEnabled = true,
  mode = 'Free',
  remainingSeconds = null,
  onToggleSound,
  onReset,
  onBackToDashboard,
}) {
  const { netWpm, accuracy, errorCount, charsRemaining, progressPercent, formattedTime } = metrics;

  // Circular gauge circumference calculation (r = 28)
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = useMemo(() => {
    const clampedAcc = Math.max(0, Math.min(100, accuracy));
    return circumference - (clampedAcc / 100) * circumference;
  }, [accuracy, circumference]);

  // Color tier based on accuracy
  const { strokeColor, statusLabel, statusClass } = useMemo(() => {
    if (accuracy >= 98) {
      return { strokeColor: '#059669', statusLabel: 'Flawless', statusClass: 'tier-flawless' };
    }
    if (accuracy >= 92) {
      return { strokeColor: '#2563EB', statusLabel: 'Mastery', statusClass: 'tier-mastery' };
    }
    if (accuracy >= 85) {
      return { strokeColor: '#D97706', statusLabel: 'Solid', statusClass: 'tier-solid' };
    }
    return { strokeColor: '#E11D48', statusLabel: 'Recalibrating', statusClass: 'tier-caution' };
  }, [accuracy]);

  // Rhythm cadence status based on streak & typing activity
  const flowLabel = useMemo(() => {
    if (streak >= 30) return '⚡ Hyper Flow';
    if (streak >= 15) return '✨ Zen Rhythm';
    if (isTyping) return '⚡ In Rhythm';
    return 'Ready';
  }, [streak, isTyping]);

  return (
    <div className="practice-telemetry-card">
      {/* ── Header: Circular Precision Arc & Speedometer ── */}
      <div className="pt-top-row">
        {/* Left: Accuracy Ring */}
        <div className="pt-ring-wrapper">
          <svg className="pt-accuracy-ring" width="70" height="70" viewBox="0 0 70 70">
            <circle
              className="pt-ring-bg"
              cx="35"
              cy="35"
              r={radius}
              strokeWidth="5.5"
            />
            <circle
              className="pt-ring-fill"
              cx="35"
              cy="35"
              r={radius}
              strokeWidth="5.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              stroke={strokeColor}
            />
          </svg>
          <div className="pt-ring-inner">
            <span className="pt-ring-val">{accuracy}%</span>
            <span className="pt-ring-sub">ACC</span>
          </div>
        </div>

        {/* Right: Net WPM & Peak Burst */}
        <div className="pt-speed-block">
          <div className="pt-speed-main">
            <span className="pt-wpm-num">{netWpm}</span>
            <span className="pt-wpm-unit">WPM</span>
          </div>

          <div className="pt-speed-badges">
            <span className={`pt-tier-badge ${statusClass}`}>
              {statusLabel}
            </span>
            {peakWpm > 0 && (
              <span className="pt-burst-badge" title="Session peak burst speed">
                <Zap size={10} className="burst-icon" />
                <span>{peakWpm} pk</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Mode Specific HUD: Timed 60s Sprint or Strict Warning ── */}
      {mode === 'Timed' && (
        <div className={`pt-timed-hud ${(remainingSeconds != null && remainingSeconds <= 10) ? 'pt-timed-urgent' : ''}`}>
          <div className="pt-timed-hud-top">
            <div className="pt-timed-label-box">
              <Clock size={13} className="pt-timed-icon" />
              <span>60s SPEED SPRINT</span>
            </div>
            <div className="pt-timed-val">
              <strong>{remainingSeconds != null ? remainingSeconds : 60}</strong>
              <small>s left</small>
            </div>
          </div>
          <div className="pt-timed-track">
            <div
              className="pt-timed-fill"
              style={{
                width: `${Math.max(0, Math.min(100, ((remainingSeconds != null ? remainingSeconds : 60) / 60) * 100))}%`
              }}
            />
          </div>
        </div>
      )}

      {mode === 'Strict' && (
        <div className="pt-strict-hud">
          <ShieldAlert size={13} className="pt-strict-icon" />
          <span>Strict Invariant: Typos block progress until corrected</span>
        </div>
      )}

      <div className="pt-divider" />

      {/* ── Middle: Keystroke Flow & Streak Telemetry ── */}
      <div className="pt-flow-row">
        <div className="pt-streak-box">
          <Flame size={14} className={`streak-icon ${streak >= 10 ? 'streak-lit' : ''}`} />
          <span className="pt-streak-val">{streak}</span>
          <span className="pt-streak-lbl">Streak</span>
        </div>

        <div className="pt-cadence-box">
          <div className="pt-rhythm-bars" aria-hidden="true">
            <span className={`r-bar ${isTyping ? 'r-pulse-1' : ''}`} />
            <span className={`r-bar ${isTyping ? 'r-pulse-2' : ''}`} />
            <span className={`r-bar ${isTyping ? 'r-pulse-3' : ''}`} />
            <span className={`r-bar ${isTyping ? 'r-pulse-4' : ''}`} />
          </div>
          <span className="pt-flow-txt">{flowLabel}</span>
        </div>
      </div>

      <div className="pt-divider" />

      {/* ── Syntax Friction Radar (Error Diagnostics by Category) ── */}
      <div className="pt-friction-section">
        <div className="pt-friction-header">
          <span className="pt-friction-title">Syntax Friction</span>
          {errorCount === 0 ? (
            <span className="pt-friction-clean">
              <CheckCircle2 size={12} />
              <span>Zero Friction</span>
            </span>
          ) : (
            <span className="pt-friction-alert">
              <AlertTriangle size={12} />
              <span>{errorCount} {errorCount === 1 ? 'Error' : 'Errors'}</span>
            </span>
          )}
        </div>

        {/* 4 Category Pill Grid */}
        <div className="pt-friction-grid">
          <div className={`pt-f-chip ${syntaxErrors.brackets > 0 ? 'f-active' : ''}`}>
            <span className="pt-f-icon">&#123;&#125;</span>
            <span className="pt-f-name">Brackets</span>
            <span className="pt-f-val">{syntaxErrors.brackets}</span>
          </div>

          <div className={`pt-f-chip ${syntaxErrors.punctuation > 0 ? 'f-active' : ''}`}>
            <span className="pt-f-icon">;:</span>
            <span className="pt-f-name">Symbols</span>
            <span className="pt-f-val">{syntaxErrors.punctuation}</span>
          </div>

          <div className={`pt-f-chip ${syntaxErrors.identifiers > 0 ? 'f-active' : ''}`}>
            <span className="pt-f-icon">_a</span>
            <span className="pt-f-name">Syntax</span>
            <span className="pt-f-val">{syntaxErrors.identifiers}</span>
          </div>

          <div className={`pt-f-chip ${syntaxErrors.whitespace > 0 ? 'f-active' : ''}`}>
            <span className="pt-f-icon">&#x2423;</span>
            <span className="pt-f-name">Indents</span>
            <span className="pt-f-val">{syntaxErrors.whitespace}</span>
          </div>
        </div>
      </div>

      {/* ── Progress & Time Pill ── */}
      <div className="pt-footer-row">
        <div className="pt-progress-track">
          <div
            className="pt-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="pt-footer-meta">
          <span className="pt-time-cell">
            <Clock size={11} />
            <span>{formattedTime}</span>
          </span>
          <span className="pt-remain-cell">
            <Activity size={11} />
            <span>{charsRemaining} left</span>
          </span>
        </div>
      </div>

      <div className="pt-divider" />

      {/* ── Quick Action Controls Bar (Sound, Reset, Exit) ── */}
      <div className="pt-actions-bar">
        <button
          className={`pt-action-pill ${soundEnabled ? 'active' : ''}`}
          onClick={onToggleSound}
          title="Toggle mechanical typing sound"
          id="btn-toggle-sound"
        >
          {soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
          <span>Sound: {soundEnabled ? 'ON' : 'OFF'}</span>
        </button>

        <button
          className="pt-action-pill"
          onClick={onReset}
          title="Reset current session"
          id="btn-reset-session"
        >
          <RotateCcw size={12} />
          <span>Reset</span>
        </button>

        <button
          className="pt-action-pill pt-pill-exit"
          onClick={onBackToDashboard}
          title="Exit to Dashboard"
          id="btn-back-to-dash"
        >
          <ArrowLeft size={12} />
          <span>Exit</span>
        </button>
      </div>
    </div>
  );
}
