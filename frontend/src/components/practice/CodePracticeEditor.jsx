// src/components/practice/CodePracticeEditor.jsx
import { useRef, useEffect, useCallback } from 'react';
import { MousePointerClick, PauseCircle, Terminal } from 'lucide-react';

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
  const containerRef = useRef(null);
  const hiddenInputRef = useRef(null);
  const activeLineRef = useRef(null);
  const codeBodyRef = useRef(null);

  // Auto-focus on mount
  useEffect(() => {
    if (hiddenInputRef.current && sessionState !== 'paused' && sessionState !== 'completed') {
      hiddenInputRef.current.focus();
    }
  }, [sessionState]);

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

      if (sessionState === 'paused' || sessionState === 'completed') {
        return;
      }

      // Ignore modifier keys and shortcuts
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      const key = e.key;

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
      className={`practice-editor-container ${!isFocused ? 'editor-unfocused' : ''}`}
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
        onFocus={() => onFocusChange?.(true)}
        onBlur={() => onFocusChange?.(false)}
        aria-label="Code practice input buffer"
      />

      {/* Unfocused Banner Overlay */}
      {!isFocused && sessionState !== 'completed' && (
        <div className="editor-focus-overlay animate-fade-in">
          <div className="focus-prompt-pill">
            <MousePointerClick size={16} className="prompt-icon" />
            <span>Click anywhere or press any key to focus editor</span>
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
