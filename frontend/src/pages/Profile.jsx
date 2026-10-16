// src/pages/Profile.jsx
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Edit3, Flame, Zap, Target, BookOpen,
  Clock, Star, Trophy, Users, Award, CheckCircle2,
  ChevronRight, ArrowRight, X, UserPlus, Check,
  ExternalLink, Calendar, Code2, Globe, Shield
} from 'lucide-react';

import ActivityHeatmap from '../components/common/ActivityHeatmap';
import {
  getStoredProfile, saveStoredProfile,
  getStoredFriends, saveStoredFriends,
  CHALLENGE_STATS, RECENT_ACTIVITY
} from '../data/profileStore';
import { getStoredAchievements } from '../data/achievementsData';

const AVATAR_BG_PRESETS = [
  'linear-gradient(135deg, #1E3A8A, #3B82F6)',
  'linear-gradient(135deg, #7C2D12, #EA580C)',
  'linear-gradient(135deg, #065F46, #10B981)',
  'linear-gradient(135deg, #312E81, #4F46E5)',
  'linear-gradient(135deg, #831843, #EC4899)',
  'linear-gradient(135deg, #075985, #0284C7)',
  'linear-gradient(135deg, #78350F, #D97706)',
  'linear-gradient(135deg, #4C1D95, #8B5CF6)',
];

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(() => getStoredProfile());
  const [friends, setFriends] = useState(() => getStoredFriends());
  const [friendTab, setFriendTab] = useState('connected'); // 'connected' | 'received' | 'sent'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [addFriendInput, setAddFriendInput] = useState('');
  const [addFriendSuccess, setAddFriendSuccess] = useState('');

  // Edit form state
  const [editForm, setEditForm] = useState({
    displayName: profile.displayName,
    title: profile.title,
    bio: profile.bio,
    avatarBg: profile.avatarBg,
  });
  const [editError, setEditError] = useState('');

  // Unlocked achievements from store
  const unlockedBadges = useMemo(() => {
    return getStoredAchievements().filter((a) => a.unlocked).slice(0, 6);
  }, []);

  // Save profile edits
  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!editForm.displayName.trim()) {
      setEditError('Display name cannot be empty');
      return;
    }
    const updated = {
      ...profile,
      displayName: editForm.displayName.trim(),
      title: editForm.title.trim(),
      bio: editForm.bio.trim(),
      avatarBg: editForm.avatarBg,
      avatar: editForm.displayName.trim().slice(0, 2).toUpperCase(),
    };
    setProfile(updated);
    saveStoredProfile(updated);
    setIsEditModalOpen(false);
    setEditError('');
  };

  // Accept incoming friend request
  const handleAcceptFriend = (req) => {
    const newConnected = [
      ...friends.connected,
      {
        ...req,
        status: 'Online',
      },
    ];
    const newReceived = friends.received.filter((r) => r.id !== req.id);
    const updated = { ...friends, connected: newConnected, received: newReceived };
    setFriends(updated);
    saveStoredFriends(updated);
  };

  // Reject / cancel friend request
  const handleRejectFriend = (reqId, type) => {
    if (type === 'received') {
      const updated = {
        ...friends,
        received: friends.received.filter((r) => r.id !== reqId),
      };
      setFriends(updated);
      saveStoredFriends(updated);
    } else if (type === 'sent') {
      const updated = {
        ...friends,
        sent: friends.sent.filter((r) => r.id !== reqId),
      };
      setFriends(updated);
      saveStoredFriends(updated);
    }
  };

  // Send new friend request
  const handleSendFriendRequest = (e) => {
    e.preventDefault();
    if (!addFriendInput.trim()) return;
    const cleanHandle = addFriendInput.trim().replace(/^@/, '');
    const newSent = [
      ...friends.sent,
      {
        id: `sent-${Date.now()}`,
        name: cleanHandle.toLowerCase(),
        displayName: cleanHandle,
        avatar: cleanHandle.slice(0, 2).toUpperCase(),
        avatarBg: 'linear-gradient(135deg, #1E3A8A, #3B82F6)',
        title: 'Developer Peer',
        level: 1,
        bestWpm: 75,
        primaryLang: 'TypeScript',
      },
    ];
    const updated = { ...friends, sent: newSent };
    setFriends(updated);
    saveStoredFriends(updated);
    setAddFriendSuccess(`Friend request sent to @${cleanHandle}`);
    setAddFriendInput('');
    setTimeout(() => {
      setAddFriendSuccess('');
      setIsAddFriendModalOpen(false);
    }, 1500);
  };

  return (
    <div className="dash prof-page-root">
      {/* ==============================================================
          1. PROFILE HEADER CARD (APPLE CUPERTINO LIQUID GLASS)
          ============================================================== */}
      <div className="card prof-header-card">
        <div className="card-bd prof-header-inner">
          <div className="prof-header-left">
            <div
              className="prof-avatar-large"
              style={{ background: profile.avatarBg || '#2563EB' }}
            >
              {profile.avatar}
            </div>

            <div className="prof-identity">
              <div className="prof-name-line">
                <h1 className="prof-display-name">{profile.displayName}</h1>
                <span className="you-pill">YOU</span>
                <span className="level-pill">Level {profile.level}</span>
              </div>

              <div className="prof-meta-line">
                <span className="prof-handle">@{profile.username}</span>
                <span className="prof-sep">•</span>
                <span className="prof-title">{profile.title}</span>
                <span className="prof-sep">•</span>
                <span className="prof-joined">
                  <Calendar size={13} />
                  Joined {profile.joinedDate}
                </span>
              </div>

              {profile.bio && <p className="prof-bio">{profile.bio}</p>}

              {/* XP Progress Bar */}
              <div className="prof-xp-block">
                <div className="prof-xp-labels">
                  <span className="xp-curr-val">
                    {profile.xp.toLocaleString()} / {profile.nextLevelXp.toLocaleString()} XP
                  </span>
                  <span className="xp-to-next">
                    {(profile.nextLevelXp - profile.xp).toLocaleString()} XP to Level {profile.level + 1}
                  </span>
                </div>
                <div className="xp-bar" style={{ height: 6 }}>
                  <div
                    className="xp-bar-fill"
                    style={{
                      width: `${Math.round((profile.xp / profile.nextLevelXp) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="prof-header-right">
            {/* Streak Highlight */}
            <div className="prof-streak-pill">
              <Flame size={18} className="prof-flame" />
              <div className="streak-meta">
                <span className="streak-num">{profile.streak} Day Streak</span>
                <span className="streak-sub">Active &amp; Growing</span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-sm prof-edit-btn"
              onClick={() => {
                setEditForm({
                  displayName: profile.displayName,
                  title: profile.title,
                  bio: profile.bio,
                  avatarBg: profile.avatarBg,
                });
                setIsEditModalOpen(true);
              }}
            >
              <Edit3 size={14} />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==============================================================
          2. SUMMARY STAT CARDS (BEST WPM, AVG WPM, SESSIONS, FAV LANG)
          ============================================================== */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-top">
              <div className="stat-icon-wrap blue">
                <Zap size={19} strokeWidth={2.2} />
              </div>
              <span className="badge badge-teal">Top Speed</span>
            </div>
            <div className="stat-num">{profile.bestWpm} <small style={{ fontSize: '0.8rem', color: 'var(--t3)' }}>WPM</small></div>
            <div className="stat-label">Personal Best Velocity</div>
            <div className="stat-sub">Verified in C++ benchmark run</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-top">
              <div className="stat-icon-wrap teal">
                <Target size={19} strokeWidth={2.2} />
              </div>
              <span className="badge badge-teal">Steady Pace</span>
            </div>
            <div className="stat-num">{profile.avgWpm} <small style={{ fontSize: '0.8rem', color: 'var(--t3)' }}>WPM</small></div>
            <div className="stat-label">Average Practice Speed</div>
            <div className="stat-sub">Calculated across all practice runs</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-top">
              <div className="stat-icon-wrap orange">
                <Clock size={19} strokeWidth={2.2} />
              </div>
              <span className="badge badge-teal">Runs</span>
            </div>
            <div className="stat-num">{profile.sessions}</div>
            <div className="stat-label">Total Practice Sessions</div>
            <div className="stat-sub">42.5 hrs active typing time</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-top">
              <div className="stat-icon-wrap purple">
                <Code2 size={19} strokeWidth={2.2} />
              </div>
              <span className="badge badge-indigo">Primary</span>
            </div>
            <div className="stat-num">{profile.favLang}</div>
            <div className="stat-label">Favorite Language</div>
            <div className="stat-sub">42% of all completed snippets</div>
          </div>
        </div>
      </div>

      {/* ==============================================================
          3. YEARLY ACTIVITY HEATMAP (EXACT REUSABLE COMPONENT)
          ============================================================== */}
      <ActivityHeatmap
        title="Annual Keyboard Telemetry"
        subtitle="Your daily typing activity and streak consistency"
      />

      {/* ==============================================================
          4. RECENT ACHIEVEMENTS & EARNED BADGES SHOWCASE
          ============================================================== */}
      <div className="card prof-ach-card">
        <div className="card-hd">
          <div className="card-hd-left">
            <div className="card-title">
              <Trophy size={18} color="var(--brand)" />
              <span>Earned Badges &amp; Accolades</span>
            </div>
            <div className="card-sub">Recently unlocked developer milestones</div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/achievements')}
          >
            <span>View All (18/46)</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="card-bd">
          <div className="prof-badges-grid">
            {unlockedBadges.map((badge) => (
              <div
                key={badge.id}
                className="prof-badge-item"
                onClick={() => navigate('/achievements')}
                title={`${badge.title}: ${badge.description}`}
              >
                <div className="prof-badge-icon-wrap">
                  <Award size={22} color="#10B981" />
                </div>
                <div className="prof-badge-info">
                  <div className="prof-badge-name">{badge.title}</div>
                  <div className="prof-badge-xp">+{badge.rewardXp} XP</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==============================================================
          5. SOLVED CHALLENGES & FRIENDS DUAL GRID
          ============================================================== */}
      <div className="prof-dual-grid">
        {/* Left: Solved Challenge Statistics */}
        <div className="card prof-challenges-card">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-title">
                <Target size={18} color="var(--brand)" />
                <span>Solved Challenges</span>
              </div>
              <div className="card-sub">Algorithmic mastery split by difficulty</div>
            </div>
            <span className="badge badge-teal">
              {CHALLENGE_STATS.easy.solved + CHALLENGE_STATS.medium.solved + CHALLENGE_STATS.hard.solved} /{' '}
              {CHALLENGE_STATS.easy.total + CHALLENGE_STATS.medium.total + CHALLENGE_STATS.hard.total} Total
            </span>
          </div>

          <div className="card-bd prof-challenges-inner">
            <div className="challenge-bar-row">
              <div className="challenge-bar-header">
                <span className="diff-title" style={{ color: CHALLENGE_STATS.easy.color }}>
                  Easy Challenges
                </span>
                <span className="diff-count">
                  {CHALLENGE_STATS.easy.solved} / {CHALLENGE_STATS.easy.total}
                </span>
              </div>
              <div className="ach-card-bar" style={{ height: 8 }}>
                <div
                  className="ach-card-fill"
                  style={{
                    width: `${Math.round((CHALLENGE_STATS.easy.solved / CHALLENGE_STATS.easy.total) * 100)}%`,
                    background: CHALLENGE_STATS.easy.color,
                  }}
                />
              </div>
            </div>

            <div className="challenge-bar-row">
              <div className="challenge-bar-header">
                <span className="diff-title" style={{ color: CHALLENGE_STATS.medium.color }}>
                  Medium Challenges
                </span>
                <span className="diff-count">
                  {CHALLENGE_STATS.medium.solved} / {CHALLENGE_STATS.medium.total}
                </span>
              </div>
              <div className="ach-card-bar" style={{ height: 8 }}>
                <div
                  className="ach-card-fill"
                  style={{
                    width: `${Math.round((CHALLENGE_STATS.medium.solved / CHALLENGE_STATS.medium.total) * 100)}%`,
                    background: CHALLENGE_STATS.medium.color,
                  }}
                />
              </div>
            </div>

            <div className="challenge-bar-row">
              <div className="challenge-bar-header">
                <span className="diff-title" style={{ color: CHALLENGE_STATS.hard.color }}>
                  Hard Challenges
                </span>
                <span className="diff-count">
                  {CHALLENGE_STATS.hard.solved} / {CHALLENGE_STATS.hard.total}
                </span>
              </div>
              <div className="ach-card-bar" style={{ height: 8 }}>
                <div
                  className="ach-card-fill"
                  style={{
                    width: `${Math.round((CHALLENGE_STATS.hard.solved / CHALLENGE_STATS.hard.total) * 100)}%`,
                    background: CHALLENGE_STATS.hard.color,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Friends Section (Connected, Received, Sent) */}
        <div className="card prof-friends-card">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-title">
                <Users size={18} color="var(--brand)" />
                <span>Developer Peers</span>
              </div>
              <div className="card-sub">Typing colleagues and rivals</div>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsAddFriendModalOpen(true)}
            >
              <UserPlus size={13} />
              <span>Add Friend</span>
            </button>
          </div>

          <div className="card-bd" style={{ padding: '0 0 12px 0' }}>
            {/* Friends Segmented Tabs */}
            <div className="prof-friend-tabs">
              <button
                type="button"
                className={`prof-friend-tab ${friendTab === 'connected' ? 'active' : ''}`}
                onClick={() => setFriendTab('connected')}
              >
                Connected ({friends.connected.length})
              </button>
              <button
                type="button"
                className={`prof-friend-tab ${friendTab === 'received' ? 'active' : ''}`}
                onClick={() => setFriendTab('received')}
              >
                Received ({friends.received.length})
              </button>
              <button
                type="button"
                className={`prof-friend-tab ${friendTab === 'sent' ? 'active' : ''}`}
                onClick={() => setFriendTab('sent')}
              >
                Sent ({friends.sent.length})
              </button>
            </div>

            {/* Friend List */}
            <div className="prof-friends-list">
              {friendTab === 'connected' && (
                friends.connected.length === 0 ? (
                  <div className="empty-state" style={{ padding: '24px 16px' }}>
                    <div className="empty-icon"><Users size={20} /></div>
                    <div className="empty-title">No connected friends yet</div>
                    <div className="empty-desc">Send invites to peers to race and compare rankings.</div>
                  </div>
                ) : (
                  friends.connected.map((friend) => (
                    <div key={friend.id} className="prof-friend-item">
                      <div className="friend-avatar" style={{ background: friend.avatarBg }}>
                        {friend.avatar}
                      </div>
                      <div className="friend-info">
                        <div className="friend-name-row">
                          <span className="friend-name">{friend.displayName}</span>
                          <span className="friend-handle">@{friend.name}</span>
                        </div>
                        <div className="friend-meta">
                          <span>{friend.title}</span>
                          <span>•</span>
                          <span>{friend.bestWpm} WPM</span>
                        </div>
                      </div>
                      <span className={`friend-status-badge ${friend.status.toLowerCase().replace(' ', '-')}`}>
                        {friend.status}
                      </span>
                    </div>
                  ))
                )
              )}

              {friendTab === 'received' && (
                friends.received.length === 0 ? (
                  <div className="empty-state" style={{ padding: '24px 16px' }}>
                    <div className="empty-title">No pending incoming requests</div>
                  </div>
                ) : (
                  friends.received.map((req) => (
                    <div key={req.id} className="prof-friend-item">
                      <div className="friend-avatar" style={{ background: req.avatarBg }}>
                        {req.avatar}
                      </div>
                      <div className="friend-info">
                        <div className="friend-name-row">
                          <span className="friend-name">{req.displayName}</span>
                          <span className="friend-handle">@{req.name}</span>
                        </div>
                        <div className="friend-meta">Lv {req.level} • {req.bestWpm} WPM</div>
                      </div>
                      <div className="friend-actions">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAcceptFriend(req)}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleRejectFriend(req.id, 'received')}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                )
              )}

              {friendTab === 'sent' && (
                friends.sent.length === 0 ? (
                  <div className="empty-state" style={{ padding: '24px 16px' }}>
                    <div className="empty-title">No pending sent requests</div>
                  </div>
                ) : (
                  friends.sent.map((req) => (
                    <div key={req.id} className="prof-friend-item">
                      <div className="friend-avatar" style={{ background: req.avatarBg }}>
                        {req.avatar}
                      </div>
                      <div className="friend-info">
                        <div className="friend-name-row">
                          <span className="friend-name">{req.displayName}</span>
                          <span className="friend-handle">@{req.name}</span>
                        </div>
                        <div className="friend-meta">Pending response...</div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleRejectFriend(req.id, 'sent')}
                      >
                        Cancel
                      </button>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ==============================================================
          6. RECENT ACTIVITY & PRACTICE HISTORY TABLE
          ============================================================== */}
      <div className="card sessions-card">
        <div className="card-hd">
          <div className="card-hd-left">
            <div className="card-title">
              <Clock size={18} color="var(--t3)" />
              <span>Recent Practice History</span>
            </div>
            <div className="card-sub">Your latest authenticated typing sessions</div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/reports')}
          >
            <span>View Full Analytics</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="card-bd" style={{ padding: '0 0 8px 0' }}>
          <div className="lb-table-scroll-wrapper">
            <table className="lb-roster-table" aria-label="Recent Practice Sessions">
              <thead>
                <tr>
                  <th scope="col">Snippet</th>
                  <th scope="col" style={{ width: 110 }}>Language</th>
                  <th scope="col" style={{ width: 100 }}>Difficulty</th>
                  <th scope="col" className="th-right" style={{ width: 100 }}>Speed</th>
                  <th scope="col" className="th-right" style={{ width: 90 }}>Accuracy</th>
                  <th scope="col" className="th-right" style={{ width: 90 }}>Duration</th>
                  <th scope="col" style={{ width: 120 }}>Date</th>
                  <th scope="col" className="th-center" style={{ width: 80 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_ACTIVITY.map((act) => (
                  <tr key={act.id} className="roster-row">
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{act.snippetName}</span>
                    </td>
                    <td>
                      <div className="session-lang" style={{ gap: 6 }}>
                        <div className="lang-dot" style={{ background: '#2563EB' }} />
                        <span>{act.language}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-teal">{act.difficulty}</span>
                    </td>
                    <td className="th-right">
                      <span className="metric-primary-text">{act.wpm} WPM</span>
                    </td>
                    <td className="th-right">
                      <span className="metric-acc-text">{act.accuracy}%</span>
                    </td>
                    <td className="th-right">
                      <span className="metric-sessions-text">{act.duration}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: 'var(--t3)' }}>{act.date}</span>
                    </td>
                    <td className="th-center">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate('/practice')}
                        style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ==============================================================
          7. EDIT PROFILE MODAL (VALIDATED & PERSISTED)
          ============================================================== */}
      {isEditModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
          <div
            className="modal-box prof-edit-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-title">Edit Developer Profile</div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsEditModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="prof-edit-form">
              {editError && <div className="modal-error-pill">{editError}</div>}

              {/* Avatar Preset Selector */}
              <div className="form-group">
                <label className="form-label">Avatar Background</label>
                <div className="avatar-preset-row">
                  {AVATAR_BG_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`avatar-preset-btn ${editForm.avatarBg === preset ? 'selected' : ''}`}
                      style={{ background: preset }}
                      onClick={() => setEditForm((f) => ({ ...f, avatarBg: preset }))}
                    >
                      {editForm.avatarBg === preset && <Check size={14} color="#FFF" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="edit-display-name">
                  Display Name *
                </label>
                <input
                  id="edit-display-name"
                  type="text"
                  required
                  value={editForm.displayName}
                  onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
                  className="lb-search-field"
                  placeholder="e.g. Alex Spoor"
                />
              </div>

              {/* Title / Role */}
              <div className="form-group">
                <label className="form-label" htmlFor="edit-title">
                  Engineering Title / Focus
                </label>
                <input
                  id="edit-title"
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="lb-search-field"
                  placeholder="e.g. Full Stack Systems Engineer"
                />
              </div>

              {/* Bio */}
              <div className="form-group">
                <label className="form-label" htmlFor="edit-bio">
                  Short Bio (max 160 chars)
                </label>
                <textarea
                  id="edit-bio"
                  rows={3}
                  maxLength={160}
                  value={editForm.bio}
                  onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                  className="lb-search-field"
                  placeholder="Tell peers about your tech stack and goals..."
                  style={{ resize: 'vertical' }}
                />
                <span className="form-char-count">{editForm.bio.length} / 160</span>
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          8. ADD FRIEND MODAL
          ============================================================== */}
      {isAddFriendModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddFriendModalOpen(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-title">Connect with Developer</div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsAddFriendModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendFriendRequest} className="prof-edit-form">
              {addFriendSuccess && (
                <div className="modal-success-pill">{addFriendSuccess}</div>
              )}

              <div className="form-group">
                <label className="form-label">Developer Username or Handle</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. alex_systems or elena_rustacean"
                  value={addFriendInput}
                  onChange={(e) => setAddFriendInput(e.target.value)}
                  className="lb-search-field"
                />
                <span className="form-tip">
                  Enter their exact username handle to send an instant friend request.
                </span>
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsAddFriendModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
