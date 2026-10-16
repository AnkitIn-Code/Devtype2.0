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
        key.startsWith('F') ||
        key === 'Home' ||
        key === 'End' ||
        key === 'PageUp' ||
        key === 'PageDown' ||
        key === 'Insert' ||
        key === 'Delete'
      ) {
        return;
      }

      // Single character input
      if (key.length === 1) {
        e.preventDefault();
        onKeyPress(key);
      }
    },
    [sessionState, onBackspace, onTab, onEnter, onKeyPress, onPhysicalKey]
  );

  const handleContainerClick = () => {
    if (hiddenInputRef.current && sessionState !== 'paused') {
      hiddenInputRef.current.focus();
    }
  };

  if (!tokenizedSnippet) {
    return (
      <div className="editor-loading">
        <Terminal size={24} className="spin-icon" />
        <span>Loading snippet...</span>
      </div>
    );
  }

  const { lines, flatChars } = tokenizedSnippet;

  // Determine which line the cursor is currently on
  const currentLineIndex =
    cursorIndex < flatChars.length
      ? flatChars[cursorIndex]?.lineIndex ?? 0
      : lines.length - 1;

  return (
    <div
      className={`practice-editor-container ${isFocused ? 'is-focused' : 'is-unfocused'} ${
        sessionState === 'paused' ? 'is-paused' : ''
      }`}
      onClick={handleContainerClick}
      ref={containerRef}
      id="code-practice-editor"
    >
      {/* Hidden invisible input for capturing cross-platform keystrokes */}
      <input
        ref={hiddenInputRef}
        type="text"
        className="editor-hidden-input"
        onKeyDown={handleKeyDown}
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        aria-label="Code typing input buffer"
      />

      {/* Editor Window Header Bar */}
      <div className="editor-titlebar">
        <div className="editor-dots">
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
        </div>
        <div className="editor-filename">
          <Terminal size={13} className="editor-lang-icon" />
          <span>{tokenizedSnippet.rawCode ? 'practice_snippet' : 'code'}</span>
        </div>
        <div className="editor-line-indicator">
          Line {currentLineIndex + 1} of {lines.length}
        </div>
      </div>

      {/* Unfocused Overlay Prompt */}
      {!isFocused && sessionState !== 'paused' && sessionState !== 'completed' && (
        <div className="editor-focus-banner" onClick={handleContainerClick}>
          <MousePointerClick size={16} />
          <span>Click to focus editor &amp; continue typing</span>
        </div>
      )}

      {/* Paused Overlay */}
      {sessionState === 'paused' && (
        <div className="editor-paused-overlay">
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

                    let statusClass = 'char-untyped';
                    if (historyItem) {
                      statusClass = historyItem.isCorrect ? 'char-correct' : 'char-incorrect';
                    }

                    // Special rendering for spaces and newlines
                    if (charData.isNewline) {
                      return (
                        <span
                          key={gIdx}
                          className={`char-span ${statusClass} ${isAtCursor ? 'has-cursor' : ''}`}
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
                          className={`char-span char-space ${statusClass} ${isAtCursor ? 'has-cursor' : ''}`}
                          data-idx={gIdx}
                        >
                          {isAtCursor && <span className="editor-caret" aria-hidden="true" />}
                          {/* Subtle dot representation for spaces */}
                          <span className="space-dot">·</span>
                        </span>
                      );
                    }

                    return (
                      <span
                        key={gIdx}
                        className={`char-span token-${charData.tokenType} ${statusClass} ${
                          isAtCursor ? 'has-cursor char-cursor-highlight' : ''
                        }`}
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
