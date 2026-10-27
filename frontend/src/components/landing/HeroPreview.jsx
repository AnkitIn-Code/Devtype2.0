// src/components/landing/HeroPreview.jsx
import { useState, useEffect } from 'react';
import { Zap, Target, Flame, Code2, Terminal, CheckCircle2 } from 'lucide-react';

const PREVIEW_CODE = [
  {
    ln: 1,
    tokens: [
      { text: 'class', type: 't-kw' },
      { text: ' ', type: '' },
      { text: 'LRUCache', type: 't-ty' },
      { text: ' {', type: 't-pu' },
    ],
  },
  {
    ln: 2,
    tokens: [
      { text: '    unordered_map', type: 't-ty' },
      { text: '<', type: 't-pu' },
      { text: 'int', type: 't-ty' },
      { text: ', ', type: 't-pu' },
      { text: 'list', type: 't-ty' },
      { text: '<pair<int, int>>::iterator> ', type: 't-pu' },
      { text: 'cache', type: 't-va' },
      { text: ';', type: 't-pu' },
    ],
  },
  {
    ln: 3,
    tokens: [
      { text: '    int', type: 't-ty' },
      { text: ' capacity;', type: 't-va' },
    ],
  },
  {
    ln: 4,
    tokens: [
      { text: 'public:', type: 't-kw' },
    ],
  },
  {
    ln: 5,
    tokens: [
      { text: '    int', type: 't-ty' },
      { text: ' ', type: '' },
      { text: 'get', type: 't-va' },
      { text: '(', type: 't-pu' },
      { text: 'int', type: 't-ty' },
      { text: ' key) {', type: 't-pu' },
    ],
  },
  {
    ln: 6,
    tokens: [
      { text: '        if', type: 't-kw' },
      { text: ' (!cache.count(key)) ', type: 't-pu' },
      { text: 'return', type: 't-kw' },
      { text: ' -1;', type: 't-nu' },
    ],
  },
  {
    ln: 7,
    tokens: [
      { text: '        return', type: 't-kw' },
      { text: ' cache[key]->second;', type: 't-va' },
    ],
  },
  {
    ln: 8,
    tokens: [
      { text: '    }', type: 't-pu' },
    ],
  },
  {
    ln: 9,
    tokens: [
      { text: '};', type: 't-pu' },
    ],
  },
];

export default function HeroPreview() {
  const [activeLine, setActiveLine] = useState(6);
  const [wpm, setWpm] = useState(82);

  // Subtle live cadence oscillation
  useEffect(() => {
    const interval = setInterval(() => {
      setWpm((prev) => (prev >= 88 ? 79 : prev + 1));
      setActiveLine((l) => (l === 6 ? 7 : 6));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hero-preview-window">
      {/* macOS Window Title Bar */}
      <div className="hero-preview-titlebar">
        <div className="hero-traffic-lights" aria-hidden="true">
          <span className="tl tl-close" />
          <span className="tl tl-minimize" />
          <span className="tl tl-maximize" />
        </div>
        <div className="hero-preview-tab">
          <Code2 size={13} color="var(--brand)" />
          <span className="hero-preview-filename">LRUCache.cpp</span>
          <span className="badge badge-teal" style={{ fontSize: '0.72rem', padding: '1px 7px' }}>
            C++
          </span>
        </div>
        <div className="hero-preview-hint">
          <Terminal size={12} />
          <span>Interactive Engine</span>
        </div>
      </div>

      {/* Real-time Telemetry Bar */}
      <div className="hero-telemetry-strip">
        <div className="hero-telemetry-item">
          <Zap size={14} className="hero-icon-rose" />
          <div className="hero-tel-label">WPM</div>
          <div className="hero-tel-value">{wpm}</div>
        </div>
        <div className="hero-telemetry-item">
          <Target size={14} className="hero-icon-emerald" />
          <div className="hero-tel-label">Accuracy</div>
          <div className="hero-tel-value">99.4%</div>
        </div>
        <div className="hero-telemetry-item">
          <Flame size={14} className="hero-icon-amber" />
          <div className="hero-tel-label">Streak</div>
          <div className="hero-tel-value">7 Days</div>
        </div>
        <div className="hero-telemetry-item" style={{ marginLeft: 'auto' }}>
          <CheckCircle2 size={14} color="#059669" />
          <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>0 Syntax Errors</span>
        </div>
      </div>

      {/* Code Editor Body */}
      <div className="hero-code-editor">
        {PREVIEW_CODE.map((row) => {
          const isCurrent = row.ln === activeLine;
          return (
            <div
              key={row.ln}
              className={`hero-code-line ${isCurrent ? 'line-active' : ''}`}
            >
              <span className="hero-ln">{row.ln}</span>
              <span className="hero-tokens">
                {row.tokens.map((tok, i) => (
                  <span key={i} className={tok.type}>
                    {tok.text}
                  </span>
                ))}
                {isCurrent && <span className="hero-typing-caret" />}
              </span>
            </div>
          );
        })}
      </div>

      {/* Editor Status Footer */}
      <div className="hero-editor-footer">
        <div className="hero-status-pill">
          <span className="chip-dot" />
          <span>Ready to Practice</span>
        </div>
        <span className="hero-editor-footer-sub">
          UTF-8 · C++20 · Zero Latency Keystrokes
        </span>
      </div>
    </div>
  );
}
