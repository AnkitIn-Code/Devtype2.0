// src/components/practice/CodePracticeEditor.jsx
import { useRef, useEffect, useCallback, useState } from 'react';
import { MousePointerClick, PauseCircle, Terminal, ShieldAlert } from 'lucide-react';
import { supportService } from '../../services/supportService';
import { useAuth } from '../../context/AuthContext';

export default function CodePracticeEditor({
  tokenizedSnippet,
  cursorIndex,
  typedHistory, // Array<{ typedChar: string; isCorrect: boolean }>
  sessionState, // 'idle' | 'active' | 'paused' | 'completed'
  onKeyPress,
  onBackspace,
  onTab,
  onEnter,
  onFocusChange,
  isFocused,
  onPhysicalKey,
  strictErrorPulse = false,
  maskMap = [],
  hintIndex = null,
  onRequestHint,
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ROLE_ADMIN' || user?.role === 'ADMIN' || user?.isAdmin;

  const containerRef = useRef(null);
  const hiddenInputRef = useRef(null);
  const activeLineRef = useRef(null);
  const codeBodyRef = useRef(null);
  const [antiCheatAlert, setAntiCheatAlert] = useState(null);
  const lastKeyTimeRef = useRef(0);
  const suspiciousBurstCountRef = useRef(0);

  const triggerAntiCheat = useCallback((violationType, details) => {
    if (isAdmin) return;
    setAntiCheatAlert({
      violationType,
      details,
      timestamp: new Date().toLocaleTimeString(),
    });
    supportService.reportAntiCheat({
      violationType,
      mode: 'PRACTICE_TEMPLATE',
      details: `Practice snippet "${tokenizedSnippet?.title || 'Snippet'}" - ${details}`,
    });
  }, [tokenizedSnippet, isAdmin]);

  // Auto-focus on mount
  useEffect(() => {
    if (hiddenInputRef.current && sessionState !== 'paused' && sessionState !== 'completed') {
      hiddenInputRef.current.focus();
    }
  }, [sessionState]);

  // When unfocused, typing any key auto-refocuses editor unless focused on a form field
  useEffect(() => {
    if (isFocused || sessionState === 'completed' || sessionState === 'paused') return;

    const handleWindowKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || document.activeElement?.isContentEditable) {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Tab' || e.key === 'Escape') return;

      hiddenInputRef.current?.focus();
      onFocusChange?.(true);
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [isFocused, sessionState, onFocusChange]);

  // Keep active line scrolled smoothly into view inside the editor code body only (prevents page tearing)
  useEffect(() => {
    if (activeLineRef.current && codeBodyRef.current) {
      const codeBody = codeBodyRef.current;
      const activeLine = activeLineRef.current;

      const bodyRect = codeBody.getBoundingClientRect();
      const lineRect = activeLine.getBoundingClientRect();

      // Relative offset of the active line within the code body viewport
      const relativeTop = lineRect.top - bodyRect.top;
      const relativeBottom = lineRect.bottom - bodyRect.top;
      const visibleHeight = bodyRect.height;

      // Keep active line smoothly visible within code body without affecting page scroll
      if (relativeTop < 25) {
        codeBody.scrollTo({
          top: codeBody.scrollTop + relativeTop - 35,
          behavior: 'smooth',
        });
      } else if (relativeBottom > visibleHeight - 35) {
        codeBody.scrollTo({
          top: codeBody.scrollTop + (relativeBottom - visibleHeight) + 35,
          behavior: 'smooth',
        });
      }
    }
  }, [cursorIndex]);

  // Keyboard Event Dispatcher
  const handleKeyDown = useCallback(
    (e) => {
      if (onPhysicalKey) {
        onPhysicalKey(e.code);
      }

      if (e.key === 'F1') {
        e.preventDefault();
        onRequestHint?.();
        return;
      }

      if (antiCheatAlert) {
        return;
      }

      if (e.isTrusted === false) {
        e.preventDefault();
        triggerAntiCheat('SCRIPT_INJECTION', 'Untrusted synthetic keyboard event dispatched via browser automation/script.');
        return;
      }

      if (sessionState === 'paused' || sessionState === 'completed') {
        return;
      }

      // Ignore modifier keys and shortcuts
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      const key = e.key;

      // Real-time burst interval check (>280 WPM with uniform delta < 12ms indicates bot/script injection)
      const now = performance.now();
      const delta = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;
      if (delta < 12 && key.length === 1) {
        suspiciousBurstCountRef.current += 1;
        if (suspiciousBurstCountRef.current > 5) {
          e.preventDefault();
          triggerAntiCheat('SCRIPT_INJECTION', 'Abnormal keystroke cadence: consecutive keystroke interval < 12ms (>500 WPM burst). Automated script detected.');
          return;
        }
      } else {
        suspiciousBurstCountRef.current = 0;
      }

      if (key === 'Backspace') {
        e.preventDefault();
        onBackspace();
        return;
      }

      if (key === 'Tab') {
        e.preventDefault();
        onTab();
        return;
      }

      if (key === 'Enter') {
        e.preventDefault();
        onEnter();
        return;
      }

      // Ignore navigation, functional, and modifier keys
      if (
        key === 'Shift' ||
        key === 'Control' ||
        key === 'Alt' ||
        key === 'Meta' ||
        key === 'CapsLock' ||
        key === 'Escape' ||
        key.startsWith('Arrow') ||
        (key.startsWith('F') && key !== 'F1') ||
        key === 'Home' ||
        key === 'End' ||
        key === 'PageUp' ||
        key === 'PageDown' ||
        key === 'Insert' ||
        key === 'Delete'
      ) {
        return;
      }

      // Standard single character keystroke
      if (key.length === 1) {
        e.preventDefault();
        onKeyPress(key);
      }
    },
    [sessionState, onPhysicalKey, onBackspace, onTab, onEnter, onKeyPress, onRequestHint]
  );

  const lines = tokenizedSnippet?.lines || [];
  const currentLineIndex = tokenizedSnippet?.flatChars?.[cursorIndex]?.lineNumber
    ? tokenizedSnippet.flatChars[cursorIndex].lineNumber - 1
    : 0;

  return (
    <div
      ref={containerRef}
      className={`practice-editor-container ${isFocused ? 'is-focused' : 'is-unfocused'}`}
      onClick={() => {
        hiddenInputRef.current?.focus();
        onFocusChange?.(true);
      }}
    >
      {/* Invisible textarea capturing all keyboard events */}
      <textarea
        ref={hiddenInputRef}
        className="editor-hidden-input"
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        onKeyDown={handleKeyDown}
        onPaste={(e) => {
          e.preventDefault();
          triggerAntiCheat('CLIPBOARD_PASTE', 'Attempted to paste clipboard code directly into code practice editor buffer.');
        }}
        onFocus={() => onFocusChange?.(true)}
        onBlur={() => onFocusChange?.(false)}
        aria-label="Code practice input buffer"
      />

      {/* Anti-Cheat Alert Banner */}
      {antiCheatAlert && (
        <div
          className="anti-cheat-alert-banner animate-fade-in"
          style={{
            padding: '12px 16px',
            margin: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            color: '#EF4444',
            fontSize: '0.88rem',
            fontWeight: 600,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>
              Anti-Cheat Triggered: {antiCheatAlert.violationType} detected ({antiCheatAlert.details}). Session halted and moderation ticket filed to admin.
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setAntiCheatAlert(null)}
            style={{ fontSize: '0.75rem', padding: '3px 8px', borderColor: '#EF4444', color: '#EF4444' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Unfocused Banner Overlay */}
      {!isFocused && sessionState !== 'completed' && sessionState !== 'paused' && (
        <div
          className="editor-focus-overlay animate-fade-in"
          onClick={(e) => {
            e.stopPropagation();
            hiddenInputRef.current?.focus();
            onFocusChange?.(true);
          }}
        >
          <div className="focus-prompt-pill">
            <MousePointerClick size={18} className="prompt-icon animate-pulse" />
            <div className="focus-prompt-text">
              <strong>Click here to continue</strong>
              <span>or press any key to resume typing</span>
            </div>
          </div>
        </div>
      )}

      {/* Paused State Overlay */}
      {sessionState === 'paused' && (
        <div className="editor-paused-backdrop animate-fade-in">
          <PauseCircle size={42} className="paused-icon" />
          <h3>Practice Paused</h3>
          <p>Press <strong>Resume</strong> or hit <strong>Esc</strong> to continue</p>
        </div>
      )}

      {/* Main Code View with Line Numbers */}
      <div className="editor-code-body" ref={codeBodyRef}>
        <div className="editor-lines-wrapper">
          {lines.map((line, lIdx) => {
            const isCurrentLine = lIdx === currentLineIndex;

            return (
              <div
                key={line.lineNumber}
                ref={isCurrentLine ? activeLineRef : null}
                className={`editor-row ${isCurrentLine ? 'active-row' : ''}`}
              >
                {/* Line number gutter */}
                <div className="editor-ln-gutter" aria-hidden="true">
                  {line.lineNumber}
                </div>

                {/* Characters of the line */}
                <div className="editor-line-tokens">
                  {line.chars.map((charData) => {
                    const gIdx = charData.globalIndex;
                    const isAtCursor = gIdx === cursorIndex;
                    const historyItem = typedHistory[gIdx];
                    const isMasked = maskMap && maskMap[gIdx] && (!historyItem || !historyItem.isCorrect);
                    const isHinted = hintIndex === gIdx;

                    let statusClass = 'char-untyped';
                    if (historyItem) {
                      statusClass = historyItem.isCorrect ? 'char-correct' : 'char-incorrect';
                    }

                    // Special rendering for spaces and newlines
                    if (charData.isNewline) {
                      return (
                        <span
                          key={gIdx}
                          className={`char-span ${statusClass} ${isAtCursor ? 'has-cursor' : ''} ${isAtCursor && strictErrorPulse ? 'char-strict-error' : ''}`}
                          data-idx={gIdx}
                        >
                          {isAtCursor && <span className="editor-caret" aria-hidden="true" />}
                          <span className="char-newline-symbol" title="Return (Enter)">
                            ↵
                          </span>
                        </span>
                      );
                    }

                    if (charData.isWhitespace) {
                      return (
                        <span
                          key={gIdx}
                          className={`char-span char-space ${statusClass} ${isAtCursor ? 'has-cursor' : ''} ${isAtCursor && strictErrorPulse ? 'char-strict-error' : ''}`}
                          data-idx={gIdx}
                        >
                          {isAtCursor && <span className="editor-caret" aria-hidden="true" />}
                          {/* Subtle dot representation for spaces */}
                          <span className="space-dot">·</span>
                        </span>
                      );
                    }

                    // Cloze / Blind masked character
                    if (isMasked) {
                      return (
                        <span
                          key={gIdx}
                          className={`char-span char-masked ${isHinted ? 'char-hinted' : ''} ${statusClass} ${
                            isAtCursor ? 'has-cursor char-cursor-highlight' : ''
                          } ${isAtCursor && strictErrorPulse ? 'char-strict-error' : ''}`}
                          data-idx={gIdx}
                        >
                          {isAtCursor && <span className="editor-caret" aria-hidden="true" />}
                          {isHinted ? charData.char : '·'}
                        </span>
                      );
                    }

                    return (
                      <span
                        key={gIdx}
                        className={`char-span token-${charData.tokenType} ${statusClass} ${
                          isAtCursor ? 'has-cursor char-cursor-highlight' : ''
                        } ${isAtCursor && strictErrorPulse ? 'char-strict-error' : ''}`}
                        data-idx={gIdx}
                      >
                        {isAtCursor && <span className="editor-caret" aria-hidden="true" />}
                        {charData.char}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
