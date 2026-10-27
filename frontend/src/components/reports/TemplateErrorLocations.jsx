// src/components/reports/TemplateErrorLocations.jsx
import React, { useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, Code2, MapPin, Hash, Sparkles } from 'lucide-react';

export default function TemplateErrorLocations({
  code = '',
  language = 'javascript',
  errorLocations = [],
  syntaxErrors = null,
}) {
  const [selectedErrorIdx, setSelectedErrorIdx] = useState(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');

  // Parse code into indexed lines and characters
  const codeLines = useMemo(() => {
    if (!code) return [];
    const rawLines = code.replace(/\r\n/g, '\n').split('\n');
    let runningGlobalIndex = 0;

    return rawLines.map((lineText, lineIdx) => {
      const chars = [];
      for (let colIdx = 0; colIdx < lineText.length; colIdx++) {
        chars.push({
          char: lineText[colIdx],
          globalIndex: runningGlobalIndex,
          line: lineIdx + 1,
          col: colIdx + 1,
        });
        runningGlobalIndex++;
      }
      // account for newline character
      runningGlobalIndex++;
      return {
        lineNumber: lineIdx + 1,
        lineText,
        chars,
      };
    });
  }, [code]);

  // Fast map from globalIndex -> error object
  const errorIndexMap = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(errorLocations)) return map;
    errorLocations.forEach((err, idx) => {
      if (err.index != null) {
        map.set(err.index, { ...err, errorOrder: idx + 1 });
      }
    });
    return map;
  }, [errorLocations]);

  // Categorize an error character
  const classifyChar = (ch) => {
    if (!ch) return 'identifiers';
    if ('{}()[]<>'.includes(ch)) return 'brackets';
    if (';:,."\'=+-*/%&|^!~?@#$\\`'.includes(ch)) return 'punctuation';
    if (' \t\n\r'.includes(ch)) return 'whitespace';
    return 'identifiers';
  };

  // Filtered error locations
  const filteredErrorLocations = useMemo(() => {
    if (!Array.isArray(errorLocations)) return [];
    if (activeCategoryFilter === 'ALL') return errorLocations;
    return errorLocations.filter((err) => {
      const cat = classifyChar(err.expected).toUpperCase();
      return cat === activeCategoryFilter;
    });
  }, [errorLocations, activeCategoryFilter]);

  // Derived category counts
  const categoryCounts = useMemo(() => {
    const counts = { ALL: errorLocations.length, BRACKETS: 0, PUNCTUATION: 0, IDENTIFIERS: 0, WHITESPACE: 0 };
    errorLocations.forEach((err) => {
      const cat = classifyChar(err.expected).toUpperCase();
      if (counts[cat] !== undefined) {
        counts[cat]++;
      }
    });
    return counts;
  }, [errorLocations]);

  return (
    <div className="template-error-locations-container">
      {/* ── Section Header ── */}
      <div className="tpl-error-hd">
        <div className="tpl-error-hd-left">
          <div className="tpl-error-icon-wrap">
            <Code2 size={18} className="tpl-code-icon" />
          </div>
          <div>
            <h4 className="tpl-error-title">Template Code & Error Positions</h4>
            <p className="tpl-error-sub">
              Interactive code diff highlighting exact character positions where typing mistakes occurred.
            </p>
          </div>
        </div>

        {/* Category Filters */}
        {errorLocations.length > 0 && (
          <div className="tpl-error-filter-pills">
            {['ALL', 'PUNCTUATION', 'BRACKETS', 'IDENTIFIERS', 'WHITESPACE'].map((cat) => (
              <button
                key={cat}
                type="button"
                className={`tpl-cat-pill ${activeCategoryFilter === cat ? 'active' : ''}`}
                onClick={() => setActiveCategoryFilter(cat)}
              >
                <span>{cat.charAt(0) + cat.slice(1).toLowerCase()}</span>
                <span className="tpl-cat-count">{categoryCounts[cat] || 0}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Flawless State (0 Errors) ── */}
      {errorLocations.length === 0 ? (
        <div className="flawless-template-banner">
          <div className="flawless-spark-wrap">
            <Sparkles size={24} className="flawless-spark-icon" />
          </div>
          <div className="flawless-text-block">
            <h5 className="flawless-heading">100% Perfect Keystroke Precision</h5>
            <p className="flawless-detail">
              No typing errors occurred in this template. All brackets, indentation, and syntax symbols were
              executed flawlessly on the first strike.
            </p>
          </div>
        </div>
      ) : null}

      {/* ── Code Viewer with Highlighted Error Spots ── */}
      {codeLines.length > 0 ? (
        <div className="tpl-code-viewer-frame">
          <div className="tpl-code-viewer-bar">
            <span className="code-lang-tag">{language}</span>
            <span className="code-error-summary">
              {errorLocations.length} error{errorLocations.length === 1 ? '' : 's'} across {codeLines.length} lines
            </span>
          </div>

          <div className="tpl-code-lines-scroll">
            <table className="tpl-code-table">
              <tbody>
                {codeLines.map((line) => (
                  <tr key={line.lineNumber} className="tpl-code-line-tr">
                    <td className="tpl-line-number-cell">{line.lineNumber}</td>
                    <td className="tpl-line-content-cell">
                      {line.chars.map((charObj) => {
                        const err = errorIndexMap.get(charObj.globalIndex);
                        const isErr = !!err;
                        const isSelected = selectedErrorIdx === charObj.globalIndex;

                        const displayChar =
                          charObj.char === ' ' ? '·' : charObj.char === '\t' ? '—' : charObj.char;

                        if (isErr) {
                          const expectedDisp = err.expected === ' ' ? 'Space' : err.expected;
                          const typedDisp = err.typed === ' ' ? 'Space' : err.typed;

                          return (
                            <span
                              key={charObj.globalIndex}
                              className={`tpl-error-char ${isSelected ? 'selected' : ''}`}
                              onClick={() => setSelectedErrorIdx(charObj.globalIndex)}
                              title={`Line ${err.line}, Col ${err.col}: Expected '${expectedDisp}' but typed '${typedDisp}'`}
                            >
                              {displayChar}
                              <span className="tpl-error-marker">
                                <span className="marker-dot" />
                              </span>
                            </span>
                          );
                        }

                        return (
                          <span key={charObj.globalIndex} className="tpl-char-normal">
                            {displayChar}
                          </span>
                        );
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* ── Error Locations Details Roster ── */}
      {errorLocations.length > 0 && (
        <div className="tpl-error-roster-section">
          <div className="roster-hd">
            <span className="roster-title">
              <MapPin size={14} /> Chronological Mistake Log ({filteredErrorLocations.length} items)
            </span>
            <span className="roster-sub">Click any row to pinpoint in code editor above</span>
          </div>

          <div className="roster-grid">
            {filteredErrorLocations.map((err, idx) => {
              const isSelected = selectedErrorIdx === err.index;
              const cat = classifyChar(err.expected);
              const expChar = err.expected === ' ' ? 'Space' : err.expected === '\n' ? 'Enter' : err.expected;
              const typChar = err.typed === ' ' ? 'Space' : err.typed === '\n' ? 'Enter' : err.typed;

              return (
                <div
                  key={err.index != null ? `${err.index}-${idx}` : idx}
                  className={`roster-item-card ${isSelected ? 'active-focus' : ''}`}
                  onClick={() => setSelectedErrorIdx(err.index)}
                >
                  <div className="roster-card-top">
                    <span className="roster-pos-badge">
                      <Hash size={11} /> Line {err.line || 1}, Col {err.col || 1}
                    </span>
                    <span className={`roster-cat-tag cat-${cat}`}>{cat}</span>
                  </div>

                  <div className="roster-chars-row">
                    <div className="roster-char-item expected">
                      <span className="char-label">Expected</span>
                      <kbd className="char-kbd">{expChar}</kbd>
                    </div>

                    <span className="char-arrow">➔</span>

                    <div className="roster-char-item typed">
                      <span className="char-label">Typed</span>
                      <kbd className="char-kbd error">{typChar}</kbd>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
