// src/pages/Multiplayer.jsx
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Flag, Swords, Crown, Users, Ghost, ShieldAlert, Bug,
  Play, Plus, Search, Copy, Check, Trophy, ArrowRight,
  Zap, Wifi, Radio, LogOut, ChevronLeft, ChevronRight,
  AlertCircle, RefreshCw, Shield, Clock
} from 'lucide-react';

import {
  MULTIPLAYER_MODES,
  RECENT_MATCHES_HISTORY,
  MULTIPLAYER_SNIPPETS,
  multiplayerService,
} from '../services/multiplayerService';
import { tokenizeCodeSnippet } from '../utils/codeTokenizer';
import CodePracticeEditor from '../components/practice/CodePracticeEditor';
import VirtualKeyboard from '../components/practice/VirtualKeyboard';
import { LANGUAGES, DIFFICULTIES } from '../data/snippets';

/* ================================================================
   ICON MAPPING FOR 7 GAME MODES
   ================================================================ */
const MODE_ICONS = {
  Flag,
  Swords,
  Crown,
  Users,
  Ghost,
  ShieldAlert,
  Bug,
};

const LANG_COLORS = {
  'C++': '#2563EB',
  Python: '#4F46E5',
  JavaScript: '#D97706',
  TypeScript: '#0284C7',
  Go: '#0D9488',
  Java: '#EA580C',
  Rust: '#DC2626',
  SQL: '#7C3AED',
};

