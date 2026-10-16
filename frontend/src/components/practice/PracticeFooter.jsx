// src/components/practice/PracticeFooter.jsx
import { Code2, FileText } from 'lucide-react';

export default function PracticeFooter({
  selectedSnippet,
  metrics,
  cursorIndex,
  totalChars,
}) {
  return (
    <div className="practice-footer">
      {/* ── Top Row: Progress Bar & Snippet Meta ── */}
      <div className="footer-progress-panel">
        <div className="progress-top-row">
          <div className="progress-snippet-info">
            <span className="badge badge-teal">
              <Code2 size={13} />
              {selectedSnippet?.language || 'Code'}
            </span>
            <span className="badge badge-indigo">
              {selectedSnippet?.difficulty || 'Practice'}
            </span>
            <span className="footer-snippet-title">{selectedSnippet?.title}</span>
          </div>

          <div className="progress-counts">
            <span className="count-current">{cursorIndex}</span>
            <span className="count-divider">/</span>
            <span className="count-total">{totalChars} chars</span>
            <span className="count-percent">({metrics.progressPercent}%)</span>
          </div>
        </div>

        {/* Liquid Glass Progress Bar */}
        <div className="practice-prog-track">
          <div
            className="practice-prog-fill"
            style={{ width: `${metrics.progressPercent}%` }}
          />
        </div>
      </div>

      {/* ── Bottom Row: Snippet Description & Keyboard Tips ── */}
      <div className="footer-info-row">
        {/* Left: Snippet Brief Description */}
        <div className="footer-desc-card">
          <FileText size={15} className="footer-icon-muted" />
          <span className="footer-desc-text">
            {selectedSnippet?.description || 'Type the snippet above with maximum accuracy and speed.'}
          </span>
        </div>

        {/* Right: Keyboard Shortcuts Tips */}
        <div className="footer-tips-card">
          <div className="tip-item">
            <kbd className="tip-kbd">Tab</kbd>
            <span className="tip-text">Indent / match spaces</span>
          </div>
          <div className="tip-item">
            <kbd className="tip-kbd">↵ Enter</kbd>
            <span className="tip-text">Next line</span>
          </div>
          <div className="tip-item">
            <kbd className="tip-kbd">⌫ Backspace</kbd>
            <span className="tip-text">Correct mistake</span>
          </div>
          <div className="tip-item">
            <kbd className="tip-kbd">Esc</kbd>
            <span className="tip-text">Pause</span>
          </div>
        </div>
      </div>
    </div>
  );
}
