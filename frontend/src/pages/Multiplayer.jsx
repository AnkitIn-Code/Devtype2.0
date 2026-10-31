import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Trophy, Swords, Bug, Users, Key,
  AlertCircle, RefreshCw, ChevronRight, Zap, Shield, ArrowRight
} from 'lucide-react';
import { multiplayerService, connectMultiplayer } from '../services/multiplayerService';
import { leaderboardService } from '../services/leaderboardService';
import { templateService } from '../services/templateService';
import { useAuth } from '../context/AuthContext';
import { ELO_EVENT_NAME, syncUserEloFromDatabase } from '../utils/eloRatingStore';

// Modals & Sub-Views
import RankedMatchModal from '../components/multiplayer/RankedMatchModal';
import MultiplayerRaceEditor from '../components/multiplayer/MultiplayerRaceEditor';
import RankResultsModal from '../components/multiplayer/RankResultsModal';
import BugFixRace from '../components/multiplayer/BugFixRace';
import PrivateRoomView from '../components/multiplayer/PrivateRoomView';
import { getAllPredefinedTemplates } from '../data/predefinedBlueprints';

export default function Multiplayer() {
  const { user } = useAuth();

  // App Navigation / View State
  // 'lobby' | 'ranked-modal' | 'racing' | 'ranked-results' | 'bug-fix' | 'private-room'
  const [activeView, setActiveView] = useState(() => {
    const savedRoomId = sessionStorage.getItem('devtype_active_room_id');
    const savedRoomMode = sessionStorage.getItem('devtype_active_room_mode');
    if (savedRoomId && savedRoomMode) {
      return savedRoomMode === 'private-room' ? 'private-room' : 'racing';
    }
    return 'lobby';
  });

  // Matchmaking State
  const [matchmakingMode, setMatchmakingMode] = useState('classic'); // 'classic' | 'duel'
  const [matchmakingError, setMatchmakingError] = useState('');
  const [isRankedModalOpen, setIsRankedModalOpen] = useState(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);

  // Core Room & Connection State
  // IMPORTANT: WebSocket connection is NOT opened when user is merely on the lobby page!
  const [room, setRoom] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'connecting' | 'connected' | 'disconnected'
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Join Room Code Input
  const [joinCode, setJoinCode] = useState('');

  // Data - Eager initialized with 100+ predefined blueprints
  const [templates, setTemplates] = useState(() => getAllPredefinedTemplates());
  const [rank, setRank] = useState(null);

  // Paginated History State
  const [historyItems, setHistoryItems] = useState([]);
  const [historyPage, setHistoryPage] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // WebSocket Connection Ref
  const connectionRef = useRef(null);
  const latestRoomRef = useRef(null);

  // Load Paginated History
  const loadHistory = useCallback(async (pageToLoad = 0, isInitial = false) => {
    setIsLoadingHistory(true);
    try {
      const res = await multiplayerService.history(pageToLoad, 8);
      if (res && res.content) {
        setHistoryItems((prev) => (isInitial ? res.content : [...prev, ...res.content]));
        setHistoryPage(res.page || pageToLoad);
        setHasMoreHistory(res.hasMore ?? false);
      } else if (Array.isArray(res)) {
        setHistoryItems(res);
        setHasMoreHistory(false);
      }
    } catch (err) {
      console.warn('History fetch:', err.message);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const closeWebSocket = useCallback(() => {
    if (connectionRef.current) {
      try {
        connectionRef.current.close();
      } catch {
        /* noop */
      }
      connectionRef.current = null;
    }
    setStatus('idle');
  }, []);

  // Initial Data Load (Templates, User Rank, History Page 0)
  // NOTICE: No WebSocket is opened here!
  useEffect(() => {
    let alive = true;

    // Load templates from both multiplayer and platform catalog
    Promise.allSettled([
      multiplayerService.templates(),
      templateService.getTemplates({ size: 100 })
    ]).then(([mpRes, tplRes]) => {
      if (!alive) return;
      const mpList = mpRes.status === 'fulfilled' && Array.isArray(mpRes.value) ? mpRes.value : [];
      const tplList = tplRes.status === 'fulfilled' && Array.isArray(tplRes.value?.items) ? tplRes.value.items : [];
      const backendTemplates = [
        ...mpList,
        ...tplList.map((t) => ({
          id: t.id,
          title: t.title,
          language: t.language,
          difficulty: t.difficulty,
          content: t.content || '',
          code: t.content || '',
          bugFix: false,
        }))
      ];
      const initialPredefined = getAllPredefinedTemplates();
      const merged = [...backendTemplates, ...initialPredefined];
      const seen = new Set();
      const unique = [];
      for (const item of merged) {
        const key = `${(item.title || '').toLowerCase()}-${(item.language || '').toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(item);
        }
      }
      if (unique.length > 0) setTemplates(unique);
    }).catch((e) => console.warn('Templates catalog load:', e.message));

    // Load User Current Rank
    leaderboardService.getMyRank()
      .then((data) => {
        if (alive && data) setRank(data);
      })
      .catch(() => {});

    // Load Initial History
    multiplayerService.history(0, 8)
      .then((res) => {
        if (alive) {
          if (res && res.content) {
            setHistoryItems(res.content);
            setHistoryPage(res.page || 0);
            setHasMoreHistory(res.hasMore ?? false);
          } else if (Array.isArray(res)) {
            setHistoryItems(res);
            setHasMoreHistory(false);
          }
        }
      })
      .catch((err) => console.warn('History fetch:', err.message));

    // Check and restore active ongoing room on page reload/mount!
    multiplayerService.current()
      .then((activeRoom) => {
        if (!alive) return;
        if (activeRoom && ['SEARCHING', 'READY', 'COUNTDOWN', 'RACING'].includes(activeRoom.state)) {
          sessionStorage.setItem('devtype_active_room_id', activeRoom.id);
          sessionStorage.setItem('devtype_active_room_mode', activeRoom.mode);
          setRoom(activeRoom);
          latestRoomRef.current = activeRoom;
          const socketConn = establishWebSocket();
          socketConn.watch(activeRoom.id);
          if (activeRoom.mode === 'private-room') {
            setActiveView('private-room');
          } else {
            setActiveView('racing');
          }
        } else {
          sessionStorage.removeItem('devtype_active_room_id');
          sessionStorage.removeItem('devtype_active_room_mode');
          setRoom(null);
          latestRoomRef.current = null;
          setActiveView('lobby');
        }
      })
      .catch((err) => {
        sessionStorage.removeItem('devtype_active_room_id');
        sessionStorage.removeItem('devtype_active_room_mode');
        setActiveView('lobby');
        console.debug('No active multiplayer room to restore:', err.message);
      });

    return () => {
      alive = false;
      closeWebSocket();
    };
  }, [user?.id, closeWebSocket]);

  const handleLoadMoreHistory = () => {
    if (!isLoadingHistory && hasMoreHistory) {
      loadHistory(historyPage + 1, false);
    }
  };

  // Safe WebSocket connection management (only opened when match is entered!)
  const establishWebSocket = () => {
    if (connectionRef.current) return connectionRef.current;

    const conn = connectMultiplayer({
      onState: (updatedRoom) => {
        if (!updatedRoom) {
          latestRoomRef.current = null;
          setRoom(null);
          sessionStorage.removeItem('devtype_active_room_id');
          sessionStorage.removeItem('devtype_active_room_mode');
          return;
        }

        latestRoomRef.current = updatedRoom;
        setRoom(updatedRoom);

        if (['SEARCHING', 'READY', 'COUNTDOWN', 'RACING'].includes(updatedRoom.state)) {
          sessionStorage.setItem('devtype_active_room_id', updatedRoom.id);
          sessionStorage.setItem('devtype_active_room_mode', updatedRoom.mode);
        } else if (updatedRoom.state === 'COMPLETED' || updatedRoom.state === 'CANCELLED') {
          sessionStorage.removeItem('devtype_active_room_id');
          sessionStorage.removeItem('devtype_active_room_mode');
        }

        // When a ranked race finishes, show results modal
        if (updatedRoom.state === 'COMPLETED') {
          const isRankedMatch = updatedRoom.mode === 'classic' || updatedRoom.mode === 'duel';
          if (isRankedMatch) {
            setIsResultsModalOpen(true);
            // Refresh ELO
            leaderboardService.getMyRank().then((data) => {
              if (data) {
                setRank(data);
                syncUserEloFromDatabase(user?.id, data);
                window.dispatchEvent(new Event(ELO_EVENT_NAME));
                try {
                  localStorage.setItem('devtype_last_rating_update', Date.now().toString());
                } catch { /* storage fallback */ }
              }
            });
            // Refresh history
            loadHistory(0, true);
          }
        }
      },
      onChat: (newChat) => {
        if (!newChat) return;
        setRoom((prev) => {
          if (!prev) return prev;
          const currentChats = prev.chat || [];
          if (currentChats.some((c) => c.requestId === newChat.requestId || (c.id && c.id === newChat.id))) return prev;
          const updated = { ...prev, chat: [...currentChats, newChat] };
          latestRoomRef.current = updated;
          return updated;
        });
      },
      onStatus: (st) => setStatus(st),
      onError: (err) => setError(err),
    });

    connectionRef.current = conn;
    return conn;
  };

  // Send socket events
  const send = (type, payload = {}) => {
    try {
      if (connectionRef.current) {
        connectionRef.current.send(type, payload);
        setError('');
      }
    } catch (e) {
      setError(e.message);
    }
  };

  // Leave active race / room and close socket
  const handleLeaveMatch = async () => {
    sessionStorage.removeItem('devtype_active_room_id');
    sessionStorage.removeItem('devtype_active_room_mode');
    if (connectionRef.current) {
      try {
        send('LEAVE');
      } catch {
        /* noop */
      }
    }
    try {
      await multiplayerService.leaveRoom();
    } catch (_) {
      /* ignore */
    }
    closeWebSocket();
    setRoom(null);
    latestRoomRef.current = null;
    setActiveView('lobby');
    setIsResultsModalOpen(false);
    setIsRankedModalOpen(false);
    loadHistory(0, true);
  };

  // ── 1. Ranked Matchmaking Flow ──
  const handleOpenRankedModal = (mode) => {
    setMatchmakingMode(mode);
    setMatchmakingError('');
    setIsRankedModalOpen(true);
  };

  const handleCloseRankedModal = () => {
    setIsRankedModalOpen(false);
    setMatchmakingError('');
    if (room && (room.state === 'SEARCHING' || room.state === 'WAITING')) {
      handleLeaveMatch();
    } else {
      closeWebSocket();
    }
  };

  const handleStartRankedMatchmaking = async (mode, language) => {
    setBusy(true);
    setError('');
    setMatchmakingError('');
    try {
      // Call backend enter with mode and language. Random template is selected by system!
      const initialRoom = await multiplayerService.enter(
        mode,
        null,
        mode === 'duel' ? 2 : 4,
        language
      );

      if (initialRoom) {
        setRoom(initialRoom);
        latestRoomRef.current = initialRoom;

        // Open WebSocket connection now that user entered match
        const socketConn = establishWebSocket();
        socketConn.watch(initialRoom.id);

        // Check if room is already filled (READY, COUNTDOWN, RACING)
        if (['READY', 'COUNTDOWN', 'RACING'].includes(initialRoom.state)) {
          setIsRankedModalOpen(false);
          setActiveView('racing');
        } else {
          // If searching, keep radar modal open until WebSocket emits state change
          const interval = setInterval(() => {
            const current = latestRoomRef.current;
            if (current && ['READY', 'COUNTDOWN', 'RACING'].includes(current.state)) {
              clearInterval(interval);
              setIsRankedModalOpen(false);
              setActiveView('racing');
            }
          }, 500);
        }
      }
    } catch (e) {
      setMatchmakingError(e.message || 'Unable to join ranked matchmaking queue.');
      closeWebSocket();
    } finally {
      setBusy(false);
    }
  };

  // ── 2. Bug Fix Race Flow (Unranked Solo) ──
  const handleOpenBugFix = () => {
    setActiveView('bug-fix');
  };

  // ── 3. Private Room Flow (Unranked Custom) ──
  const handleCreatePrivateRoom = async () => {
    setBusy(true);
    setError('');
    try {
      // Pick initial numeric template if available, else 0 (server picks a valid published template)
      const numericTpl = templates.find((t) => typeof t.id === 'number' && t.id > 0 && !t.bugFix);
      const initialTplId = numericTpl ? numericTpl.id : 0;

      const newRoom = await multiplayerService.enter('private-room', initialTplId, 4);
      if (newRoom) {
        setRoom(newRoom);
        latestRoomRef.current = newRoom;
        const socketConn = establishWebSocket();
        socketConn.watch(newRoom.id);
        setActiveView('private-room');
      }
    } catch (e) {
      setError(e.message || 'Failed to create private room.');
      closeWebSocket();
    } finally {
      setBusy(false);
    }
  };

  const handleJoinPrivateRoom = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setBusy(true);
    setError('');
    try {
      const joinedRoom = await multiplayerService.join(joinCode.trim());
      if (joinedRoom) {
        setRoom(joinedRoom);
        latestRoomRef.current = joinedRoom;
        const socketConn = establishWebSocket();
        socketConn.watch(joinedRoom.id);
        setActiveView('private-room');
        setJoinCode('');
      }
    } catch (e) {
      setError(e.message || 'Invalid or expired Room ID.');
      closeWebSocket();
    } finally {
      setBusy(false);
    }
  };

  const me = room?.players?.find((p) => String(p.id) === String(user?.id));

  return (
    <div className="multiplayer-page-root">
      {/* Global Error Banner */}
      {error && (
        <div role="alert" className="error-banner">
          <AlertCircle size={15} />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ============================================================
          VIEW 1: MULTIPLAYER LOBBY (MAIN SCREEN)
          ============================================================ */}
      {activeView === 'lobby' && (
        <>
          {/* Unified Modern Hero Banner */}
          <div className="mp-hero-banner">
            <div className="mp-hero-content">
              <div className="mp-hero-badge">
                <span className="pulse-dot" />
                <span>Live PvP Matchmaking</span>
              </div>
              <h1 className="mp-hero-title">Multiplayer Arena</h1>
              <p className="mp-hero-description">
                Real-time competitive developer typing races, AI-driven bug fixing drills, and custom private rooms. Test your reflexes against engineers worldwide.
              </p>
            </div>

            {rank && (
              <div className="mp-hero-profile-card">
                <div className="mp-hero-card-header">
                  <span className="mp-card-tier-label">COMPETITIVE STANDING</span>
                  <span className={`mp-card-tier-tag tier-${(rank.tier || 'unranked').toLowerCase()}`}>
                    {rank.tier || 'Unranked'}
                  </span>
                </div>
                <div className="mp-hero-rating-row">
                  <div className="mp-hero-rating-num-wrap">
                    <span className="mp-rating-number">{rank.rating || 1000}</span>
                    <span className="mp-rating-unit">ELO</span>
                  </div>
                  {(rank.globalRank ?? rank.rank) ? (
                    <div className="mp-standing-pill">
                      <Trophy size={13} />
                      <span>Rank #{rank.globalRank ?? rank.rank}</span>
                    </div>
                  ) : (
                    <div className="mp-standing-pill">
                      <span>Provisional</span>
                    </div>
                  )}
                </div>
                {status !== 'idle' && (
                  <div className="mp-hero-connection-status">
                    <span
                      className="status-dot"
                      style={{
                        background:
                          status === 'connected'
                            ? '#10B981'
                            : status === 'connecting'
                            ? '#F59E0B'
                            : '#EF4444',
                      }}
                    />
                    <span className="status-label">Network: {status}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── SECTION 1: RANKED MATCHES ── */}
          <div className="mp-section">
            <div className="mp-section-header-row">
              <div className="mp-section-title-wrap">
                <div className="mp-section-icon-badge is-ranked">
                  <Trophy size={18} />
                </div>
                <div>
                  <div className="mp-section-eyebrow">Competitive Ladder</div>
                  <h2 className="mp-section-heading">Ranked Match</h2>
                </div>
              </div>
              <span className="mp-stakes-pill is-ranked-pill">
                <Zap size={12} /> Rated Matches · ELO at Stake
              </span>
            </div>

            <p className="mp-section-desc">
              Climb the global leaderboard. Choose your programming field, and the platform selects a fair random template for all participants.
            </p>

            <div className="mp-ranked-cards-grid">
              {/* Card 1: Classic Race */}
              <div className="mp-game-mode-card">
                <div className="mp-mode-card-top">
                  <div className="mp-mode-icon-wrap" style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563EB' }}>
                    <Trophy size={22} />
                  </div>
                  <span className="mp-mode-badge" style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563EB' }}>
                    Ranked Sprint
                  </span>
                </div>
                <h3 className="mp-mode-title">Classic Race</h3>
                <p className="mp-mode-desc">
                  Simultaneous 4-player code typing sprint. Top 2 finishers gain competitive ELO rating; lower ranks lose points.
                </p>
                <div className="mp-mode-stakes-info">
                  <Zap size={13} style={{ color: '#F59E0B' }} />
                  <span className="stakes-label">ELO Stakes:</span>
                  <span className="stakes-value">+20 to +32 on Win</span>
                  <span className="stakes-players">4 Players</span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary mp-mode-cta"
                  disabled={busy}
                  onClick={() => handleOpenRankedModal('classic')}
                >
                  <span>Race Now</span>
                  <ChevronRight size={15} />
                </button>
              </div>

              {/* Card 2: 1v1 Duel */}
              <div className="mp-game-mode-card is-duel-highlight">
                <div className="mp-mode-card-top">
                  <div className="mp-mode-icon-wrap" style={{ background: 'rgba(225, 29, 72, 0.12)', color: '#E11D48' }}>
                    <Swords size={22} />
                  </div>
                  <span className="mp-mode-badge" style={{ background: 'rgba(225, 29, 72, 0.12)', color: '#E11D48' }}>
                    High Stakes
                  </span>
                </div>
                <h3 className="mp-mode-title">1v1 Duel</h3>
                <p className="mp-mode-desc">
                  High-intensity head-to-head duel. Out-type your opponent in speed and precision to seize maximum ELO points.
                </p>
                <div className="mp-mode-stakes-info">
                  <Zap size={13} style={{ color: '#E11D48' }} />
                  <span className="stakes-label">ELO Stakes:</span>
                  <span className="stakes-value">Winner Takes All ELO</span>
                  <span className="stakes-players">2 Players</span>
                </div>
                <button
                  type="button"
                  className="btn btn-rose-cta mp-mode-cta"
                  disabled={busy}
                  onClick={() => handleOpenRankedModal('duel')}
                >
                  <span>Enter Duel</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Section Divider */}
          <div className="mp-section-divider">
            <div className="divider-line" />
            <span className="divider-tag">UNRANKED CASUAL MODES</span>
            <div className="divider-line" />
          </div>

          {/* ── SECTION 2: UNRANKED MATCHES ── */}
          <div className="mp-section">
            <div className="mp-section-header-row">
              <div className="mp-section-title-wrap">
                <div className="mp-section-icon-badge is-unranked">
                  <Shield size={18} />
                </div>
                <div>
                  <div className="mp-section-eyebrow">Casual Play</div>
                  <h2 className="mp-section-heading">Unranked Match</h2>
                </div>
              </div>
              <span className="mp-stakes-pill is-unranked-pill">
                <Shield size={12} /> Casual Play · Zero Rating Impact
              </span>
            </div>

            <p className="mp-section-desc">
              Sharpen your engineering reflexes without worrying about your competitive rating. Challenge DeepSeek AI in Bug Fix or race with colleagues in private rooms.
            </p>

            <div className="mp-unranked-cards-grid">
              {/* Card 1: Bug Fix Race */}
              <div className="mp-unranked-card">
                <div className="mp-mode-card-top">
                  <div className="mp-mode-icon-wrap" style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0284C7' }}>
                    <Bug size={22} />
                  </div>
                  <span className="mp-mode-badge" style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0284C7' }}>
                    AI Solo
                  </span>
                </div>
                <h3 className="mp-mode-title">Bug Fix Race</h3>
                <p className="mp-mode-desc">
                  Pick any template from the catalog or Custom Studio. DeepSeek AI inserts subtle syntax & logic bugs. Edit and patch the defects directly without retyping!
                </p>
                <div className="mp-card-meta-line">
                  <Users size={12} /> 1 Player (Solo vs AI) · Instant Play
                </div>
                <button
                  type="button"
                  className="btn btn-secondary mp-mode-cta"
                  onClick={handleOpenBugFix}
                >
                  <span>Launch Bug Fix</span>
                  <ChevronRight size={15} />
                </button>
              </div>

              {/* Card 2: Private Room */}
              <div className="mp-unranked-card">
                <div className="mp-mode-card-top">
                  <div className="mp-mode-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
                    <Users size={22} />
                  </div>
                  <span className="mp-mode-badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
                    Custom Room
                  </span>
                </div>
                <h3 className="mp-mode-title">Private Room</h3>
                <p className="mp-mode-desc">
                  Create a custom room with flexible capacity (2-8). Select any template across the application and race together with friends using a unique Room ID.
                </p>
                <div className="mp-card-meta-line">
                  <Users size={12} /> 2–8 Players · Host Controlled
                </div>
                <button
                  type="button"
                  className="btn btn-secondary mp-mode-cta"
                  disabled={busy}
                  onClick={handleCreatePrivateRoom}
                >
                  <span>Create Private Room</span>
                  <ChevronRight size={15} />
                </button>
              </div>

              {/* Card 3: Join Private Room using code */}
              <div className="mp-unranked-card">
                <div className="mp-mode-card-top">
                  <div className="mp-mode-icon-wrap" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6' }}>
                    <Key size={22} />
                  </div>
                  <span className="mp-mode-badge" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6' }}>
                    Join by Code
                  </span>
                </div>
                <h3 className="mp-mode-title">Join Private Room</h3>
                <p className="mp-mode-desc">
                  Have an 8-character Room ID from a friend? Enter it below to immediately join their custom race lobby.
                </p>
                <form className="mp-join-code-form" onSubmit={handleJoinPrivateRoom}>
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="8-CHAR ID"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="mp-join-input"
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={busy || !/^[A-Z2-9]{8}$/.test(joinCode.trim())}
                  >
                    Join
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* ── SECTION 3: RECENT MATCHES HISTORY ── */}
          <div className="mp-section">
            <div className="card lb-table-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">
                    <Trophy size={16} style={{ color: '#F59E0B' }} />
                    <span>Recent Matches History</span>
                  </h3>
                  <p className="card-subtitle">
                    Synchronized from PostgreSQL records. Review your recent ranked duels, sprints, and casual races.
                  </p>
                </div>
                {historyItems.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => loadHistory(0, true)}
                    disabled={isLoadingHistory}
                  >
                    <RefreshCw size={13} className={isLoadingHistory ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                  </button>
                )}
              </div>

              <div className="mp-history-container">
                {historyItems.length === 0 ? (
                  <div className="mp-empty-history-box">
                    <div className="empty-history-icon">
                      <Trophy size={32} style={{ color: 'var(--t3)' }} />
                    </div>
                    <h4>No Match History Yet</h4>
                    <p>
                      You haven't participated in any multiplayer races yet. Jump into a Ranked Match or create a Private Room to start building your record!
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleOpenRankedModal('classic')}
                    >
                      <span>Find First Match</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="lb-table-scroll-wrapper">
                      <table className="lb-roster-table">
                        <thead>
                          <tr>
                            <th>Match Type</th>
                            <th>Date & Time</th>
                            <th>Room ID</th>
                            <th>Time Elapsed</th>
                            <th>Errors</th>
                            <th>Rating Impact</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historyItems.map((h, i) => {
                            const delta = h.new_rating != null ? h.new_rating - h.old_rating : null;
                            const isGain = delta != null && delta >= 0;
                            const elapsedSec = h.elapsed_ms ? (h.elapsed_ms / 1000).toFixed(1) + 's' : '—';
                            const isRanked = h.match_type === 'Ranked' || h.season_id != null || h.is_ranked || (h.mode && (h.mode === 'classic' || h.mode === 'duel')) || (h.new_rating != null && h.new_rating !== h.old_rating);

                            return (
                              <tr key={h.room_id || i} className="roster-row">
                                <td>
                                  <span className={`mp-match-type-pill ${isRanked ? 'type-ranked' : 'type-unranked'}`}>
                                    {isRanked ? (
                                      <>
                                        <Swords size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                                        <span>Ranked</span>
                                      </>
                                    ) : (
                                      <>
                                        <Shield size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                                        <span>Unranked</span>
                                      </>
                                    )}
                                  </span>
                                </td>
                                <td>{new Date(h.completed_at).toLocaleString()}</td>
                                <td className="font-mono">{h.room_id}</td>
                                <td className="font-mono">{elapsedSec}</td>
                                <td>
                                  <span className={`mp-errors-tag ${(h.errors || 0) > 0 ? 'has-errors' : 'clean'}`}>
                                    {h.errors || 0} mistake{h.errors !== 1 ? 's' : ''}
                                  </span>
                                </td>
                                <td>
                                  {delta != null ? (
                                    <span className={`mp-table-delta ${isGain ? 'delta-gain' : 'delta-loss'}`}>
                                      {isGain ? '+' : ''}{delta} ELO
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: '0.78rem', color: 'var(--t3)' }}>Unranked</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination / Lazy Load More */}
                    {hasMoreHistory && (
                      <div className="mp-load-more-bar">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={handleLoadMoreHistory}
                          disabled={isLoadingHistory}
                        >
                          {isLoadingHistory ? (
                            <>
                              <RefreshCw size={13} className="animate-spin" />
                              <span>Loading more matches...</span>
                            </>
                          ) : (
                            <span>Load More Matches</span>
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============================================================
          VIEW 2: ACTIVE RANKED RACE
          ============================================================ */}
      {activeView === 'racing' && room && (
        <MultiplayerRaceEditor
          room={room}
          me={me}
          user={user}
          send={send}
          onLeave={handleLeaveMatch}
          status={status}
          isRanked={room.mode === 'classic' || room.mode === 'duel'}
        />
      )}

      {/* ============================================================
          VIEW 3: BUG FIX RACE (SOLO AI)
          ============================================================ */}
      {activeView === 'bug-fix' && (
        <BugFixRace
          templates={templates}
          onExit={handleLeaveMatch}
        />
      )}

      {/* ============================================================
          VIEW 4: PRIVATE ROOM (HOST & GUEST)
          ============================================================ */}
      {activeView === 'private-room' && room && (
        <PrivateRoomView
          room={room}
          user={user}
          send={send}
          onLeave={handleLeaveMatch}
          status={status}
          templates={templates}
        />
      )}

      {/* ============================================================
          MODAL 1: RANKED LANGUAGE SELECTION & 10s-30s MATCHMAKING
          ============================================================ */}
      {isRankedModalOpen && (
        <RankedMatchModal
          isOpen={true}
          onClose={handleCloseRankedModal}
          mode={matchmakingMode}
          templates={templates}
          onStartMatchmaking={handleStartRankedMatchmaking}
          errorMessage={matchmakingError}
        />
      )}

      {/* ============================================================
          MODAL 2: RANKED QUEST RESULTS / STANDINGS
          ============================================================ */}
      <RankResultsModal
        isOpen={isResultsModalOpen}
        room={room}
        user={user}
        onClose={handleLeaveMatch}
      />
    </div>
  );
}
