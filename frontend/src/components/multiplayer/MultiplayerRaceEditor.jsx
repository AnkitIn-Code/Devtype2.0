import { useState, useEffect, useRef } from 'react';
import { Clock, Send, LogOut, Trophy, MessageSquare } from 'lucide-react';

export default function MultiplayerRaceEditor({
  room,
  me,
  user,
  send,
  onLeave,
  isRanked = false,
}) {
  const target = room?.target || '';
  const [input, setInput] = useState(() => me?.input || '');
  const [totalKeystrokes, setTotalKeystrokes] = useState(() => me?.input?.length || 0);
  const [mistakesCount, setMistakesCount] = useState(() => me?.mistakes || 0);
  const [chatMessage, setChatMessage] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [localChats, setLocalChats] = useState([]);
  const [countdown, setCountdown] = useState(null);

  const inputRef = useRef(null);
  const sequenceRef = useRef(me?.sequence || 0);
  const timerRef = useRef(null);

  // Sync typing progress and sequence if me updates from server
  useEffect(() => {
    if (me?.input && !input) {
      setInput(me.input);
    }
    if (me?.sequence != null && me.sequence > sequenceRef.current) {
      sequenceRef.current = me.sequence;
    }
  }, [me?.input, me?.sequence]);

  // Auto-ready in ranked mode if room is in READY state
  useEffect(() => {
    if (room?.state === 'READY' && isRanked && !me?.ready) {
      send('READY', {});
    }
  }, [room?.state, isRanked, me?.ready, send]);

  // Countdown timer tracking
  useEffect(() => {
    if (room?.state === 'COUNTDOWN') {
      const calc = () => {
        const remaining = Math.max(0, Math.ceil(((room?.startsAt || Date.now() + 3500) - Date.now()) / 1000));
        setCountdown(remaining);
      };
      calc();
      const iv = setInterval(calc, 200);
      return () => clearInterval(iv);
    } else {
      setCountdown(null);
    }
  }, [room?.state, room?.startsAt]);

  const isRacing = room?.state === 'RACING' || (room?.state === 'COUNTDOWN' && room?.startsAt && Date.now() >= room.startsAt);
  const isFinished = !!me?.finishedAt;

  // Track elapsed time during race
  useEffect(() => {
    if (isRacing && !isFinished) {
      const startTime = room?.startsAt || Date.now();
      timerRef.current = setInterval(() => {
        const secs = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
        setElapsedSeconds(secs);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRacing, isFinished, room?.startsAt]);

  const focusEditor = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // When race starts, guarantee editor focus
  useEffect(() => {
    if (isRacing) {
      inputRef.current?.focus();
    }
  }, [isRacing]);

  // Compute metrics
  const correctCount = Math.min(input.length, target.length);
  let correctChars = 0;
  for (let i = 0; i < correctCount; i++) {
    if (input[i] === target[i]) correctChars++;
  }
  const accuracy = totalKeystrokes > 0 ? Math.max(0, Math.round((correctChars / totalKeystrokes) * 100)) : 100;
  const wpm = elapsedSeconds > 0 ? Math.round((correctChars / 5) / (elapsedSeconds / 60)) : 0;

  // Handle typing with Smart Enter Auto-Indent (skipping leading whitespace)
  const handleKeyDown = (e) => {
    if (!isRacing || isFinished || me?.forfeited) return;

    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (input.length === 0) return;

      // Check if we are right after an auto-indented newline
      const lastNewline = input.lastIndexOf('\n');
      if (lastNewline !== -1) {
        const currentLinePrefix = input.slice(lastNewline + 1);
        if (/^\s*$/.test(currentLinePrefix)) {
          // All spaces after newline, delete entire indentation + newline
          const next = input.slice(0, lastNewline);
          setInput(next);
          sendInput(next);
          return;
        }
      }

      const next = input.slice(0, -1);
      setInput(next);
      sendInput(next);
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      // Tab key adds 2 spaces or matches target indentation
      let add = '  ';
      if (target.startsWith(input + '\t')) add = '\t';
      else if (target.startsWith(input + '    ')) add = '    ';
      const next = input + add;
      setInput(next);
      setTotalKeystrokes(prev => prev + 1);
      sendInput(next);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      // Check if Enter is valid at this point
      const nextPos = input.length;
      let nextInput = input + '\n';
      setTotalKeystrokes(prev => prev + 1);

      // SMART AUTO-INDENT:
      // If the target has leading whitespace on the new line, neglect/skip it
      // so the cursor goes directly to the first element of the next line!
      if (nextPos < target.length && target[nextPos] === '\n') {
        let skip = 0;
        while (nextPos + 1 + skip < target.length) {
          const ch = target[nextPos + 1 + skip];
          if (ch === ' ' || ch === '\t') {
            skip++;
          } else {
            break;
          }
        }
        if (skip > 0) {
          nextInput += target.substring(nextPos + 1, nextPos + 1 + skip);
        }
      }

      setInput(nextInput);
      sendInput(nextInput);
      return;
    }

    if (e.key.length === 1) {
      e.preventDefault();
      const char = e.key;
      const expectedChar = target[input.length];
      if (char !== expectedChar) {
        setMistakesCount(prev => prev + 1);
      }
      setTotalKeystrokes(prev => prev + 1);
      const next = input + char;
      setInput(next);
      sendInput(next);
    }
  };

  const sendInput = (content) => {
    sequenceRef.current += 1;
    send('INPUT', { content, sequence: sequenceRef.current });
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    const text = chatMessage.trim();
    if (!text) return;

    const reqId = crypto.randomUUID();
    const optimisticMsg = {
      id: reqId,
      requestId: reqId,
      senderId: user?.id,
      sender: user?.displayName || user?.username || 'You',
      timestamp: Date.now(),
      content: text,
    };

    // 0ms instant display for user!
    setLocalChats((prev) => [...prev.slice(-30), optimisticMsg]);
    setChatMessage('');

    send('CHAT', {
      content: text,
      requestId: reqId
    });
  };

  const fmtTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Reconcile server chats with local optimistic messages
  const serverChats = room?.chat || [];
  const mergedChats = [...serverChats];
  for (const lc of localChats) {
    if (!serverChats.some((sc) => sc.requestId === lc.requestId || (String(sc.senderId) === String(lc.senderId) && sc.content === lc.content))) {
      mergedChats.push(lc);
    }
  }

  // Render highlighted target characters
  const renderCodeChars = () => {
    const chars = [];
    for (let i = 0; i < target.length; i++) {
      const exp = target[i];
      let cls = 'char-upcoming';
      if (i < input.length) {
        cls = input[i] === exp ? 'char-correct' : 'char-error';
      } else if (i === input.length) {
        cls = 'char-cursor';
      }

      chars.push(
        <span key={i} className={`race-code-char ${cls}`}>
          {exp === '\n' ? '↵\n' : exp}
        </span>
      );
    }
    return chars;
  };

  return (
    <div className="mp-race-workspace">
      {/* Top Race Status Header */}
      <div className="mp-race-top-bar">
        <div className="mp-race-meta-left">
          <span className="mp-race-mode-tag">
            {isRanked ? '⚡ Ranked Arena' : '🛡 Unranked Race'}
          </span>
          <h2 className="mp-race-title">{room?.title || 'Race Track'}</h2>
          <span className="mp-race-lang-pill">{room?.language}</span>
        </div>

        <div className="mp-race-stats-head">
          <div className="mp-race-timer-pill">
            <Clock size={15} className="timer-icon" />
            <span>{fmtTime(elapsedSeconds)}</span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-leave-race"
            onClick={onLeave}
            title="Leave Match"
          >
            <LogOut size={14} /> Leave Match
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left Editor | Right Competitors & Chat */}
      <div className="mp-race-grid">
        {/* LEFT COLUMN: Typing Track */}
        <div className="mp-race-editor-card" onClick={focusEditor}>
          <div className="mp-race-editor-hd">
            <span className="mp-editor-title">Code Target (Type to Match)</span>
            <span className="mp-editor-hint">
              {isFinished ? '✓ Submission Completed!' : 'Press Enter to auto-indent to the next line'}
            </span>
          </div>

          <div className="mp-race-code-view">
            {countdown !== null && countdown > 0 && (
              <div className="mp-countdown-overlay">
                <span className="mp-countdown-number">{countdown}</span>
                <span className="mp-countdown-sub">Match Starting... Get Ready!</span>
              </div>
            )}
            {isFinished && (
              <div className="mp-finish-banner">
                <Trophy size={16} />
                <span>Template Completed! Finalizing Results...</span>
              </div>
            )}
            <pre className="mp-code-pre">
              {renderCodeChars()}
            </pre>
            <textarea
              ref={inputRef}
              className="mp-hidden-input"
              value={input}
              onChange={() => {}}
              onKeyDown={handleKeyDown}
              autoFocus
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              aria-label="Code Race Input Buffer"
            />
          </div>

          {/* Bottom Live Metrics Row */}
          <div className="mp-race-metrics-bar">
            <div className="mp-metric-cell">
              <span className="metric-label">Accuracy</span>
              <span className="metric-value accent-green">{accuracy}%</span>
            </div>
            <div className="mp-metric-cell">
              <span className="metric-label">Speed</span>
              <span className="metric-value accent-blue">{wpm} WPM</span>
            </div>
            <div className="mp-metric-cell">
              <span className="metric-label">Time Taken</span>
              <span className="metric-value accent-amber">{fmtTime(elapsedSeconds)}</span>
            </div>
            <div className="mp-metric-cell">
              <span className="metric-label">Mistakes</span>
              <span className="metric-value accent-red">{mistakesCount}</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Competitors Progress & Live Chat */}
        <div className="mp-race-sidebar">
          {/* Top Box: Connected Users & Progress Bars */}
          <div className="mp-side-card mp-competitors-card">
            <div className="mp-side-card-hd">
              <div className="mp-side-title-group">
                <Trophy size={15} style={{ color: '#F59E0B' }} />
                <span>Connected Racers ({room?.players?.length || 0}/{room?.capacity || 4})</span>
              </div>
            </div>

            <div className="mp-competitors-list">
              {room?.players?.map((p, idx) => {
                const isMe = String(p.id) === String(user?.id);
                const pProg = Math.round(p.progress || 0);
                const isDone = !!p.finishedAt;
                const isForfeit = p.forfeited;

                return (
                  <div key={p.id || idx} className={`mp-competitor-item ${isMe ? 'is-me' : ''}`}>
                    <div className="mp-competitor-top">
                      <div className="mp-competitor-user">
                        <div className="mp-competitor-avatar">
                          {(p.name || 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="mp-competitor-name">
                          {p.name} {isMe ? '(You)' : ''}
                        </span>
                      </div>
                      <div className="mp-competitor-badge-wrap">
                        {isForfeit ? (
                          <span className="badge-forfeit">Forfeited</span>
                        ) : isDone ? (
                          <span className="badge-finished">✓ Finished</span>
                        ) : (
                          <span className="badge-pct">{pProg}%</span>
                        )}
                      </div>
                    </div>

                    {/* Real-time Progress Bar */}
                    <div className="mp-progress-bar-track">
                      <div
                        className={`mp-progress-bar-fill ${isMe ? 'fill-me' : 'fill-opponent'} ${isDone ? 'fill-done' : ''}`}
                        style={{ width: `${pProg}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Box: Real-Time Room Chat */}
          <div className="mp-side-card mp-chat-card">
            <div className="mp-side-card-hd">
              <div className="mp-side-title-group">
                <MessageSquare size={15} style={{ color: '#3B82F6' }} />
                <span>Race Chat</span>
              </div>
              <span className="mp-chat-status">Live WS</span>
            </div>

            <div className="mp-chat-messages" role="log" aria-live="polite">
              {!mergedChats.length ? (
                <div className="mp-chat-empty">
                  <span>Chat connected. Send a message to fellow racers!</span>
                </div>
              ) : (
                mergedChats.map((m) => {
                  const isMine = String(m.senderId) === String(user?.id);
                  return (
                    <div key={m.id || m.requestId} className={`mp-chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
                      {!isMine && <span className="chat-sender">{m.sender}</span>}
                      <span className="chat-content">{m.content}</span>
                    </div>
                  );
                })
              )}
            </div>

            <form className="mp-chat-input-bar" onSubmit={handleSendChat}>
              <input
                type="text"
                placeholder="Type in chat..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                maxLength={200}
                className="mp-chat-input"
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm mp-chat-send-btn"
                disabled={!chatMessage.trim()}
              >
                <Send size={13} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
