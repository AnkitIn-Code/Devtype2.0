// src/components/practice/PracticeHeader.jsx
import {
  RotateCcw, Pause, Play, LogOut, Zap,
  Target, Clock, AlertTriangle, ChevronDown
} from 'lucide-react';
import { LANGUAGES, DIFFICULTIES } from '../../data/snippets';

export default function PracticeHeader({
  snippets,
  selectedSnippet,
  onSelectSnippet,
  selectedLang,
  onSelectLang,
  selectedDiff,
  onSelectDiff,
  metrics,
  sessionState, // 'idle' | 'active' | 'paused' | 'completed'
  onRestart,
  onPauseResume,
  onQuit,
}) {
  const isStarted = sessionState === 'active' || sessionState === 'paused';

  return (
    <div className="practice-header">
      {/* ── Top Bar: Selectors & Controls ── */}
      <div className="practice-header-top">
        <div className="practice-selectors">
          {/* Language Selector */}
          <div className="select-pill-wrap">
            <span className="select-prefix">Lang:</span>
            <select
              className="practice-select"
              value={selectedLang}
              onChange={(e) => onSelectLang(e.target.value)}
              id="select-language"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="select-chevron" />
          </div>

          {/* Difficulty Selector */}
          <div className="select-pill-wrap">
            <span className="select-prefix">Diff:</span>
            <select
              className="practice-select"
              value={selectedDiff}
              onChange={(e) => onSelectDiff(e.target.value)}
              id="select-difficulty"
            >
              {DIFFICULTIES.map((diff) => (
                <option key={diff} value={diff}>
                  {diff}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="select-chevron" />
          </div>

          {/* Snippet Selector */}
          <div className="select-pill-wrap snippet-select-wrap">
            <span className="select-prefix">Snippet:</span>
            <select
              className="practice-select snippet-select"
              value={selectedSnippet?.id || ''}
              onChange={(e) => {
                const found = snippets.find((s) => s.id === e.target.value);
                if (found) onSelectSnippet(found);
              }}
              id="select-snippet"
            >
              {snippets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.language})
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="select-chevron" />
          </div>
        </div>

        {/* Action Controls */}
        <div className="practice-header-actions">
          {isStarted && (
            <button
              className={`practice-btn ${sessionState === 'paused' ? 'btn-resume' : 'btn-pause'}`}
              onClick={onPauseResume}
              id="btn-pause-resume"
              title={sessionState === 'paused' ? 'Resume typing (Esc)' : 'Pause typing (Esc)'}
            >
              {sessionState === 'paused' ? (
                <>
                  <Play size={14} fill="currentColor" strokeWidth={0} />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause size={14} strokeWidth={2.2} />
                  <span>Pause</span>
                </>
              )}
            </button>
          )}

          <button
            className="practice-btn btn-restart"
            onClick={onRestart}
            id="btn-restart-snippet"
            title="Restart snippet (⌘R)"
          >
            <RotateCcw size={14} strokeWidth={2.2} />
            <span>Restart</span>
          </button>

          <button
            className="practice-btn btn-quit"
            onClick={onQuit}
            id="btn-quit-practice"
            title="Exit to Dashboard"
          >
            <LogOut size={14} strokeWidth={2.2} />
            <span>Quit</span>
          </button>
        </div>
      </div>

      {/* ── Live Compact Metrics Ribbon ── */}
      <div className="practice-metrics-ribbon">
        {/* Net WPM */}
        <div className="metric-cell" id="metric-wpm">
          <div className="metric-icon metric-icon-blue">
            <Zap size={16} strokeWidth={2.2} />
          </div>
          <div className="metric-text-group">
            <div className="metric-val">
              {metrics.netWpm}
              <span className="metric-unit">WPM</span>
            </div>
            <div className="metric-lbl">
              Net Speed
              {metrics.grossWpm > metrics.netWpm && (
                <span className="metric-gross">({metrics.grossWpm} gross)</span>
              )}
            </div>
          </div>
        </div>

        {/* Accuracy */}
        <div className="metric-cell" id="metric-accuracy">
          <div className="metric-icon metric-icon-green">
            <Target size={16} strokeWidth={2.2} />
          </div>
          <div className="metric-text-group">
            <div className="metric-val">
              {metrics.accuracy}
              <span className="metric-unit">%</span>
            </div>
            <div className="metric-lbl">Accuracy</div>
          </div>
        </div>

        {/* Elapsed Time */}
        <div className="metric-cell" id="metric-time">
          <div className="metric-icon metric-icon-amber">
            <Clock size={16} strokeWidth={2.2} />
          </div>
          <div className="metric-text-group">
            <div className="metric-val">{metrics.formattedTime}</div>
            <div className="metric-lbl">Elapsed Time</div>
          </div>
        </div>

        {/* Errors */}
        <div className={`metric-cell ${metrics.errorCount > 0 ? 'has-errors' : ''}`} id="metric-errors">
          <div className="metric-icon metric-icon-red">
            <AlertTriangle size={16} strokeWidth={2.2} />
          </div>
          <div className="metric-text-group">
            <div className="metric-val">{metrics.errorCount}</div>
            <div className="metric-lbl">Errors Made</div>
          </div>
        </div>

        {/* Status Pill */}
        <div className="metric-status-cell">
          <div className={`session-status-badge status-${sessionState}`}>
            <span className="status-badge-dot" />
            <span>
              {sessionState === 'idle' && 'Ready to Type'}
              {sessionState === 'active' && 'Typing...'}
              {sessionState === 'paused' && 'Paused'}
              {sessionState === 'completed' && 'Completed!'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
