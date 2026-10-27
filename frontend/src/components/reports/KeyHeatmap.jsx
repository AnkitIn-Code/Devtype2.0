// src/components/reports/KeyHeatmap.jsx
import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Flame, Keyboard, Info } from 'lucide-react';

/* ================================================================
   KEYBOARD ROW DEFINITIONS
   ================================================================ */
const ROW_1 = [
  { code: 'Backquote', label: '`', shift: '~' },
  { code: 'Digit1', label: '1', shift: '!' },
  { code: 'Digit2', label: '2', shift: '@' },
  { code: 'Digit3', label: '3', shift: '#' },
  { code: 'Digit4', label: '4', shift: '$' },
  { code: 'Digit5', label: '5', shift: '%' },
  { code: 'Digit6', label: '6', shift: '^' },
  { code: 'Digit7', label: '7', shift: '&' },
  { code: 'Digit8', label: '8', shift: '*' },
  { code: 'Digit9', label: '9', shift: '(' },
  { code: 'Digit0', label: '0', shift: ')' },
  { code: 'Minus', label: '-', shift: '_' },
  { code: 'Equal', label: '=', shift: '+' },
  { code: 'Backspace', label: 'Backspace', wide: 'w-backspace' },
];

const ROW_2 = [
  { code: 'Tab', label: 'Tab', wide: 'w-tab' },
  { code: 'KeyQ', label: 'Q' },
  { code: 'KeyW', label: 'W' },
  { code: 'KeyE', label: 'E' },
  { code: 'KeyR', label: 'R' },
  { code: 'KeyT', label: 'T' },
  { code: 'KeyY', label: 'Y' },
  { code: 'KeyU', label: 'U' },
  { code: 'KeyI', label: 'I' },
  { code: 'KeyO', label: 'O' },
  { code: 'KeyP', label: 'P' },
  { code: 'BracketLeft', label: '[', shift: '{' },
  { code: 'BracketRight', label: ']', shift: '}' },
  { code: 'Backslash', label: '\\', shift: '|', wide: 'w-backslash' },
];

const ROW_3 = [
  { code: 'CapsLock', label: 'Caps', wide: 'w-caps' },
  { code: 'KeyA', label: 'A' },
  { code: 'KeyS', label: 'S' },
  { code: 'KeyD', label: 'D' },
  { code: 'KeyF', label: 'F' },
  { code: 'KeyG', label: 'G' },
  { code: 'KeyH', label: 'H' },
  { code: 'KeyJ', label: 'J' },
  { code: 'KeyK', label: 'K' },
  { code: 'KeyL', label: 'L' },
  { code: 'Semicolon', label: ';', shift: ':' },
  { code: 'Quote', label: "'", shift: '"' },
  { code: 'Enter', label: 'Enter', wide: 'w-enter' },
];

const ROW_4 = [
  { code: 'ShiftLeft', label: 'Shift', wide: 'w-shift-l' },
  { code: 'KeyZ', label: 'Z' },
  { code: 'KeyX', label: 'X' },
  { code: 'KeyC', label: 'C' },
  { code: 'KeyV', label: 'V' },
  { code: 'KeyB', label: 'B' },
  { code: 'KeyN', label: 'N' },
  { code: 'KeyM', label: 'M' },
  { code: 'Comma', label: ',', shift: '<' },
  { code: 'Period', label: '.', shift: '>' },
  { code: 'Slash', label: '/', shift: '?' },
  { code: 'ShiftRight', label: 'Shift', wide: 'w-shift-r' },
];

const ROW_5 = [
  { code: 'ControlLeft', label: 'Ctrl', wide: 'w-mod' },
  { code: 'AltLeft', label: 'Alt', wide: 'w-mod' },
  { code: 'Space', label: 'Space', wide: 'w-space' },
  { code: 'AltRight', label: 'Alt', wide: 'w-mod' },
  { code: 'ControlRight', label: 'Ctrl', wide: 'w-mod' },
];

const CODE_SYMBOLS_ROW = [
  { char: '{', label: '{' },
  { char: '}', label: '}' },
  { char: '(', label: '(' },
  { char: ')', label: ')' },
  { char: '[', label: '[' },
  { char: ']', label: ']' },
  { char: ';', label: ';' },
  { char: ':', label: ':' },
  { char: '=', label: '=' },
  { char: '+', label: '+' },
  { char: '-', label: '-' },
  { char: '*', label: '*' },
  { char: '/', label: '/' },
  { char: '<', label: '<' },
  { char: '>', label: '>' },
  { char: '"', label: '"' },
  { char: "'", label: "'" },
  { char: '!', label: '!' },
  { char: '&', label: '&' },
  { char: '|', label: '|' },
];