export default function Multiplayer() {
  // ── High-Level Arena View State ──
  // 'hub' | 'setup' | 'room' | 'countdown' | 'results'
  const [viewState, setViewState] = useState('hub');

  // ── Mode Setup State ──
  const [setupModeId, setSetupModeId] = useState('classic');
  const [setupRoomName, setSetupRoomName] = useState('');
  const [setupRoomCode, setSetupRoomCode] = useState(() => multiplayerService.generateRoomCode());
  const [setupLang, setSetupLang] = useState('C++');
  const [setupDiff, setSetupDiff] = useState('Intermediate');
  const [setupMaxPlayers, setSetupMaxPlayers] = useState(4);
  const [setupIsPrivate, setSetupIsPrivate] = useState(false);
  const [setupIncludeBots, setSetupIncludeBots] = useState(true);

  // ── Arena Hub State ──
  const [selectedHubMode, setSelectedHubMode] = useState('classic');
  const [lobbySearch, setLobbySearch] = useState('');
  const [openRooms, setOpenRooms] = useState(() => multiplayerService.getOpenRooms());

  // ── Active Room State ──
  const [activeRoom, setActiveRoom] = useState(null);
  const [isUserReady, setIsUserReady] = useState(false);
  const [roomSessionState, setRoomSessionState] = useState('waiting'); // 'waiting' | 'active' | 'completed'
  const [countdownNum, setCountdownNum] = useState(3);
  const [isCopiedCode, setIsCopiedCode] = useState(false);

  // ── Live Race Typing Engine State (Matching Practice Section) ──
  const [cursorIndex, setCursorIndex] = useState(0);
  const [typedHistory, setTypedHistory] = useState([]); // Array<{ typedChar: string; isCorrect: boolean }>
  const [totalErrors, setTotalErrors] = useState(0);
  const [raceElapsedSeconds, setRaceElapsedSeconds] = useState(0);
  const [isFocused, setIsFocused] = useState(true);
  const [lastPressedCode, setLastPressedCode] = useState(null);
  const [racerProgressList, setRacerProgressList] = useState([]);

  // Race Timer References
  const raceIntervalRef = useRef(null);
  const botIntervalRef = useRef(null);
  const raceStartTimeRef = useRef(null);

  // Active Snippet for Race / Setup
  const currentSnippet = useMemo(() => {
    const lang = activeRoom ? activeRoom.language : setupLang;
    const base = MULTIPLAYER_SNIPPETS[lang] || MULTIPLAYER_SNIPPETS['C++'];
    return {
      ...base,
      language: lang,
    };
  }, [activeRoom, setupLang]);

  // Tokenize the snippet for CodePracticeEditor
  const tokenizedSnippet = useMemo(() => {
    return tokenizeCodeSnippet(currentSnippet.code, currentSnippet.language);
  }, [currentSnippet]);

  // Filtered Open Lobbies
  const filteredOpenRooms = useMemo(() => {
    if (!lobbySearch.trim()) return openRooms;
    const q = lobbySearch.toLowerCase().trim();
    return openRooms.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.language.toLowerCase().includes(q) ||
        r.modeName.toLowerCase().includes(q)
    );
  }, [openRooms, lobbySearch]);

  // Mode Object for Setup
  const activeSetupMode = useMemo(() => {
    return MULTIPLAYER_MODES.find((m) => m.id === setupModeId) || MULTIPLAYER_MODES[0];
  }, [setupModeId]);

  // ── Setup Navigation & Room Creation ──
  const handleOpenSetup = (modeId = 'classic') => {
    const mode = MULTIPLAYER_MODES.find((m) => m.id === modeId) || MULTIPLAYER_MODES[0];
    setSetupModeId(mode.id);
    setSetupRoomName(`Developer's ${mode.title}`);
    setSetupRoomCode(multiplayerService.generateRoomCode());

    // Set sensible defaults for mode capacity
    if (mode.id === 'duel') setSetupMaxPlayers(2);
    else if (mode.id === 'battle-royale') setSetupMaxPlayers(16);
    else if (mode.id === 'relay') setSetupMaxPlayers(4);
    else setSetupMaxPlayers(4);

    setViewState('setup');
  };

  const handleConfirmCreateRoom = () => {
    const created = multiplayerService.createRoom({
      name: setupRoomName || `${setupLang} ${activeSetupMode.title}`,
      modeId: setupModeId,
      language: setupLang,
      difficulty: setupDiff,
      maxPlayers: setupMaxPlayers,
      isPrivate: setupIsPrivate,
    });

    setOpenRooms(multiplayerService.getOpenRooms());
    setActiveRoom(created);
    setIsUserReady(false);
    setRoomSessionState('waiting');
    setCursorIndex(0);
    setTypedHistory([]);
    setTotalErrors(0);
    setRaceElapsedSeconds(0);
    setViewState('room');
  };

  const handleJoinRoom = (room) => {
    const joined = multiplayerService.joinRoom(room.id || room.code);
    setActiveRoom(joined);
    setIsUserReady(false);
    setRoomSessionState('waiting');
    setCursorIndex(0);
    setTypedHistory([]);
    setTotalErrors(0);
    setRaceElapsedSeconds(0);
    setViewState('room');
  };

  const handleQuickMatch = () => {
    if (openRooms.length > 0) {
      handleJoinRoom(openRooms[0]);
    } else {
      handleOpenSetup('classic');
    }
  };

  const handleLeaveRoom = () => {
    clearInterval(raceIntervalRef.current);
    clearInterval(botIntervalRef.current);
    setActiveRoom(null);
    setIsUserReady(false);
    setRoomSessionState('waiting');
    setViewState('hub');
  };

  const handleCopyCode = (text) => {
    navigator.clipboard.writeText(text);
    setIsCopiedCode(true);
    setTimeout(() => setIsCopiedCode(false), 2000);
  };

  // ── Launch Countdown & Race ──
  const handleStartCountdown = useCallback(() => {
    setViewState('countdown');
    setCountdownNum(3);

    let count = 3;
    const timer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownNum(count);
      } else {
        clearInterval(timer);
        // Activate Race
        setViewState('room');
        setRoomSessionState('active');
        setCursorIndex(0);
        setTypedHistory([]);
        setTotalErrors(0);
        setRaceElapsedSeconds(0);

        // Initialize racers
        const initialRacers = (activeRoom?.participants || []).map((p) => ({
          id: p.id,
          name: p.name,
          isHuman: p.isHuman,
          targetWpm: p.targetWpm || (setupDiff === 'Advanced' ? 75 : setupDiff === 'Beginner' ? 50 : 64),
          progress: 0,
          wpm: 0,
          finished: false,
          finishTime: null,
          charsTyped: 0,
        }));
        setRacerProgressList(initialRacers);
        raceStartTimeRef.current = Date.now();
      }
    }, 900);
  }, [activeRoom, setupDiff]);

  // ── Keystroke Handlers for CodePracticeEditor ──
  const handlePhysicalKey = useCallback((code) => {
    setLastPressedCode(code);
    setTimeout(() => setLastPressedCode(null), 120);
  }, []);

  const handleKeyPress = useCallback((key) => {
    if (roomSessionState !== 'active') return;

    const flatChars = tokenizedSnippet.flatChars;
    if (cursorIndex >= flatChars.length) return;

    const expectedChar = flatChars[cursorIndex].char;
    const isCorrect = key === expectedChar;

    if (!isCorrect) {
      setTotalErrors((prev) => prev + 1);
    }

    const nextIndex = cursorIndex + 1;
    setCursorIndex(nextIndex);
    setTypedHistory((prev) => [...prev, { typedChar: key, isCorrect }]);

    // Update human racer progress
    const humanProgress = Math.min(100, Math.round((nextIndex / flatChars.length) * 100));
    const elapsedMin = Math.max(0.01, raceElapsedSeconds / 60);
    const liveWpm = Math.round((nextIndex / 5) / elapsedMin);

    setRacerProgressList((prev) =>
      prev.map((racer) =>
        racer.isHuman
          ? {
              ...racer,
              progress: humanProgress,
              wpm: liveWpm,
              finished: humanProgress >= 100,
              finishTime: humanProgress >= 100 ? `${raceElapsedSeconds}s` : null,
              charsTyped: nextIndex,
            }
          : racer
      )
    );

    // Check completion
    if (nextIndex >= flatChars.length) {
      setRoomSessionState('completed');
      setTimeout(() => {
        setViewState('results');
      }, 700);
    }
  }, [roomSessionState, tokenizedSnippet, cursorIndex, raceElapsedSeconds]);

  const handleBackspace = useCallback(() => {
    if (roomSessionState !== 'active' || cursorIndex <= 0) return;
    setCursorIndex((prev) => prev - 1);
    setTypedHistory((prev) => prev.slice(0, -1));
  }, [roomSessionState, cursorIndex]);

  const handleTab = useCallback(() => {
    handleKeyPress('  ');
  }, [handleKeyPress]);

  const handleEnter = useCallback(() => {
    handleKeyPress('\n');
  }, [handleKeyPress]);

  // Race Loop: Elapsed Time & Competitor Simulation
  useEffect(() => {
    if (roomSessionState !== 'active') return;

    raceIntervalRef.current = setInterval(() => {
      if (raceStartTimeRef.current) {
        const secs = Math.floor((Date.now() - raceStartTimeRef.current) / 1000);
        setRaceElapsedSeconds(secs);
      }
    }, 500);

    botIntervalRef.current = setInterval(() => {
      setRacerProgressList((prev) => {
        const totalChars = tokenizedSnippet.totalChars || 120;
        return prev.map((racer) => {
          if (racer.isHuman || racer.finished) return racer;

          const charsPerSec = (racer.targetWpm * 5) / 60;
          const increment = Math.max(1, Math.round(charsPerSec * 0.4 * (0.85 + Math.random() * 0.3)));
          const nextChars = (racer.charsTyped || 0) + increment;
          const nextProg = Math.min(100, Math.round((nextChars / totalChars) * 100));
          const isDone = nextProg >= 100;

          return {
            ...racer,
            charsTyped: nextChars,
            progress: nextProg,
            wpm: Math.round(racer.targetWpm + (Math.random() * 4 - 2)),
            finished: isDone,
            finishTime: isDone ? racer.finishTime || `${raceElapsedSeconds}s` : null,
          };
        });
      });
    }, 400);

    return () => {
      clearInterval(raceIntervalRef.current);
      clearInterval(botIntervalRef.current);
    };
  }, [roomSessionState, tokenizedSnippet, raceElapsedSeconds]);

  // Live Metrics
  const humanAccuracy = useMemo(() => {
    if (cursorIndex === 0) return 100;
    const correctCount = typedHistory.filter((t) => t.isCorrect).length;
    return Number(((correctCount / cursorIndex) * 100).toFixed(1));
  }, [cursorIndex, typedHistory]);

  const humanWpm = useMemo(() => {
    if (raceElapsedSeconds < 1 || cursorIndex === 0) return 0;
    const minutes = raceElapsedSeconds / 60;
    return Math.round((cursorIndex / 5) / minutes);
  }, [raceElapsedSeconds, cursorIndex]);

  // Leaderboard Sorted Racers
  const sortedRacers = useMemo(() => {
    return [...racerProgressList].sort((a, b) => {
      if (b.progress !== a.progress) return b.progress - a.progress;
      return (b.wpm || 0) - (a.wpm || 0);
    });
  }, [racerProgressList]);

  const humanRank = useMemo(() => {
    const idx = sortedRacers.findIndex((r) => r.isHuman);
    return idx >= 0 ? idx + 1 : 1;
  }, [sortedRacers]);

  const currentTargetChar = tokenizedSnippet.flatChars[cursorIndex]?.char;

  return (
    <div className="multiplayer-page-root">
      {/* ============================================================
          VIEW 1: ARENA HUB (7 Modes, Non-Distorted Lobbies, History)
          ============================================================ */}
      {viewState === 'hub' && (
        <>
          {/* Header */}
          <header className="tpl-header mp-header">
            <div className="tpl-header-left">
              <div className="tpl-header-badge">
                <Radio size={13} className="tpl-badge-icon" />
                <span>Synchronous Code Arena</span>
              </div>
              <h1 className="tpl-title">Multiplayer Arena</h1>
              <p className="tpl-subtitle">
                Compete against developer benchmarks, race in team relays, and master synchronized syntax under pressure.
              </p>
            </div>

            <div className="tpl-header-actions mp-header-actions">
              <button
                type="button"
                className="tpl-hdr-btn tpl-hdr-secondary"
                onClick={handleQuickMatch}
                id="btn-quick-match"
              >
                <Zap size={14} />
                <span>Quick Match</span>
              </button>
              <button
                type="button"
                className="tpl-hdr-btn tpl-hdr-primary"
                onClick={() => handleOpenSetup('classic')}
                id="btn-create-room"
              >
                <Plus size={14} strokeWidth={2.2} />
                <span>Host Custom Room</span>
              </button>
            </div>
          </header>

          {/* 7 Competitive Modes Grid */}
          <section className="mp-modes-section">
            <div className="mp-section-title-row">
              <div>
                <h3 className="mp-section-title">Select Competitive Mode</h3>
                <p className="mp-section-sub">
                  Choose from 7 distinct multiplayer formats designed for different competitive dynamics
                </p>
              </div>
              <span className="mp-mode-count-badge">7 Game Modes</span>
            </div>

            <div className="mp-modes-grid">
              {MULTIPLAYER_MODES.map((mode) => {
                const IconComponent = MODE_ICONS[mode.iconName] || Flag;
                const isSelected = selectedHubMode === mode.id;

                return (
                  <div
                    key={mode.id}
                    className={`mp-mode-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedHubMode(mode.id)}
                  >
                    <div className="mp-mode-top">
                      <div className={`stat-icon-wrap ${mode.tone}`}>
                        <IconComponent size={20} strokeWidth={2.2} />
                      </div>
                      <span className="mp-mode-badge">{mode.badge}</span>
                    </div>

                    <h4 className="mp-mode-title">{mode.title}</h4>
                    <span className="mp-mode-tagline">{mode.tagline}</span>
                    <p className="mp-mode-desc">{mode.description}</p>

                    <div className="mp-mode-footer">
                      <div className="mp-mode-capacity">
                        <Users size={12} />
                        <span>{mode.playerRange}</span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs mp-select-mode-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenSetup(mode.id);
                        }}
                        id={`btn-select-mode-${mode.id}`}
                      >
                        <span>Select Mode</span>
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Dedicated Non-Distorted Open Waiting Lobbies Browser */}
          <section className="mp-open-lobbies-section">
            <div className="card mp-lobbies-card">
              <div className="card-hd mp-lobbies-hd">
                <div className="mp-lobbies-hd-left">
                  <Wifi size={15} className="wifi-icon" />
                  <h3 className="card-title">Open Waiting Lobbies</h3>
                  <span className="mp-lobbies-count">
                    {filteredOpenRooms.length} available
                  </span>
                </div>

                {/* Lobby Search Input */}
                <div className="mp-lobby-search-wrap">
                  <Search size={13} className="mp-search-icon" />
                  <input
                    type="text"
                    placeholder="Search by room code, host, or language..."
                    value={lobbySearch}
                    onChange={(e) => setLobbySearch(e.target.value)}
                    className="mp-search-input"
                    id="input-lobby-search"
                  />
                </div>
              </div>

              <div className="card-bd mp-lobbies-bd">
                {filteredOpenRooms.length === 0 ? (
                  <div className="mp-empty-lobbies">
                    <AlertCircle size={28} className="empty-alert-icon" />
                    <h4>No active rooms matching filter</h4>
                    <p>Host your own room or reset your search term.</p>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleOpenSetup('classic')}
                    >
                      Host a Room
                    </button>
                  </div>
                ) : (
                  <div className="mp-room-cards-grid">
                    {filteredOpenRooms.map((room) => (
                      <div key={room.id} className="mp-room-item-card">
                        <div className="mp-room-item-header">
                          <span className="room-code-tag">{room.code}</span>
                          <span className="badge badge-indigo">{room.modeName}</span>
                          <span className="room-ping-text">
                            <span className="ping-dot" /> {room.ping}
                          </span>
                        </div>

                        <div className="mp-room-item-body">
                          <h4 className="mp-room-item-title">{room.name}</h4>
                          <div className="mp-room-meta-row">
                            <span className="badge badge-teal">
                              <span
                                className="lang-dot-inline"
                                style={{ background: LANG_COLORS[room.language] || '#2563EB' }}
                              />
                              {room.language}
                            </span>
                            <span className="badge badge-emerald">{room.difficulty}</span>
                            <span className="room-players-badge">
                              <Users size={12} />
                              {room.currentPlayers} / {room.maxPlayers}
                            </span>
                          </div>
                        </div>

                        <div className="mp-room-item-footer">
                          <span className="room-host-lbl">Host: {room.host}</span>
                          <button
                            type="button"
                            className="btn btn-primary btn-xs btn-join-room"
                            onClick={() => handleJoinRoom(room)}
                            id={`btn-join-${room.code}`}
                          >
                            <span>Join Lobby</span>
                            <ArrowRight size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Recent Matches History Record */}
          <section className="mp-history-section">
            <div className="card mp-history-card">
              <div className="card-hd">
                <div className="mp-hd-title-group">
                  <Trophy size={15} className="trophy-icon" />
                  <h3 className="card-title">Recent Arena Matches</h3>
                </div>
              </div>

              <div className="card-bd mp-history-bd">
                <div className="mp-history-list">
                  {RECENT_MATCHES_HISTORY.map((match) => (
                    <div key={match.id} className="mp-match-row">
                      <div className="match-rank-badge">
                        <span className={`place-pill place-${match.place}`}>
                          {match.place === 1 ? '1st' : match.place === 2 ? '2nd' : `${match.place}th`}
                        </span>
                      </div>
                      <div className="match-details">
                        <div className="match-title-row">
                          <span className="match-mode-text">{match.mode}</span>
                          <span className="match-snippet-name">· {match.snippetTitle}</span>
                        </div>
                        <div className="match-sub-info">
                          <span>{match.date}</span>
                          <span>·</span>
                          <span className="match-opponents-text">vs {match.opponents.join(', ')}</span>
                        </div>
                      </div>
                      <div className="match-stats-right">
                        <span className="match-wpm-num">{match.wpm} WPM</span>
                        <span className="match-acc-num">{match.accuracy}% acc</span>
                        <span className="match-xp-badge">+{match.xpEarned} XP</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ============================================================
          VIEW 2: DEDICATED MODE SETUP / LOBBY CONFIGURATION STUDIO
          (Opens when clicking "Select Mode" on any of the 7 cards)
          ============================================================ */}
      {viewState === 'setup' && (
        <div className="mp-setup-workspace">
          {/* Setup Header */}
          <header className="tpl-header mp-setup-header">
            <div className="tpl-header-left">
              <button
                type="button"
                className="mp-back-btn"
                onClick={() => setViewState('hub')}
              >
                <ChevronLeft size={14} />
                <span>Back to Arena Modes</span>
              </button>
              <div className="mp-setup-title-row">
                <div className={`stat-icon-wrap ${activeSetupMode.tone} mini`}>
                  {(() => {
                    const IconComp = MODE_ICONS[activeSetupMode.iconName] || Flag;
                    return <IconComp size={18} strokeWidth={2.2} />;
                  })()}
                </div>
                <h1 className="tpl-title">{activeSetupMode.title} Setup</h1>
              </div>
              <p className="tpl-subtitle">{activeSetupMode.description}</p>
            </div>

            {/* Quick Switch Mode Tabs */}
            <div className="mp-setup-mode-tabs">
              {MULTIPLAYER_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`mp-setup-mode-tab ${setupModeId === m.id ? 'active' : ''}`}
                  onClick={() => setSetupModeId(m.id)}
                >
                  {m.title}
                </button>
              ))}
            </div>
          </header>

          {/* Two-Column Setup Studio */}
          <div className="mp-setup-grid">
            {/* Left: Configuration Form */}
            <div className="card mp-setup-form-card">
              <div className="card-hd">
                <h3 className="card-title">Match Configuration</h3>
                <span className="badge badge-indigo">{activeSetupMode.badge}</span>
              </div>

              <div className="card-bd mp-setup-form-bd">
                {/* Room Title */}
                <div className="mp-form-group">
                  <label className="mp-label">
                    <span>Lobby Title</span>
                  </label>
                  <input
                    type="text"
                    value={setupRoomName}
                    onChange={(e) => setSetupRoomName(e.target.value)}
                    placeholder="e.g. C++ Systems Sprint 1v1"
                    className="mp-input"
                  />
                </div>

                {/* Generated Room Code Badge */}
                <div className="mp-form-group">
                  <label className="mp-label">
                    <span>Generated Room Code</span>
                    <span className="mp-label-hint">Share with friends to join</span>
                  </label>
                  <div className="mp-room-code-display" onClick={() => handleCopyCode(setupRoomCode)}>
                    <span className="code-text">{setupRoomCode}</span>
                    <button type="button" className="code-copy-btn">
                      {isCopiedCode ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
                      <span>{isCopiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Target Language */}
                <div className="mp-form-group">
                  <label className="mp-label">
                    <span>Language Environment</span>
                  </label>
                  <div className="mp-lang-pills">
                    {LANGUAGES.filter((l) => l !== 'All').map((l) => (
                      <button
                        key={l}
                        type="button"
                        className={`mp-lang-pill ${setupLang === l ? 'active' : ''}`}
                        onClick={() => setSetupLang(l)}
                      >
                        <span
                          className="lang-dot-inline"
                          style={{ background: LANG_COLORS[l] || '#2563EB' }}
                        />
                        <span>{l}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div className="mp-form-group">
                  <label className="mp-label">
                    <span>Difficulty Tier</span>
                  </label>
                  <div className="mp-diff-pills">
                    {DIFFICULTIES.filter((d) => d !== 'All').map((d) => (
                      <button
                        key={d}
                        type="button"
                        className={`mp-diff-pill ${setupDiff === d ? 'active' : ''} ${d.toLowerCase()}`}
                        onClick={() => setSetupDiff(d)}
                      >
                        <span>{d}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Player Limit */}
                <div className="mp-form-group">
                  <label className="mp-label">
                    <span>Player Capacity: {setupMaxPlayers} Racers</span>
                    <span className="mp-label-hint">Supported: {activeSetupMode.playerRange}</span>
                  </label>
                  <input
                    type="range"
                    min="2"
                    max={setupModeId === 'battle-royale' ? 16 : 8}
                    value={setupMaxPlayers}
                    onChange={(e) => setSetupMaxPlayers(Number(e.target.value))}
                    className="mp-range-slider"
                  />
                </div>

                {/* Simulated Competitors Toggle */}
                <div className="mp-form-group">
                  <label className="mp-checkbox-row">
                    <input
                      type="checkbox"
                      checked={setupIncludeBots}
                      onChange={(e) => setSetupIncludeBots(e.target.checked)}
                    />
                    <span>Populate vacant slots with simulated benchmark bots</span>
                  </label>
                </div>

                {/* Room Privacy */}
                <div className="mp-form-group">
                  <label className="mp-checkbox-row">
                    <input
                      type="checkbox"
                      checked={setupIsPrivate}
                      onChange={(e) => setSetupIsPrivate(e.target.checked)}
                    />
                    <span>Private Match (Requires Room Code to Join)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right: Live Match Blueprint & Launch Studio */}
            <div className="card mp-setup-preview-card">
              <div className="card-hd">
                <h3 className="card-title">Match Blueprint</h3>
                <span className="badge badge-teal">{setupLang}</span>
              </div>

              <div className="card-bd mp-setup-preview-bd">
                <div className="mp-blueprint-meta">
                  <h4 className="mp-blueprint-title">{currentSnippet.title}</h4>
                  <p className="mp-blueprint-desc">
                    Synchronized competitive typing snippet. All racers type this exact code simultaneously.
                  </p>
                  <div className="mp-blueprint-stats">
                    <span className="stat-pill">{currentSnippet.code.split('\n').length} lines</span>
                    <span className="stat-pill">{currentSnippet.code.length} characters</span>
                    <span className="stat-pill">{setupDiff}</span>
                  </div>
                </div>

                {/* Syntax Code Preview */}
                <div className="mp-blueprint-code-box">
                  <pre className="mp-blueprint-pre">
                    <code>{currentSnippet.code}</code>
                  </pre>
                </div>

                {/* Competitive Rules Box */}
                <div className="mp-rules-callout">
                  <div className="rules-header">
                    <Shield size={14} className="shield-icon" />
                    <span>Mode Rules & Conditions</span>
                  </div>
                  <p className="rules-text">
                    {setupModeId === 'duel'
                      ? 'Strict 1v1 duel. Accuracy penalty: 5 WPM deducted per uncorrected error.'
                      : setupModeId === 'battle-royale'
                      ? 'Checkpoint elimination: Bottom 20% racers eliminated at lines 5 and 10.'
                      : setupModeId === 'boss-fight'
                      ? 'Cooperative Raid: Aggregate team WPM depletes the automated boss HP bar.'
                      : 'First racer to finish all syntactically correct lines wins 1st place podium.'}
                  </p>
                </div>

                {/* Launch Action Button */}
                <button
                  type="button"
                  className="mp-launch-room-btn"
                  onClick={handleConfirmCreateRoom}
                  id="btn-confirm-create-room"
                >
                  <Play size={15} fill="currentColor" strokeWidth={0} />
                  <span>Create Lobby & Enter Room</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          VIEW 3: ROOM WORKSPACE (LIKE PRACTICE SECTION)
          Synchronized Editor + Virtual Keyboard + Racers Track
          ============================================================ */}
      {viewState === 'room' && activeRoom && (
        <div className="practice-workspace-root mp-room-workspace">
          {/* Top Practice-Style Header Bar */}
          <div className="practice-header-root mp-room-top-bar">
            <div className="ph-left">
              <button
                type="button"
                className="ph-back-btn"
                onClick={handleLeaveRoom}
                title="Leave room and return to Arena"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="ph-title-group">
                <div className="ph-title-row">
                  <h2 className="ph-title">{activeRoom.name}</h2>
                  <div
                    className="mp-room-code-tag-interactive"
                    onClick={() => handleCopyCode(activeRoom.code)}
                    title="Click to copy code"
                  >
                    <span className="code-lbl">CODE:</span>
                    <span className="code-val">{activeRoom.code}</span>
                    {isCopiedCode ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                  </div>
                </div>
                <div className="ph-meta-row">
                  <span className="badge badge-indigo">{activeRoom.modeName}</span>
                  <span className="badge badge-teal">
                    <span
                      className="lang-dot-inline"
                      style={{ background: LANG_COLORS[activeRoom.language] || '#2563EB' }}
                    />
                    {activeRoom.language}
                  </span>
                  <span className="badge badge-emerald">{activeRoom.difficulty}</span>
                </div>
              </div>
            </div>

            {/* Live Telemetry Chips */}
            <div className="ph-metrics-bar">
              <div className="ph-metric-chip">
                <span className="chip-label">RANK</span>
                <span className="chip-value rank-highlight">
                  {humanRank === 1 ? '1st' : humanRank === 2 ? '2nd' : `${humanRank}th`}
                </span>
              </div>
              <div className="ph-metric-chip">
                <span className="chip-label">SPEED</span>
                <span className="chip-value">{humanWpm} WPM</span>
              </div>
              <div className="ph-metric-chip">
                <span className="chip-label">ACCURACY</span>
                <span className="chip-value">{humanAccuracy}%</span>
              </div>
              <div className="ph-metric-chip">
                <span className="chip-label">TIME</span>
                <span className="chip-value">{raceElapsedSeconds}s</span>
              </div>
              <div className="ph-metric-chip">
                <span className="chip-label">ERRORS</span>
                <span className="chip-value">{totalErrors}</span>
              </div>
            </div>

            {/* Right Action */}
            <div className="ph-right-actions">
              {roomSessionState === 'waiting' ? (
                <button
                  type="button"
                  className={`btn ${isUserReady ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                  onClick={() => setIsUserReady((prev) => !prev)}
                >
                  <Check size={13} />
                  <span>{isUserReady ? 'Ready' : 'Ready Up'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleLeaveRoom}
                >
                  <LogOut size={13} />
                  <span>Quit Race</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Workspace Layout (Two-Column like Practice.jsx) */}
          <div className="practice-layout-grid mp-room-grid">
            {/* Left Column: Synchronized Competitors Track + CodePracticeEditor + VirtualKeyboard */}
            <div className="practice-left-column">
              {/* Synchronized Competitors Race Track (at top of Editor) */}
              <div className="card mp-practice-track-card">
                <div className="mp-track-title-row">
                  <div className="track-title-left">
                    <Radio size={13} className="track-pulse-icon" />
                    <span className="track-title-text">Live Synchronized Track</span>
                  </div>
                  <span className="track-status-pill">
                    {roomSessionState === 'active' ? 'Race in progress' : 'Waiting in Lobby'}
                  </span>
                </div>

                <div className="mp-track-lanes">
                  {(racerProgressList.length > 0 ? sortedRacers : (activeRoom.participants || [])).map(
                    (racer, idx) => {
                      const isHuman = racer.isHuman;
                      const progress = racer.progress || 0;
                      const wpm = racer.wpm || (isHuman ? humanWpm : racer.targetWpm || 60);

                      return (
                        <div
                          key={racer.id || idx}
                          className={`mp-racer-track-lane ${isHuman ? 'human' : ''}`}
                        >
                          <div className="racer-tag">
                            <span className="racer-num">#{idx + 1}</span>
                            <span className="racer-lbl">{racer.name}</span>
                            <span className="racer-speed">{wpm} WPM</span>
                          </div>
                          <div className="racer-bar-container">
                            <div
                              className={`racer-bar-fill ${isHuman ? 'human-bar' : 'bot-bar'}`}
                              style={{ width: `${progress}%` }}
                            />
                            <div
                              className="racer-marker-icon"
                              style={{ left: `${Math.min(96, progress)}%` }}
                            >
                              {isHuman ? '🏎️' : '🚙'}
                            </div>
                          </div>
                          <span className="racer-pct-text">{progress}%</span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Code Practice Editor (Identical to Practice Workspace) */}
              <div className="mp-editor-wrapper">
                <CodePracticeEditor
                  tokenizedSnippet={tokenizedSnippet}
                  cursorIndex={cursorIndex}
                  typedHistory={typedHistory}
                  sessionState={roomSessionState}
                  onKeyPress={handleKeyPress}
                  onBackspace={handleBackspace}
                  onTab={handleTab}
                  onEnter={handleEnter}
                  onFocusChange={setIsFocused}
                  isFocused={isFocused}
                  onPhysicalKey={handlePhysicalKey}
                />

                {/* Waiting State Overlay */}
                {roomSessionState === 'waiting' && (
                  <div className="mp-waiting-editor-banner">
                    <div className="banner-content">
                      <Clock size={20} className="banner-clock-icon" />
                      <div>
                        <h4>Lobby Waiting Room</h4>
                        <p>Racers are readying up. When ready, click Launch Countdown to begin the race!</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm mp-banner-launch-btn"
                      onClick={handleStartCountdown}
                      id="btn-launch-countdown-from-banner"
                    >
                      <Play size={13} fill="currentColor" strokeWidth={0} />
                      <span>Launch Countdown</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Interactive Virtual Keyboard */}
              <VirtualKeyboard
                targetChar={currentTargetChar}
                lastPressedCode={lastPressedCode}
              />
            </div>

            {/* Right Column: Connected Competitors & Telemetry Standings */}
            <div className="practice-right-column">
              {/* Connected Competitors Card */}
              <div className="card mp-side-participants-card">
                <div className="card-hd">
                  <div className="side-hd-left">
                    <Users size={14} />
                    <h3 className="card-title">Lobby Competitors</h3>
                  </div>
                  <span className="badge badge-indigo">
                    {(activeRoom.participants || []).length} / {activeRoom.maxPlayers}
                  </span>
                </div>

                <div className="card-bd mp-side-participants-bd">
                  {(activeRoom.participants || []).map((p, idx) => (
                    <div key={p.id || idx} className="mp-side-participant-row">
                      <div className="side-avatar">{p.isHuman ? '👨‍💻' : '🤖'}</div>
                      <div className="side-p-info">
                        <div className="side-p-name-row">
                          <span className="side-p-name">{p.name}</span>
                          {p.isHost && <span className="host-pill">Host</span>}
                        </div>
                        <span className="side-p-sub">
                          {p.isHuman ? 'Human Racer (You)' : `Benchmark Bot (${p.targetWpm || 60} WPM)`}
                        </span>
                      </div>
                      <div className="side-p-status">
                        {p.isReady || isUserReady ? (
                          <span className="status-badge ready">
                            <Check size={11} /> Ready
                          </span>
                        ) : (
                          <span className="status-badge waiting">Waiting</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Match Action in Waiting State */}
                {roomSessionState === 'waiting' && (
                  <div className="mp-side-controls">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm mp-side-start-btn"
                      onClick={handleStartCountdown}
                      id="btn-start-countdown-sidebar"
                    >
                      <Play size={13} fill="currentColor" strokeWidth={0} />
                      <span>Start Race</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* Live Match Standings & Telemetry Card */}
              <div className="card mp-side-telemetry-card">
                <div className="card-hd">
                  <div className="side-hd-left">
                    <Trophy size={14} className="trophy-icon" />
                    <h3 className="card-title">Live Standings</h3>
                  </div>
                  <span className="live-pill">LIVE</span>
                </div>

                <div className="card-bd mp-side-telemetry-bd">
                  <div className="mp-standings-list">
                    {(racerProgressList.length > 0 ? sortedRacers : (activeRoom.participants || [])).map(
                      (r, idx) => (
                        <div
                          key={r.id || idx}
                          className={`mp-standing-item ${r.isHuman ? 'human-item' : ''}`}
                        >
                          <span className="standing-rank">#{idx + 1}</span>
                          <span className="standing-name">{r.name}</span>
                          <span className="standing-wpm">{r.wpm || 0} WPM</span>
                        </div>
                      )
                    )}
                  </div>

                  <div className="mp-mini-telemetry-grid">
                    <div className="telemetry-box">
                      <span className="t-lbl">Your Progress</span>
                      <span className="t-val">
                        {Math.min(100, Math.round((cursorIndex / (tokenizedSnippet.totalChars || 1)) * 100))}%
                      </span>
                    </div>
                    <div className="telemetry-box">
                      <span className="t-lbl">Characters</span>
                      <span className="t-val">{cursorIndex} / {tokenizedSnippet.totalChars}</span>
                    </div>
                    <div className="telemetry-box">
                      <span className="t-lbl">Errors</span>
                      <span className="t-val error">{totalErrors}</span>
                    </div>
                    <div className="telemetry-box">
                      <span className="t-lbl">Accuracy</span>
                      <span className="t-val">{humanAccuracy}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          VIEW 4: COUNTDOWN OVERLAY
          ============================================================ */}
      {viewState === 'countdown' && (
        <div className="mp-countdown-overlay">
          <div className="mp-countdown-modal">
            <span className="mp-countdown-sub">SYNCHRONIZING PLAYERS</span>
            <div className="mp-countdown-number">{countdownNum}</div>
            <p className="mp-countdown-hint">Get hands on home row. Race begins in seconds!</p>
          </div>
        </div>
      )}

      {/* ============================================================
          VIEW 5: RESULTS PODIUM & SUMMARY
          ============================================================ */}
      {viewState === 'results' && (
        <div className="mp-results-screen">
          <div className="card mp-results-card">
            <div className="mp-results-header">
              <div className="trophy-glow">
                <Trophy size={48} color="#F59E0B" />
              </div>
              <h2 className="results-title">
                {humanRank === 1 ? 'Victory! You Placed 1st' : `Match Complete · Placed #${humanRank}`}
              </h2>
              <p className="results-sub">
                Official competitive match results recorded for {activeRoom?.modeName || 'Classic Race'}.
              </p>
            </div>

            {/* Podium Visual */}
            <div className="mp-podium-row">
              {sortedRacers.slice(0, 3).map((r, i) => (
                <div key={r.id || i} className={`podium-stand rank-${i + 1} ${r.isHuman ? 'human' : ''}`}>
                  <span className="podium-badge">#{i + 1}</span>
                  <div className="podium-name">{r.name}</div>
                  <div className="podium-wpm">{r.wpm} WPM</div>
                  <div className="podium-time">{r.finishTime || `${raceElapsedSeconds}s`}</div>
                </div>
              ))}
            </div>

            {/* Match Telemetry Breakdown */}
            <div className="mp-results-telemetry">
              <div className="telemetry-pill">
                <span className="t-label">Net Speed</span>
                <span className="t-val">{humanWpm} WPM</span>
              </div>
              <div className="telemetry-pill">
                <span className="t-label">Accuracy</span>
                <span className="t-val">{humanAccuracy}%</span>
              </div>
              <div className="telemetry-pill">
                <span className="t-label">Total Errors</span>
                <span className="t-val">{totalErrors}</span>
              </div>
              <div className="telemetry-pill">
                <span className="t-label">Duration</span>
                <span className="t-val">{raceElapsedSeconds}s</span>
              </div>
            </div>

            {/* Results Action Buttons */}
            <div className="mp-results-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStartCountdown}
              >
                <RefreshCw size={14} />
                <span>Play Again</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleLeaveRoom}
              >
                <span>Return to Arena Hub</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
