import { apiFetch, API_BASE_URL } from './api';

export const MULTIPLAYER_MODES = [
  // ── Ranked Section (Competitive ELO Stakes) ──
  {
    id: 'classic',
    title: 'Classic Race',
    section: 'ranked',
    tagline: '4-Player Ranked Sprint',
    description: 'Simultaneous 4-player code typing race. Finish in the top 2 to increase your ELO rating; lower positions lose points.',
    playerRange: '4 Players',
    badge: 'Ranked',
    stakes: '+20 to +32 ELO on Win',
    iconName: 'Flag',
    color: '#2563EB',
    tone: 'cobalt',
  },
  {
    id: 'duel',
    title: '1v1 Battle',
    section: 'ranked',
    tagline: 'Direct Ranked Duel',
    description: 'High-stakes head-to-head duel. Out-type your opponent in speed and precision to seize maximum ELO points.',
    playerRange: '2 Players',
    badge: 'High Stakes',
    stakes: 'Winner Takes All ELO',
    iconName: 'Swords',
    color: '#E11D48',
    tone: 'rose',
  },
  // ── Unranked Section (No Rating Impact) ──
  {
    id: 'bug-fix',
    title: 'Bug Fix Race',
    section: 'unranked',
    tagline: 'Spot & Patch Code Sprint',
    description: 'Inspect intentional syntax bugs, logic errors, and anti-patterns, then type the correct patch under casual unranked conditions.',
    playerRange: '2–6 Players',
    badge: 'Casual',
    stakes: 'No Rating Impact',
    iconName: 'Bug',
    color: '#0284C7',
    tone: 'blue',
  },
  {
    id: 'private-room',
    title: 'Private Room',
    section: 'unranked',
    tagline: 'Custom Room with Friends',
    description: 'Create or join a private room with a Room ID to race with friends without touching your competitive ELO rating.',
    playerRange: '2–8 Players',
    badge: 'Private',
    stakes: 'Casual Friends',
    iconName: 'Users',
    color: '#10B981',
    tone: 'emerald',
  },
];

const base = '/api/v1/multiplayer';
export const multiplayerService = {
  templates: () => apiFetch(`${base}/templates`),
  current: () => apiFetch(`${base}/current`),
  history: (page, size) => {
    if (page != null || size != null) {
      return apiFetch(`${base}/history?page=${page ?? 0}&size=${size ?? 10}`);
    }
    return apiFetch(`${base}/history`);
  },
  enter: (mode, templateId = null, capacity = 4, language = null) =>
    apiFetch(`${base}/enter`, {
      method: 'POST',
      body: JSON.stringify({
        mode,
        templateId: (templateId != null && !isNaN(Number(templateId)) && Number(templateId) > 0) ? Number(templateId) : null,
        language,
        capacity: Number(capacity)
      })
    }),
  leaveRoom: () => apiFetch(`${base}/leave`, { method: 'POST' }),
  join: code => apiFetch(`${base}/join`, { method: 'POST', body: JSON.stringify({ code: code.trim().toUpperCase() }) }),
  closeRoom: roomId => apiFetch(`${base}/close-room`, { method: 'POST', body: JSON.stringify({ roomId }) }),
  generateBugs: ({ templateId, title, language, code }) =>
    apiFetch(`${base}/bug-fix/generate`, {
      method: 'POST',
      body: JSON.stringify({ templateId, title, language, code })
    }),
  verifyBugFix: ({ language, originalCode, buggedCode, submittedCode }) =>
    apiFetch(`${base}/bug-fix/verify`, {
      method: 'POST',
      body: JSON.stringify({ language, originalCode, buggedCode, submittedCode })
    }),
};

// Authentication is sent in the first frame, never a URL or log.
export function connectMultiplayer({ onState, onStatus, onError, onChat }) {
  let socket, stopped = false, attempts = 0, timer, heartbeat, roomId;
  const send = frame => {
    if (socket?.readyState !== WebSocket.OPEN) throw new Error('Reconnect before sending.');
    socket.send(JSON.stringify(frame));
  };
  const connect = () => {
    onStatus('connecting');
    socket = new WebSocket(`${API_BASE_URL.replace(/^http/, 'ws')}/ws/multiplayer`);
    socket.onopen = () => send({ type: 'AUTH', token: localStorage.getItem('devtype_auth_token') });
    socket.onmessage = event => {
      let frame;
      try { frame = JSON.parse(event.data); } catch { onError('Invalid server response.'); return; }
      if (frame.type === 'AUTHENTICATED') {
        attempts = 0; onStatus('connected');
        if (roomId) send({ type: 'SYNC', roomId });
        clearInterval(heartbeat);
        heartbeat = setInterval(() => { if (socket.readyState === WebSocket.OPEN) send(roomId ? { type: 'SYNC', roomId } : { type: 'PING' }); }, 5000);
      }
      if (frame.type === 'STATE') { roomId = frame.room.id; onState(frame.room, frame.serverTime); }
      if (frame.type === 'CHAT' && onChat) { onChat(frame.chat, frame.serverTime); }
      if (frame.type === 'LEFT') { roomId = null; onState(null, Date.now()); }
      if (frame.type === 'ERROR') onError(frame.message);
    };
    socket.onerror = () => onStatus('connection failed');
    socket.onclose = event => {
      clearInterval(heartbeat);
      if (stopped) return;
      if (event.code === 1008) { onStatus('session expired'); onError('Sign in again to restore your session.'); return; }
      if (++attempts > 8) { onStatus('failed'); onError('Connection failed. Reload to retry.'); return; }
      onStatus('reconnecting'); timer = setTimeout(connect, Math.min(30000, 500 * 2 ** attempts) * (0.75 + Math.random() * 0.5));
    };
  };
  connect();
  return {
    watch(id) { roomId = id; if (id && socket?.readyState === WebSocket.OPEN) send({ type: 'SYNC', roomId }); },
    send(type, payload = {}) { send({ type, roomId, ...payload }); },
    close() { stopped = true; clearTimeout(timer); clearInterval(heartbeat); socket?.close(); },
  };
}
