// src/components/practice/SnippetBlueprintCard.jsx
import React from 'react';
import {
  Code2, Sparkles, Target, Compass, Lock,
  Flame, ShieldAlert, Clock, ChevronDown, Eye, EyeOff
} from 'lucide-react';

const DIFFICULTY_STYLES = {
  Beginner: { color: '#059669', bg: 'rgba(5, 150, 105, 0.12)', border: 'rgba(5, 150, 105, 0.28)' },
  Intermediate: { color: '#D97706', bg: 'rgba(217, 119, 6, 0.12)', border: 'rgba(217, 119, 6, 0.28)' },
  Advanced: { color: '#E11D48', bg: 'rgba(225, 29, 72, 0.12)', border: 'rgba(225, 29, 72, 0.28)' },
};

const LANG_COLORS = {
  'C++': '#2563EB',
  C: '#0284C7',
  Python: '#4F46E5',
  JavaScript: '#EAB308',
  TypeScript: '#0284C7',
  Java: '#DC2626',
  Rust: '#EA580C',
  Go: '#0D9488',
};

const SUPPORTED_LANGS = ['C++', 'Python', 'Java', 'JavaScript', 'TypeScript', 'C', 'Rust', 'Go'];

export default function SnippetBlueprintCard({
  snippet,
  mode,
  onSelectMode,
  onBrowseTemplates,
  onSelectLanguage,
  isLanguageLocked = false,
  remainingSeconds = null,
  practiceMode = 'copy',
  onRequestHint = null,
  hintsUsed = 0,
}) {
  const diffStyle = DIFFICULTY_STYLES[snippet?.difficulty] || DIFFICULTY_STYLES.Intermediate;
  const currentLang = snippet?.language || 'C++';
  const langColor = LANG_COLORS[currentLang] || '#2563EB';
  const locked = isLanguageLocked || Boolean(snippet?.isLanguageLocked);

  return (
    <div className="snippet-blueprint-card unique-sbc">
      {/* ── Top Header: Active Blueprint Label & Catalog Trigger ── */}
      <div className="sbc-header">
        <div className="sbc-category">
          <span className="sbc-cat-glow" style={{ background: langColor }} />
          <Code2 size={13} className="sbc-cat-icon" />
          <span>ACTIVE BLUEPRINT</span>
        </div>

        <button
          className="sbc-browse-btn"
          onClick={onBrowseTemplates}
          title="Browse all catalog blueprints"
          id="btn-browse-templates"
          type="button"
        >
          <Compass size={12} />
          <span>Catalog</span>
        </button>
      </div>

      {/* ── Title Block ── */}
      <div className="sbc-title-block">
        <h3 className="sbc-title" title={snippet?.title}>{snippet?.title || 'Code Snippet'}</h3>

        <div className="sbc-badges">
          {/* Interactive Stack Switcher */}
          <div
            className="sbc-lang-pill-interactive"
            style={{
              color: langColor,
              background: `${langColor}14`,
              borderColor: `${langColor}35`,
            }}
            title={locked ? "Language is locked for this drill" : "Switch programming language"}
          >
            <span className="lang-pip" style={{ background: langColor }} />
            {onSelectLanguage && !locked ? (
              <select
                className="sbc-lang-select"
                value={currentLang}
                onChange={(e) => onSelectLanguage(e.target.value)}
                aria-label="Change drill language"
              >
                {SUPPORTED_LANGS.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            ) : (
              <span style={{ fontWeight: 700, fontSize: '0.72rem' }}>{currentLang}</span>
            )}
            {locked && (
              <span className="sbc-locked-badge">
                <Lock size={9} />
              </span>
            )}
            {!locked && onSelectLanguage && (
              <ChevronDown size={11} className="sbc-chevron" />
            )}
          </div>

          {/* Difficulty Badge */}
          <span
            className="sbc-diff-pill"
            style={{
              color: diffStyle.color,
              background: diffStyle.bg,
              borderColor: diffStyle.border,
            }}
          >
            {snippet?.difficulty || 'Intermediate'}
          </span>

          {/* XP Reward */}
          <span className="sbc-xp-pill">
            <Sparkles size={11} className="xp-spark" />
            <span>+{snippet?.xp || snippet?.xpBounty || 40} XP</span>
          </span>
        </div>
      </div>

      {/* ── Brief Objective Description ── */}
      {snippet?.description && (
        <p className="sbc-desc">{snippet.description}</p>
      )}

      {/* ── Recall Tier Spotlight if in Cloze or Blind Mode ── */}
      {practiceMode && practiceMode !== 'copy' && (
        <div
          style={{
            margin: '10px 0',
            padding: '10px 12px',
            borderRadius: 10,
            background: practiceMode === 'cloze' ? 'rgba(139, 92, 246, 0.12)' : 'rgba(225, 29, 72, 0.12)',
            border: practiceMode === 'cloze' ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(225, 29, 72, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {practiceMode === 'cloze' ? <Eye size={13} color="#A78BFA" /> : <EyeOff size={13} color="#FDA4AF" />}
              <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: practiceMode === 'cloze' ? '#A78BFA' : '#FDA4AF', textTransform: 'uppercase' }}>
                {practiceMode === 'cloze' ? 'Tier 2: Cloze Recall' : 'Tier 3: Blind Recall'}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--t2)', marginTop: 2 }}>
              {practiceMode === 'cloze' ? 'Target words blanked out' : 'Implementation code masked'}
            </div>
          </div>
          {onRequestHint && (
            <button
              type="button"
              onClick={onRequestHint}
              className="btn btn-secondary-glass btn-xs"
              style={{ fontSize: '0.7rem', height: 26, padding: '0 8px' }}
              title="Reveal subtle character hint (Shortcut: F1)"
            >
              <span>Hint [F1]</span>
              {hintsUsed > 0 && <span style={{ opacity: 0.8 }}>({hintsUsed})</span>}
            </button>
          )}
        </div>
      )}

      {/* ── Target Benchmark Pill ── */}
      <div className="sbc-benchmark-row">
        <Target size={13} className="sbc-bm-icon" />
        <span className="sbc-bm-txt">
          Target Goal: <strong>60+ WPM</strong> &bull; <strong>98% Accuracy</strong>
        </span>
      </div>

      <div className="sbc-divider" />

      {/* ── Mode Segmented Control (Free | Strict | Timed) ── */}
      <div className="sbc-mode-section">
        <div className="sbc-mode-header-row">
          <span className="sbc-mode-lbl">PRACTICE MODE</span>
          {mode === 'Timed' && remainingSeconds != null && (
            <span className="sbc-countdown-pill animate-pulse">
              <Clock size={11} />
              <span>{remainingSeconds}s remaining</span>
            </span>
          )}
        </div>

        <div className="sbc-mode-segments unique-mode-grid">
          <button
            type="button"
            className={`sbc-mode-btn ${mode === 'Free' ? 'active active-free' : ''}`}
            onClick={() => onSelectMode('Free')}
            title="Free typing: Mistakes are flagged without stopping your typing"
            id="btn-mode-free"
          >
            <Flame size={12} className="mode-btn-icon" />
            <span>Free</span>
          </button>

          <button
            type="button"
            className={`sbc-mode-btn ${mode === 'Strict' ? 'active active-strict' : ''}`}
            onClick={() => onSelectMode('Strict')}
            title="Strict mode: All typos must be corrected before advancing"
            id="btn-mode-strict"
          >
            <ShieldAlert size={12} className="mode-btn-icon" />
            <span>Strict</span>
          </button>

          <button
            type="button"
            className={`sbc-mode-btn ${mode === 'Timed' ? 'active active-timed' : ''}`}
            onClick={() => onSelectMode('Timed')}
            title="Timed mode: 60-second speed benchmark challenge"
            id="btn-mode-timed"
          >
            <Clock size={12} className="mode-btn-icon" />
            <span>Timed</span>
          </button>
        </div>

        {/* Dynamic Mode Explanatory Subtitle */}
        <div className="sbc-mode-sub">
          {mode === 'Free' && (
            <span>✨ <strong>Free Flow:</strong> Type freely. Errors are marked without blocking progress.</span>
          )}
          {mode === 'Strict' && (
            <span>🔒 <strong>Zero Tolerance:</strong> Typos block cursor until the correct character is typed.</span>
          )}
          {mode === 'Timed' && (
            <span>⏱️ <strong>60s Sprint:</strong> Race against the clock. Results are recorded when time expires.</span>
          )}
        </div>
      </div>
    </div>
  );
}