export default function KeyHeatmap({ keyErrorMap = {}, totalErrors = 0 }) {
  const [activeHoverKey, setActiveHoverKey] = useState(null);

  // Normalize key errors into a fast lookup map: char -> { count, typedMap }
  const normalizedKeyStats = useMemo(() => {
    const stats = {};
    if (!keyErrorMap || typeof keyErrorMap !== 'object') return stats;

    Object.entries(keyErrorMap).forEach(([char, val]) => {
      if (typeof val === 'number') {
        stats[char] = { char, count: val, typedMap: {} };
      } else if (val && typeof val === 'object') {
        stats[char] = {
          char,
          count: val.count || 0,
          typedMap: val.typedMap || val.typedChars || {},
        };
      }
    });

    return stats;
  }, [keyErrorMap]);

  // Aggregate errors for a keyboard key definition (combining primary, shift, upper, lower)
  const getKeyErrorData = (keyDef) => {
    let count = 0;
    const typedCombined = {};

    const candidates = [];
    if (keyDef.char) candidates.push(keyDef.char);
    if (keyDef.label) {
      if (keyDef.label === 'Space') candidates.push(' ');
      else {
        candidates.push(keyDef.label);
        candidates.push(keyDef.label.toLowerCase());
      }
    }
    if (keyDef.shift) candidates.push(keyDef.shift);

    candidates.forEach((ch) => {
      if (normalizedKeyStats[ch]) {
        count += normalizedKeyStats[ch].count;
        Object.entries(normalizedKeyStats[ch].typedMap || {}).forEach(([tChar, tCount]) => {
          typedCombined[tChar] = (typedCombined[tChar] || 0) + tCount;
        });
      }
    });

    return { count, typedMap: typedCombined };
  };

  // Ranked problem keys list (top 8)
  const topMissedKeys = useMemo(() => {
    return Object.values(normalizedKeyStats)
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [normalizedKeyStats]);

  const totalCalculatedErrors = useMemo(() => {
    const sum = Object.values(normalizedKeyStats).reduce((acc, curr) => acc + curr.count, 0);
    return Math.max(sum, totalErrors || 0);
  }, [normalizedKeyStats, totalErrors]);

  // Render a single key on the keyboard
  const renderKey = (keyDef) => {
    const { count, typedMap } = getKeyErrorData(keyDef);
    let heatClass = 'key-heat-none';
    if (count === 1) heatClass = 'key-heat-low';
    else if (count === 2) heatClass = 'key-heat-medium';
    else if (count >= 3) heatClass = 'key-heat-high';

    const isHovered = activeHoverKey?.label === keyDef.label;

    return (
      <div
        key={keyDef.code || keyDef.char || keyDef.label}
        className={`keyboard-key ${keyDef.wide || ''} ${heatClass} ${isHovered ? 'key-active' : ''}`}
        onMouseEnter={() =>
          setActiveHoverKey({
            label: keyDef.label,
            shift: keyDef.shift,
            count,
            typedMap,
          })
        }
        onMouseLeave={() => setActiveHoverKey(null)}
      >
        {keyDef.shift && <span className="key-shift-char">{keyDef.shift}</span>}
        <span className="key-primary-char">{keyDef.label}</span>
        {count > 0 && (
          <span className="key-error-badge" title={`${count} mistake${count > 1 ? 's' : ''}`}>
            {count}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="key-heatmap-container">
      {/* ── Heatmap Header & Metrics Bar ── */}
      <div className="heatmap-header">
        <div className="heatmap-header-left">
          <div className="heatmap-icon-wrap">
            <Flame size={18} className="heatmap-flame-icon" />
          </div>
          <div>
            <h4 className="heatmap-title">Keystroke Error Heatmap</h4>
            <p className="heatmap-sub">
              Visual diagnostic of mis-typed keys, density of errors, and problem key rankings.
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="heatmap-legend">
          <div className="legend-chip">
            <span className="legend-color-dot dot-none" />
            <span>0 Misses</span>
          </div>
          <div className="legend-chip">
            <span className="legend-color-dot dot-low" />
            <span>1 Miss</span>
          </div>
          <div className="legend-chip">
            <span className="legend-color-dot dot-medium" />
            <span>2 Misses</span>
          </div>
          <div className="legend-chip">
            <span className="legend-color-dot dot-high" />
            <span>3+ Misses</span>
          </div>
        </div>
      </div>

      {/* ── Interactive Keyboard Frame ── */}
      <div className="heatmap-keyboard-frame">
        <div className="keyboard-row">{ROW_1.map(renderKey)}</div>
        <div className="keyboard-row">{ROW_2.map(renderKey)}</div>
        <div className="keyboard-row">{ROW_3.map(renderKey)}</div>
        <div className="keyboard-row">{ROW_4.map(renderKey)}</div>
        <div className="keyboard-row">{ROW_5.map(renderKey)}</div>

        {/* Code Symbols Tray */}
        <div className="keyboard-symbols-tray">
          <span className="symbols-tray-label">Coding Syntax Keys:</span>
          <div className="symbols-keys-row">
            {CODE_SYMBOLS_ROW.map((sym) => {
              const err = getKeyErrorData(sym);
              let symHeat = 'key-heat-none';
              if (err.count === 1) symHeat = 'key-heat-low';
              else if (err.count === 2) symHeat = 'key-heat-medium';
              else if (err.count >= 3) symHeat = 'key-heat-high';

              return (
                <div
                  key={sym.char}
                  className={`keyboard-key key-symbol ${symHeat}`}
                  onMouseEnter={() =>
                    setActiveHoverKey({
                      label: sym.label,
                      count: err.count,
                      typedMap: err.typedMap,
                    })
                  }
                  onMouseLeave={() => setActiveHoverKey(null)}
                >
                  <span className="key-primary-char">{sym.label}</span>
                  {err.count > 0 && <span className="key-error-badge">{err.count}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Key Hover Info Banner */}
        {activeHoverKey && (
          <div className="key-hover-banner">
            <Info size={14} className="hover-banner-icon" />
            <span>
              Key <kbd>{activeHoverKey.label}</kbd>: <strong>{activeHoverKey.count} error(s)</strong>
              {Object.keys(activeHoverKey.typedMap || {}).length > 0 && (
                <>
                  {' — mis-typed as: '}
                  {Object.entries(activeHoverKey.typedMap)
                    .map(([tChar, cnt]) => `"${tChar === ' ' ? 'Space' : tChar}" (${cnt}x)`)
                    .join(', ')}
                </>
              )}
            </span>
          </div>
        )}
      </div>

      {/* ── Top Missed Keys Ranking Cards ── */}
      <div className="heatmap-ranked-section">
        <div className="ranked-section-hd">
          <span className="ranked-section-title">
            <AlertCircle size={14} /> Problem Keys Breakdown
          </span>
          <span className="ranked-section-count">
            {totalCalculatedErrors} total keystroke errors
          </span>
        </div>

        {topMissedKeys.length === 0 ? (
          <div className="heatmap-flawless-card">
            <CheckCircle size={20} color="#10B981" />
            <div>
              <div className="flawless-title">Zero Keystroke Errors!</div>
              <div className="flawless-sub">Every key was typed with 100% precision throughout this template.</div>
            </div>
          </div>
        ) : (
          <div className="heatmap-ranked-grid">
            {topMissedKeys.map((item, idx) => {
              const pct = totalCalculatedErrors > 0 ? Math.round((item.count / totalCalculatedErrors) * 100) : 0;
              const typedList = Object.entries(item.typedMap || {});
              const displayChar = item.char === ' ' ? 'Space' : item.char === '\n' ? 'Enter' : item.char;

              return (
                <div key={item.char || idx} className="ranked-key-card">
                  <div className="ranked-key-top">
                    <div className="ranked-key-badge">
                      <kbd className="ranked-kbd">{displayChar}</kbd>
                      <span className="ranked-index">#{idx + 1}</span>
                    </div>
                    <span className="ranked-error-count">
                      {item.count} {item.count === 1 ? 'miss' : 'misses'}
                    </span>
                  </div>

                  <div className="ranked-bar-track">
                    <div
                      className="ranked-bar-fill"
                      style={{
                        width: `${Math.min(100, Math.max(10, pct))}%`,
                        background: item.count >= 3 ? '#EF4444' : item.count === 2 ? '#F97316' : '#F59E0B',
                      }}
                    />
                  </div>

                  <div className="ranked-key-footer">
                    <span className="ranked-pct">{pct}% of total mistakes</span>
                    {typedList.length > 0 && (
                      <span className="ranked-typed-as">
                        Typed instead: {typedList.map(([c, n]) => `"${c === ' ' ? 'Space' : c}"`).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
