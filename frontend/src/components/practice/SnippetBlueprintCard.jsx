// src/components/practice/SnippetBlueprintCard.jsx
import { Code2, Sparkles, Target, Compass } from 'lucide-react';

const DIFFICULTY_STYLES = {
  Beginner: { color: '#059669', bg: 'rgba(5, 150, 105, 0.1)', border: 'rgba(5, 150, 105, 0.2)' },
  Intermediate: { color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)', border: 'rgba(217, 119, 6, 0.2)' },
  Advanced: { color: '#E11D48', bg: 'rgba(225, 29, 72, 0.1)', border: 'rgba(225, 29, 72, 0.2)' },
};

const LANG_COLORS = {
  'C++': '#2563EB',
  Python: '#4F46E5',
  JavaScript: '#D97706',
  TypeScript: '#0284C7',
  Java: '#DC2626',
  Rust: '#EA580C',
  Go: '#0D9488',
};

export default function SnippetBlueprintCard({
  snippet,
  mode,
  onSelectMode,
  onBrowseTemplates,
}) {
  const diffStyle = DIFFICULTY_STYLES[snippet?.difficulty] || DIFFICULTY_STYLES.Intermediate;
  const langColor = LANG_COLORS[snippet?.language] || '#2563EB';

  return (
    <div className="snippet-blueprint-card">
      {/* ── Header: Blueprint Category & Navigation ── */}
      <div className="sbc-header">
        <div className="sbc-category">
          <Code2 size={13} className="sbc-cat-icon" />
          <span>ACTIVE BLUEPRINT</span>
        </div>
        <button
          className="sbc-browse-btn"
          onClick={onBrowseTemplates}
          title="Browse all templates and challenges"
          id="btn-browse-templates"
        >
          <Compass size={12} />
          <span>Catalog</span>
        </button>
      </div>

      {/* ── Snippet Title & Metadata Badges ── */}
      <div className="sbc-title-block">
        <h3 className="sbc-title">{snippet?.title || 'Code Snippet'}</h3>
        <div className="sbc-badges">
          <span
            className="sbc-lang-pill"
            style={{
              color: langColor,
              background: `${langColor}14`,
              borderColor: `${langColor}30`,
            }}
          >
            <span className="lang-pip" style={{ background: langColor }} />
            {snippet?.language || 'Code'}
          </span>

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

          <span className="sbc-xp-pill">
            <Sparkles size={11} className="xp-spark" />
            <span>+{snippet?.xp || 40} XP</span>
          </span>
        </div>
      </div>

      {/* ── Problem Objective Brief ── */}
      {snippet?.description && (
        <p className="sbc-desc">{snippet.description}</p>
      )}

      {/* ── Target Benchmark Pill ── */}
      <div className="sbc-benchmark-row">
        <Target size={12} className="sbc-bm-icon" />
        <span className="sbc-bm-txt">
          Target Goal: <strong>60+ WPM</strong> &bull; <strong>98% Accuracy</strong>
        </span>
      </div>

      <div className="sbc-divider" />

      {/* ── Mode Segmented Control (Replaces clunky dropdown) ── */}
      <div className="sbc-mode-section">
        <div className="sbc-mode-lbl">PRACTICE MODE</div>
        <div className="sbc-mode-segments">
          <button
            className={`sbc-mode-btn ${mode === 'Free' ? 'active' : ''}`}
            onClick={() => onSelectMode('Free')}
            title="Free typing: Mistakes are tracked without blocking progress"
            id="btn-mode-free"
          >
            Free
          </button>
          <button
            className={`sbc-mode-btn ${mode === 'Strict' ? 'active' : ''}`}
            onClick={() => onSelectMode('Strict')}
            title="Strict mode: All typos must be backspaced & corrected immediately"
            id="btn-mode-strict"
          >
            Strict
          </button>
          <button
            className={`sbc-mode-btn ${mode === 'Timed' ? 'active' : ''}`}
            onClick={() => onSelectMode('Timed')}
            title="Timed mode: 60-second speed benchmark"
            id="btn-mode-timed"
          >
            Timed
          </button>
        </div>
      </div>
    </div>
  );
}
