import { useState, useEffect } from 'react';
import {
  Users, Copy, Check, Play, LogOut, AlertTriangle,
  Clock
} from 'lucide-react';
import { multiplayerService } from '../../services/multiplayerService';
import { snippetService } from '../../services/snippetService';
import MultiplayerRaceEditor from './MultiplayerRaceEditor';

export default function PrivateRoomView({
  room,
  user,
  send,
  onLeave,
  status,
  templates,
}) {
  const [copied, setCopied] = useState(false);
  const [allTemplates, setAllTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedCapacity, setSelectedCapacity] = useState(room?.capacity || 4);
  const [closeWarning, setCloseWarning] = useState('');

  const isHost = String(room?.host) === String(user?.id);
  const isRacing = room?.state === 'RACING';
  const me = room?.players?.find((p) => String(p.id) === String(user?.id));
  const isFinished = !!me?.finishedAt;

  // Load both catalog templates and custom studio snippets for host template selection
  useEffect(() => {
    let alive = true;
    async function loadCatalog() {
      const publicTyping = (templates || []).filter((t) => !t.bugFix);
      let customSnippets = [];
      try {
        customSnippets = await snippetService.getCustomSnippets();
      } catch (e) {
        console.warn('Custom snippets failed:', e);
      }

      const merged = [
        ...publicTyping.map((t) => ({
          id: String(t.id),
          title: t.title,
          language: t.language,
          difficulty: t.difficulty,
          source: 'Catalog',
        })),
        ...customSnippets.map((s) => ({
          id: String(s.id || s.slug),
          title: s.title || 'Custom Snippet',
          language: s.language || 'JavaScript',
          difficulty: s.difficulty || 'Intermediate',
          source: 'Custom Studio',
        })),
      ];

      if (alive) {
        setAllTemplates(merged);
        if (merged.length > 0) {
          setSelectedTemplateId((prev) => prev || String(merged[0].id));
        }
      }
    }
    loadCatalog();
    return () => { alive = false; };
  }, [templates]);

  const copyRoomId = () => {
    if (room?.id) {
      navigator.clipboard.writeText(room.id).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleStartMatch = () => {
    // When host clicks start match, ready signal is sent
    send('READY');
  };

  const handleCapacityChange = (cap) => {
    const num = Number(cap);
    setSelectedCapacity(num);
    if (isHost && send) {
      send('CONFIG', { content: JSON.stringify({ capacity: num }) });
    }
  };

  const handleTemplateChange = (tplId) => {
    setSelectedTemplateId(tplId);
    if (isHost && send) {
      send('CONFIG', { content: JSON.stringify({ templateId: Number(tplId) }) });
    }
  };

  // Host closing room with check if everyone completed
  const handleHostCloseRoom = async () => {
    setCloseWarning('');
    if (isRacing) {
      const incomplete = room.players?.filter((p) => !p.forfeited && !p.finishedAt);
      if (incomplete && incomplete.length > 0) {
        setCloseWarning(`Cannot close room: ${incomplete.length} player(s) are still completing the challenge!`);
        return;
      }
    }

    try {
      await multiplayerService.closeRoom(room.id);
      onLeave();
    } catch (err) {
      setCloseWarning(err.message || 'Cannot close room until all players finish.');
    }
  };

  // SUB-VIEW 1: RACING
  if (isRacing && !isFinished) {
    return (
      <MultiplayerRaceEditor
        room={room}
        me={me}
        user={user}
        send={send}
        onLeave={onLeave}
        status={status}
        isRanked={false}
      />
    );
  }

  // SUB-VIEW 2: REPORT PAGE (when current user has completed or race finished)
  if (isFinished || room?.state === 'COMPLETED') {
    const players = room?.players || [];
    const allDone = players.every((p) => p.finishedAt > 0 || p.forfeited);

    return (
      <div className="mp-private-report-root">
        <div className="report-header-bar">
          <div>
            <span className="report-badge">🛡 Private Room Report {allDone ? '· All Finished' : '· Race In Progress'}</span>
            <h1 className="report-title">{room?.title}</h1>
            <p className="report-meta">
              {room?.language} · {room?.difficulty} · Room ID: <strong>{room?.id}</strong>
            </p>
          </div>

          <div className="report-header-actions">
            {isHost ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleHostCloseRoom}
              >
                <LogOut size={14} /> Close Room
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onLeave}
              >
                <LogOut size={14} /> Leave Room
              </button>
            )}
          </div>
        </div>

        {closeWarning && (
          <div className="error-banner">
            <AlertTriangle size={15} />
            <span>{closeWarning}</span>
          </div>
        )}

        {/* Players completion table with live In-Progress updates */}
        <div className="card lb-table-card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Participant Results</h3>
              <p className="card-subtitle">
                Live status updates as each player completes the template. Casual mode has no rating impact.
              </p>
            </div>
            <span className="live-pill">
              <span className="pulse-dot" /> Live Socket Sync
            </span>
          </div>

          <div className="lb-table-scroll-wrapper">
            <table className="lb-roster-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Status</th>
                  <th>Completion Time</th>
                  <th>Progress</th>
                  <th>Accuracy</th>
                  <th>Errors</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p) => {
                  const isMe = String(p.id) === String(user?.id);
                  const isDone = !!p.finishedAt;
                  const elapsedMs = isDone && room.startsAt > 0 ? p.finishedAt - room.startsAt : null;
                  const elapsedSec = elapsedMs ? (elapsedMs / 1000).toFixed(1) + 's' : '—';
                  const pMistakes = p.mistakes ?? p.errors ?? 0;
                  const pAccuracy = p.score && pMistakes ? Math.round((p.score / (p.score + pMistakes)) * 100) : 100;

                  return (
                    <tr key={p.id} className={`roster-row ${isMe ? 'current-user-roster-row' : ''}`}>
                      <td>
                        <div className="mp-dev-cell">
                          <div className="mp-dev-avatar">
                            {(p.name || 'U').slice(0, 2).toUpperCase()}
                          </div>
                          <span className="mp-dev-name">
                            {p.name} {isMe ? '(You)' : ''}
                          </span>
                        </div>
                      </td>
                      <td>
                        {p.forfeited ? (
                          <span className="badge-forfeit">Forfeited</span>
                        ) : isDone ? (
                          <span className="badge-finished">✓ Completed</span>
                        ) : (
                          <span className="badge-in-progress">In Progress...</span>
                        )}
                      </td>
                      <td className="font-mono">{elapsedSec}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <progress
                            value={p.progress || 0}
                            max={100}
                            style={{ width: 90, height: 6, borderRadius: 4 }}
                          />
                          <span className="font-mono" style={{ fontSize: '0.8rem' }}>
                            {Math.round(p.progress || 0)}%
                          </span>
                        </div>
                      </td>
                      <td className="font-mono">{isDone ? `${pAccuracy}%` : '—'}</td>
                      <td>
                        <span className={`mp-errors-tag ${pMistakes > 0 ? 'has-errors' : 'clean'}`}>
                          {pMistakes} error{pMistakes !== 1 ? 's' : ''}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // SUB-VIEW 3: HOST / GUEST WAITING LOBBY
  return (
    <div className="mp-private-lobby-root">
      {/* Top Banner */}
      <div className="private-lobby-top-bar">
        <div>
          <span className="private-lobby-tag">🛡 Custom Private Room</span>
          <h1 className="private-lobby-title">{room?.title || 'Private Match Lobby'}</h1>
          <p className="private-lobby-desc">
            Share the Room ID with friends to race together. Casual match with no rating impact.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onLeave}
        >
          <LogOut size={14} /> Leave Room
        </button>
      </div>

      {closeWarning && (
        <div className="error-banner">
          <AlertTriangle size={15} />
          <span>{closeWarning}</span>
        </div>
      )}

      {/* Main Grid: Left Joined Users | Right Room Capacity & Template Selection */}
      <div className="private-lobby-grid">
        {/* LEFT SECTION: Joined Players */}
        <div className="private-left-panel">
          {/* Room ID Copy Box */}
          <div className="private-room-id-card">
            <div className="room-id-top">
              <span className="room-id-label">ROOM ID (Share with friends)</span>
              <button
                type="button"
                className="btn btn-xs btn-secondary"
                onClick={copyRoomId}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
            <div className="room-id-code">{room?.id}</div>
          </div>

          {/* Connected Racers List */}
          <div className="private-players-card">
            <div className="players-card-hd">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={15} style={{ color: '#10B981' }} />
                <span>Joined Racers ({room?.players?.length || 0}/{room?.capacity || 4})</span>
              </div>
            </div>

            <div className="players-list">
              {room?.players?.map((p) => {
                const isMe = String(p.id) === String(user?.id);
                const isRoomHost = String(p.id) === String(room?.host);

                return (
                  <div key={p.id} className="player-row">
                    <div className="player-avatar">
                      {(p.name || 'U').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="player-meta">
                      <span className="player-name">
                        {p.name} {isMe ? '(You)' : ''}
                      </span>
                      <span className="player-role">
                        {isRoomHost ? '👑 Host' : 'Guest'}
                      </span>
                    </div>
                    <span className="player-ready-badge">
                      {p.ready ? '✓ Ready' : 'In Lobby'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: Host Controls (Capacity & Template Selection) */}
        <div className="private-right-panel">
          <div className="card private-settings-card">
            <div className="card-header">
              <h3 className="card-title">Room Settings</h3>
              <p className="card-subtitle">
                {isHost ? 'Configure capacity and choose race template.' : 'Configured by Room Host.'}
              </p>
            </div>

            <div className="private-settings-body">
              {/* Capacity Selector */}
              <div className="mp-form-group">
                <label className="mp-label">
                  Room Capacity
                  <span className="mp-label-hint">Only up to capacity players can enter</span>
                </label>
                <select
                  className="mp-select"
                  value={selectedCapacity}
                  onChange={(e) => handleCapacityChange(e.target.value)}
                  disabled={!isHost}
                >
                  {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      {n} Players Max
                    </option>
                  ))}
                </select>
              </div>

              {/* Template Selector from Complete Application */}
              <div className="mp-form-group">
                <label className="mp-label">
                  Race Blueprint Template
                  <span className="mp-label-hint">From Templates Catalog or Custom Studio</span>
                </label>
                <select
                  className="mp-select"
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  disabled={!isHost}
                >
                  {allTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.source}] {t.title} · {t.language} ({t.difficulty})
                    </option>
                  ))}
                </select>
              </div>

              {/* Host Start Button / Guest Waiting Banner */}
              <div className="private-start-box">
                {isHost ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-lg w-full"
                    onClick={handleStartMatch}
                  >
                    <Play size={16} />
                    <span>Start Match (Launch All Players)</span>
                  </button>
                ) : (
                  <div className="guest-waiting-banner">
                    <Clock size={16} className="animate-spin text-amber-500" />
                    <span>Waiting for Host to click Start Match...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
