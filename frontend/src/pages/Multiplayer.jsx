// src/pages/Multiplayer.jsx
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flag, Swords, Users, Bug,
  Play, Plus, Search, Copy, Check, Trophy, ArrowRight,
  Zap, Radio, LogOut, ChevronLeft, ChevronRight,
  AlertCircle, RefreshCw, Shield, Clock, Key, Crown, Sparkles, TrendingUp
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
import {
  getUserEloData,
  getTierForRating,
  recordRankedMatch,
  ELO_EVENT_NAME
} from '../utils/eloRatingStore';
import { useAuth } from '../context/AuthContext';

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
  const navigate = useNavigate();
  const { user } = useAuth();

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

  // ── Private Room Quick Creation & Join State ──
  const [privateLang, setPrivateLang] = useState('C++');
  const [privateMaxPlayers, setPrivateMaxPlayers] = useState(4);
  const [joinRoomInput, setJoinRoomInput] = useState('');
  const [joinError, setJoinError] = useState(null);

  // ── Active Room State ──
  const [activeRoom, setActiveRoom] = useState(null);
  const [isUserReady, setIsUserReady] = useState(false);
  const [roomSessionState, setRoomSessionState] = useState('waiting'); // 'waiting' | 'active' | 'completed'
  const [countdownNum, setCountdownNum] = useState(3);
  const [isCopiedCode, setIsCopiedCode] = useState(false);

  // ── ELO Rating State ──
  const [userElo, setUserElo] = useState(() => getUserEloData());
  const [lastEloResult, setLastEloResult] = useState(null);

  // ── Live Race Typing Engine State ──
  const [cursorIndex, setCursorIndex] = useState(0);
  const [typedHistory, setTypedHistory] = useState([]);
  const [totalErrors, setTotalErrors] = useState(0);
  const [raceElapsedSeconds, setRaceElapsedSeconds] = useState(0);
  const [isFocused, setIsFocused] = useState(true);
  const [lastPressedCode, setLastPressedCode] = useState(null);
  const [racerProgressList, setRacerProgressList] = useState([]);

  // Race Timer References
  const raceIntervalRef = useRef(null);
  const botIntervalRef = useRef(null);
  const raceStartTimeRef = useRef(null);

  // Synchronize ELO state
  useEffect(() => {
    const handleEloSync = () => setUserElo(getUserEloData());
    window.addEventListener(ELO_EVENT_NAME, handleEloSync);
    window.addEventListener('storage', handleEloSync);
    return () => {
      window.removeEventListener(ELO_EVENT_NAME, handleEloSync);
      window.removeEventListener('storage', handleEloSync);
    };
  }, []);

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

  const activeSetupMode = useMemo(() => {
    return MULTIPLAYER_MODES.find((m) => m.id === setupModeId) || MULTIPLAYER_MODES[0];
  }, [setupModeId]);

  // Launch a Ranked Match directly
  const handleLaunchRanked = (modeId = 'classic') => {
    const isDuel = modeId === 'duel';
    const room = multiplayerService.createRoom({
      name: isDuel ? '1v1 Ranked Battle' : 'Classic Ranked Sprint',
      modeId,
      language: 'C++',
      difficulty: 'Intermediate',
      maxPlayers: isDuel ? 2 : 4,
      isPrivate: false,
    });

    setActiveRoom(room);
    setIsUserReady(false);
    setRoomSessionState('waiting');
    setCursorIndex(0);
    setTypedHistory([]);
    setTotalErrors(0);
    setRaceElapsedSeconds(0);
    setLastEloResult(null);
    setViewState('room');
  };

  // Launch Unranked Bug Fix Race
  const handleLaunchBugFix = () => {
    const room = multiplayerService.createRoom({
      name: 'Bug Fix Code Sprint',
      modeId: 'bug-fix',
      language: 'TypeScript',
      difficulty: 'Intermediate',
      maxPlayers: 4,
      isPrivate: false,
    });

    setActiveRoom(room);
    setIsUserReady(false);
    setRoomSessionState('waiting');
    setCursorIndex(0);
    setTypedHistory([]);
    setTotalErrors(0);
    setRaceElapsedSeconds(0);
    setLastEloResult(null);
    setViewState('room');
  };

  // Create Private Room
  const handleCreatePrivateRoom = () => {
    const displayName = user?.displayName || user?.username || 'Host';
    const room = multiplayerService.createRoom({
      name: `${displayName}'s Private Room`,
      modeId: 'private-room',
      language: privateLang,
      difficulty: 'Intermediate',
      maxPlayers: privateMaxPlayers,
      isPrivate: true,
    });

    setActiveRoom(room);
    setIsUserReady(false);
    setRoomSessionState('waiting');
    setCursorIndex(0);
    setTypedHistory([]);
    setTotalErrors(0);
    setRaceElapsedSeconds(0);
    setLastEloResult(null);
    setViewState('room');
  };

  // Join Room with ID
  const handleJoinWithId = (e) => {
    e.preventDefault();
    setJoinError(null);
    const code = joinRoomInput.trim().toUpperCase();
    if (!code) {
      setJoinError('Please enter a room code (e.g. DEV-8412)');
      return;
    }

    try {
      const room = multiplayerService.joinRoom(code);
      if (room) {
        setActiveRoom(room);
        setIsUserReady(false);
        setRoomSessionState('waiting');
        setCursorIndex(0);
        setTypedHistory([]);
        setTotalErrors(0);
        setRaceElapsedSeconds(0);
        setLastEloResult(null);
        setViewState('room');
      } else {
        setJoinError('Room code not found. Please verify the ID.');
      }
    } catch {
      setJoinError('Could not connect to room. Check code and try again.');
    }
  };

  // Open Detailed Setup Dialog
  const handleOpenSetup = (modeId = 'classic') => {
    const mode = MULTIPLAYER_MODES.find((m) => m.id === modeId) || MULTIPLAYER_MODES[0];
    setSetupModeId(mode.id);
    setSetupRoomName(`Developer's ${mode.title}`);
    setSetupRoomCode(multiplayerService.generateRoomCode());
    setSetupMaxPlayers(mode.id === 'duel' ? 2 : 4);
    setSetupIsPrivate(mode.id === 'private-room');
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

    setActiveRoom(created);
    setIsUserReady(false);
    setRoomSessionState('waiting');
    setCursorIndex(0);
    setTypedHistory([]);
    setTotalErrors(0);
    setRaceElapsedSeconds(0);
    setLastEloResult(null);
    setViewState('room');
  };

  const handleLeaveRoom = () => {
    clearInterval(raceIntervalRef.current);
    clearInterval(botIntervalRef.current);
    setActiveRoom(null);
    setIsUserReady(false);
    setRoomSessionState('waiting');
    setCursorIndex(0);
    setTypedHistory([]);
    setTotalErrors(0);
    setRaceElapsedSeconds(0);
    setLastEloResult(null);
    setViewState('hub');
  };

  const handleCopyCode = () => {
    if (!activeRoom) return;
    navigator.clipboard.writeText(activeRoom.code);
    setIsCopiedCode(true);
    setTimeout(() => setIsCopiedCode(false), 2000);
  };

  // ── Race Launch & Countdown Flow ──
  const handleStartCountdown = () => {
    setViewState('countdown');
    setCountdownNum(3);

    const racers = (activeRoom?.participants || []).map((p) => ({
      ...p,
      progress: 0,
      wpm: 0,
      finished: false,
      finishTime: null,
      charsTyped: 0,
    }));
    setRacerProgressList(racers);

    let count = 3;
    const timer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownNum(count);
      } else {
        clearInterval(timer);
        setViewState('room');
        setRoomSessionState('active');
        raceStartTimeRef.current = Date.now();
      }
    }, 1000);
  };

  // ── Typing Engine Keystroke Handlers ──
  const handlePhysicalKey = useCallback((e) => {
    setLastPressedCode(e.code);
  }, []);

  const handleKeyPress = useCallback((key) => {
    if (roomSessionState !== 'active') return;

    const flatChars = tokenizedSnippet.flatChars;
    if (cursorIndex >= flatChars.length) return;

    const expected = flatChars[cursorIndex]?.char;
    const isCorrect = key === expected;

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

      // Check if ranked match
      const isRanked = activeRoom?.modeId === 'classic' || activeRoom?.modeId === 'duel';
      if (isRanked) {
        // Calculate placement
        const sorted = [...racerProgressList].sort((a, b) => (b.progress || 0) - (a.progress || 0));
        const humanIndex = sorted.findIndex((r) => r.isHuman);
        const rank = humanIndex >= 0 ? humanIndex + 1 : 1;
        const isWin = activeRoom?.modeId === 'duel' ? rank === 1 : rank <= 2;
        const opponent = sorted.find((r) => !r.isHuman) || { name: 'Ranked Competitor' };

        const eloRes = recordRankedMatch({
          isWin,
          mode: activeRoom?.modeName || (activeRoom?.modeId === 'duel' ? '1v1 Battle' : 'Classic Race'),
          opponentName: opponent.name,
          opponentRating: 1220,
          userWpm: liveWpm,
          userAccuracy: 98.5,
        });
        setLastEloResult(eloRes);
      } else {
        setLastEloResult(null);
      }

      setTimeout(() => {
        setViewState('results');
      }, 700);
    }
  }, [roomSessionState, tokenizedSnippet, cursorIndex, raceElapsedSeconds, activeRoom, racerProgressList]);

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
  const userTier = getTierForRating(userElo.rating);

  return (
    <div className="dash space-y-6">
      {/* ── Top Navigation Switcher Between Arena & Leaderboard ── */}
      <div className="multiplayer-nav-switcher card">
        <div className="multiplayer-nav-tabs">
          <button
            type="button"
            className="multiplayer-nav-tab is-active"
            onClick={() => setViewState('hub')}
          >
            <Swords size={16} />
            <span>Multiplayer Arena</span>
          </button>
          <button
            type="button"
            className="multiplayer-nav-tab"
            onClick={() => navigate('/leaderboard')}
          >
            <Trophy size={16} />
            <span>Multiplayer Rank Leaderboard</span>
          </button>
        </div>
        <div className="multiplayer-nav-right">
          <div className="mp-nav-elo-badge">
            <span className="mp-nav-elo-label">YOUR RATING:</span>
            <span className="mp-nav-elo-num" style={{ color: userTier.color }}>
              {userElo.rating} ELO
            </span>
            <span
              className="mp-nav-tier-tag"
              style={{ color: userTier.color, backgroundColor: userTier.bg }}
            >
              {userTier.icon} {userTier.name}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================
          VIEW 1: ARENA HUB (2 SECTIONS: RANKED & UNRANKED)
          ============================================================ */}
      {viewState === 'hub' && (
        <>
          {/* Welcome & Competitive Standing Widget */}
          <div className="dash-welcome">
            <div className="welcome-left">
              <div className="welcome-tag">
                <Radio size={13} />
                <span>Live Synchronous Coding</span>
              </div>
              <h1>Multiplayer Arena</h1>
              <p>
                Test your algorithmic typing speed in competitive Ranked matches to earn ELO rating points, or sharpen your skills in Unranked bug races and private friend rooms.
              </p>
            </div>

            <div className="welcome-widget">
              <div className="widget-label">COMPETITIVE STANDING</div>
              <div className="widget-val" style={{ color: userTier.color }}>
                {userElo.rating} ELO
              </div>
              <div className="widget-sub">
                {userTier.icon} {userTier.name} · {userElo.wins}W - {userElo.losses}L (
                {userElo.matchesPlayed > 0
                  ? Math.round((userElo.wins / userElo.matchesPlayed) * 100)
                  : 0}
                % Win Rate)
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════
              SECTION 1: RANKED MULTIPLAYER (ELO RATING STAKES)
              ════════════════════════════════════════════════════════ */}
          <section className="mp-section">
            <div className="mp-section-header-row">
              <div className="mp-section-title-wrap">
                <div className="mp-section-icon-badge is-ranked">
                  <Trophy size={18} />
                </div>
                <div>
                  <div className="mp-section-eyebrow">COMPETITIVE ELO STAKES</div>
                  <h2 className="mp-section-heading">Ranked Arena</h2>
                </div>
              </div>
              <span className="badge badge-amber mp-stakes-pill">
                <Crown size={12} /> ELO Rating On The Line
              </span>
            </div>
            <p className="mp-section-desc">
              Heads-up competitive matches with strict ELO rating adjustments. Win to advance through tiers towards Grandmaster; loss will deduct rating points.
            </p>

            <div className="mp-ranked-cards-grid">
              {/* Game 1: Classic Race */}
              <div className="card mp-game-mode-card is-ranked-card">
                <div className="mp-mode-card-top">
                  <div className="mp-mode-icon-wrap" style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563EB' }}>
                    <Flag size={22} />
                  </div>
                  <span className="badge badge-indigo">4-Player Sprint</span>
                </div>
                <h3 className="mp-mode-title">Classic Race</h3>
                <p className="mp-mode-desc">
                  Simultaneous 4-player algorithmic code typing race. Top 2 finishers gain ELO rating points; lower 2 lose points.
                </p>
                <div className="mp-mode-stakes-info">
                  <span className="stakes-label">Stakes:</span>
                  <span className="stakes-value">+20 to +32 ELO on Win</span>
                </div>
                <div className="mp-mode-footer">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm mp-mode-cta"
                    onClick={() => handleLaunchRanked('classic')}
                    id="btn-launch-classic-race"
                  >
                    <Play size={14} fill="currentColor" />
                    <span>Enter Classic Queue</span>
                  </button>
                </div>
              </div>

              {/* Game 2: 1v1 Battle */}
              <div className="card mp-game-mode-card is-ranked-card is-duel-highlight">
                <div className="mp-mode-card-top">
                  <div className="mp-mode-icon-wrap" style={{ background: 'rgba(225, 29, 72, 0.12)', color: '#E11D48' }}>
                    <Swords size={22} />
                  </div>
                  <span className="badge badge-rose">High Stakes 1v1</span>
                </div>
                <h3 className="mp-mode-title">1v1 Battle</h3>
                <p className="mp-mode-desc">
                  High-stakes head-to-head duel. Out-type your rival in speed and precision to seize maximum ELO rating points.
                </p>
                <div className="mp-mode-stakes-info">
                  <span className="stakes-label">Stakes:</span>
                  <span className="stakes-value">Winner Takes All ELO</span>
                </div>
                <div className="mp-mode-footer">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm mp-mode-cta btn-rose-cta"
                    onClick={() => handleLaunchRanked('duel')}
                    id="btn-launch-1v1-battle"
                  >
                    <Swords size={14} />
                    <span>Start 1v1 Battle</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════════════════════════
              SECTION 2: UNRANKED & PRIVATE ROOMS (NO RATING IMPACT)
              ════════════════════════════════════════════════════════ */}
          <section className="mp-section">
            <div className="mp-section-header-row">
              <div className="mp-section-title-wrap">
                <div className="mp-section-icon-badge is-unranked">
                  <Users size={18} />
                </div>
                <div>
                  <div className="mp-section-eyebrow">CASUAL & FRIEND ROOMS</div>
                  <h2 className="mp-section-heading">Unranked Arena & Private Rooms</h2>
                </div>
              </div>
              <span className="badge badge-teal mp-stakes-pill">
                <Sparkles size={12} /> No Rating Impact
              </span>
            </div>
            <p className="mp-section-desc">
              Practice syntax precision, debug code errors, or race privately with friends without touching your competitive ELO rating.
            </p>

            <div className="mp-unranked-cards-grid">
              {/* Game 1: Bug Fix Race */}
              <div className="card mp-unranked-card">
                <div className="mp-mode-card-top">
                  <div className="mp-mode-icon-wrap" style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0284C7' }}>
                    <Bug size={22} />
                  </div>
                  <span className="badge badge-teal">Debug Sprint</span>
                </div>
                <h3 className="mp-mode-title">Bug Fix Race</h3>
                <p className="mp-mode-desc">
                  Inspect intentional syntax bugs, logic errors, and anti-patterns, then type the correct patch under casual unranked conditions.
                </p>
                <div className="mp-mode-footer" style={{ marginTop: 'auto' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm mp-mode-cta"
                    onClick={handleLaunchBugFix}
                    id="btn-launch-bug-fix"
                  >
                    <Play size={13} />
                    <span>Launch Bug Fix Race</span>
                  </button>
                </div>
              </div>

              {/* Private Room: Create Private Room */}
              <div className="card mp-unranked-card mp-private-create-card">
                <div className="mp-mode-card-top">
                  <div className="mp-mode-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
                    <Plus size={22} />
                  </div>
                  <span className="badge badge-emerald">Host Friends</span>
                </div>
                <h3 className="mp-mode-title">Create Private Room</h3>
                <p className="mp-mode-desc">
                  Host an exclusive room for just racing with friends with a private Room ID code.
                </p>

                <div className="mp-private-form-grid">
                  <div className="mp-form-field">
                    <label>Language</label>
                    <select
                      className="mp-select"
                      value={privateLang}
                      onChange={(e) => setPrivateLang(e.target.value)}
                    >
                      {LANGUAGES.slice(0, 6).map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mp-form-field">
                    <label>Max Players</label>
                    <select
                      className="mp-select"
                      value={privateMaxPlayers}
                      onChange={(e) => setPrivateMaxPlayers(Number(e.target.value))}
                    >
                      <option value={2}>2 Racers</option>
                      <option value={4}>4 Racers</option>
                      <option value={8}>8 Racers</option>
                    </select>
                  </div>
                </div>

                <div className="mp-mode-footer" style={{ marginTop: 14 }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm mp-mode-cta"
                    onClick={handleCreatePrivateRoom}
                    id="btn-create-private-room"
                  >
                    <Plus size={14} />
                    <span>Create Private Room</span>
                  </button>
                </div>
              </div>

              {/* Private Room: Join with Room ID */}
              <div className="card mp-unranked-card mp-private-join-card">
                <div className="mp-mode-card-top">
                  <div className="mp-mode-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' }}>
                    <Key size={22} />
                  </div>
                  <span className="badge badge-amber">Private Code</span>
                </div>
                <h3 className="mp-mode-title">Join with Room ID</h3>
                <p className="mp-mode-desc">
                  Have a friend's room code? Enter the 8-character Room ID below to join their private race.
                </p>

                <form onSubmit={handleJoinWithId} className="mp-join-id-form">
                  <input
                    type="text"
                    className="mp-join-input"
                    placeholder="e.g. DEV-8412"
                    value={joinRoomInput}
                    onChange={(e) => setJoinRoomInput(e.target.value)}
                  />
                  {joinError && <span className="mp-join-error">{joinError}</span>}

                  <div className="mp-mode-footer" style={{ marginTop: 14 }}>
                    <button
                      type="submit"
                      className="btn btn-secondary btn-sm mp-mode-cta"
                      id="btn-submit-join-id"
                    >
                      <ArrowRight size={14} />
                      <span>Join Room by Code</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>

          {/* Recent Arena Matches */}
          <section className="mp-section">
            <div className="card mp-history-card">
              <div className="card-hd">
                <div className="mp-hd-title-group">
                  <Trophy size={16} className="trophy-icon" />
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
          ============================================================ */}
      {viewState === 'setup' && (
        <div className="card mp-setup-panel">
          <div className="mp-setup-header">
            <button
              type="button"
              className="btn btn-ghost btn-xs mp-back-btn"
              onClick={() => setViewState('hub')}
            >
              <ChevronLeft size={14} />
              <span>Back to Arena Hub</span>
            </button>
            <h2 className="mp-setup-title">Configure {activeSetupMode.title}</h2>
          </div>

          <div className="mp-setup-grid">
            <div className="mp-setup-form">
              <div className="mp-field-group">
                <label className="mp-lbl">Room Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={setupRoomName}
                  onChange={(e) => setSetupRoomName(e.target.value)}
                  placeholder="e.g. Speed Demon Race"
                />
              </div>

              <div className="mp-field-row">
                <div className="mp-field-group">
                  <label className="mp-lbl">Programming Language</label>
                  <select
                    className="select-field"
                    value={setupLang}
                    onChange={(e) => setSetupLang(e.target.value)}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mp-field-group">
                  <label className="mp-lbl">Difficulty Tier</label>
                  <select
                    className="select-field"
                    value={setupDiff}
                    onChange={(e) => setSetupDiff(e.target.value)}
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mp-field-row">
                <div className="mp-field-group">
                  <label className="mp-lbl">Max Participants</label>
                  <select
                    className="select-field"
                    value={setupMaxPlayers}
                    onChange={(e) => setSetupMaxPlayers(Number(e.target.value))}
                  >
                    <option value={2}>2 Racers (1v1)</option>
                    <option value={4}>4 Racers (Standard)</option>
                    <option value={8}>8 Racers (Large)</option>
                  </select>
                </div>

                <div className="mp-field-group">
                  <label className="mp-lbl">Privacy</label>
                  <select
                    className="select-field"
                    value={setupIsPrivate ? 'private' : 'public'}
                    onChange={(e) => setSetupIsPrivate(e.target.value === 'private')}
                  >
                    <option value="public">Public Matchmaking</option>
                    <option value="private">Private (Invite Link / Code Only)</option>
                  </select>
                </div>
              </div>

              <div className="mp-setup-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirmCreateRoom}
                  id="btn-confirm-create-room"
                >
                  <Play size={14} fill="currentColor" />
                  <span>Launch Arena Lobby</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          VIEW 3: ACTIVE SYNCHRONIZED RACE ROOM
          ============================================================ */}
      {viewState === 'room' && activeRoom && (
        <div className="practice-workspace-root mp-room-workspace">
          {/* Header Telemetry Bar */}
          <div className="practice-header-container mp-room-header-bar card">
            <div className="ph-left-meta">
              <span className="badge badge-indigo">{activeRoom.modeName}</span>
              <h2 className="ph-title">{activeRoom.name}</h2>
              <div
                className="mp-code-share-chip"
                onClick={handleCopyCode}
                title="Click to copy Room Code"
              >
                <span>Room Code:</span>
                <strong>{activeRoom.code}</strong>
                {isCopiedCode ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
              </div>
            </div>

            <div className="ph-center-metrics">
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

          {/* Main Workspace Layout */}
          <div className="practice-layout-grid mp-room-grid">
            <div className="practice-left-column">
              {/* Synchronized Competitors Race Track */}
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

              {/* Code Practice Editor */}
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
                        <p>Racers are readying up. When ready, click Start Race to begin the race!</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleStartCountdown}
                    >
                      <Play size={13} fill="currentColor" />
                      <span>Start Race</span>
                    </button>
                  </div>
                )}
              </div>

              <VirtualKeyboard
                targetChar={currentTargetChar}
                lastPressedCode={lastPressedCode}
              />
            </div>

            {/* Right Column: Lobby Participants & Telemetry */}
            <div className="practice-right-column">
              <div className="card mp-lobby-roster-card">
                <div className="card-hd">
                  <h3 className="card-title">Racers in Lobby</h3>
                  <span className="badge badge-indigo">
                    {(activeRoom.participants || []).length} / {activeRoom.maxPlayers}
                  </span>
                </div>

                <div className="card-bd mp-lobby-roster-bd">
                  {(activeRoom.participants || []).map((p) => (
                    <div key={p.id} className="mp-roster-item">
                      <div className="roster-avatar">{p.avatar}</div>
                      <div className="roster-info">
                        <span className="roster-name">{p.name}</span>
                        <span className="roster-meta">
                          {p.isHuman ? 'You (Human Racer)' : 'Benchmark Bot'}
                        </span>
                      </div>
                      <div className="roster-status">
                        {p.isReady ? (
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
          VIEW 5: RESULTS PODIUM & ELO RATING ADJUSTMENT
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

            {/* ELO Rating Adjustment Card (if Ranked) */}
            {lastEloResult ? (
              <div className="card mp-elo-results-card">
                <div className="mp-elo-results-header">
                  <span className="mp-elo-results-label">COMPETITIVE ELO RATING ADJUSTMENT</span>
                  <span
                    className={`mp-elo-delta-pill ${
                      lastEloResult.delta > 0 ? 'is-gain' : 'is-loss'
                    }`}
                  >
                    {lastEloResult.delta > 0 ? `+${lastEloResult.delta}` : lastEloResult.delta} ELO
                  </span>
                </div>
                <div className="mp-elo-transition-row">
                  <div className="mp-elo-point">
                    <span className="mp-elo-sub">PREVIOUS RATING</span>
                    <strong className="mp-elo-val">{lastEloResult.oldRating} ELO</strong>
                  </div>
                  <div className="mp-elo-arrow">➔</div>
                  <div className="mp-elo-point">
                    <span className="mp-elo-sub">UPDATED RATING</span>
                    <strong className="mp-elo-val is-new-rating" style={{ color: userTier.color }}>
                      {lastEloResult.rating} ELO
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card mp-elo-results-card is-casual">
                <div className="mp-elo-results-header">
                  <span className="mp-elo-results-label">UNRANKED CASUAL MATCH</span>
                  <span className="badge badge-teal">Rating Unchanged</span>
                </div>
                <p className="mp-elo-casual-desc">
                  This was an unranked practice match. Your competitive ELO ladder rating remains at{' '}
                  <strong>{userElo.rating} ELO</strong>.
                </p>
              </div>
            )}

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
                onClick={() => navigate('/leaderboard')}
              >
                <Trophy size={14} />
                <span>View Leaderboard</span>
              </button>
              <button
                type="button"
                className="btn btn-ghost"
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
