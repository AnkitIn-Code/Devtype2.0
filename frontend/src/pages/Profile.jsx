// src/pages/Profile.jsx
import { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Edit3, Flame, Zap, Target,
  Clock, Trophy, Users, Award,
  ArrowRight, X, UserPlus, Check,
  Calendar, Code2, AlertCircle, RotateCcw,
  Search, Eye, Shield, Swords, Brain
} from 'lucide-react';

import ActivityHeatmap from '../components/common/ActivityHeatmap';
import { useAuth } from '../context/AuthContext';
import {
  getStoredProfile, saveStoredProfile,
  getStoredFriends, saveStoredFriends
} from '../data/profileStore';
import {
  searchPeerDirectory,
  getPeerFullProfile,
  INITIAL_PEER_DIRECTORY
} from '../data/peerDirectoryStore';
import { authService } from '../services/authService';
import { achievementService } from '../services/achievementService';
import { dashboardService } from '../services/dashboardService';
import { srsService } from '../services/srsService';
import { practiceService } from '../services/practiceService';
import { dataCache } from '../services/dataCache';
import { getSavedSessions } from '../utils/reportStore';
import { mergeSessions, buildUnifiedDailyActivity, calculateConsistentStreak } from '../utils/sessionSync';

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

const QUICK_ROLES = [
  'Full Stack Developer',
  'Senior Systems Engineer',
  'Frontend Architect',
  'Backend Specialist',
  'Rust Engineer',
  'Competitive Programmer'
];

const LANG_COLORS = {
  'C++': '#2563EB',
  Python: '#4F46E5',
  Java: '#0D9488',
  JavaScript: '#EAB308',
  TypeScript: '#0284C7',
  Rust: '#EA580C',
  Go: '#0284C7',
  SQL: '#7C3AED',
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  // User-scoped profile and friends
  const [profile, setProfile] = useState(() => getStoredProfile(user?.id, user));
  const [friends, setFriends] = useState(() => getStoredFriends(user?.id));
  const [friendTab, setFriendTab] = useState('connected'); // 'connected' | 'received' | 'sent'

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [selectedPeerProfile, setSelectedPeerProfile] = useState(null);

  // Peer discovery & search inside Add Friend modal
  const [peerSearchQuery, setPeerSearchQuery] = useState('');
  const [peerFilterTab, setPeerFilterTab] = useState('all'); // 'all' | 'recommended' | 'top'
  const [directHandleInput, setDirectHandleInput] = useState('');
  const [directConnectMsg, setDirectConnectMsg] = useState('');

  // Peer detail modal tabs
  const [peerModalActiveTab, setPeerModalActiveTab] = useState('overview'); // 'overview' | 'connected' | 'network'

  // Following list state
  const [followedPeers, setFollowedPeers] = useState(() => {
    try {
      const saved = localStorage.getItem(`devtype_following_${user?.id}`);
      return saved ? JSON.parse(saved) : ['peer-elena', 'peer-marcus'];
    } catch {
      return ['peer-elena', 'peer-marcus'];
    }
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    displayName: user?.displayName || profile.displayName || '',
    title: profile.title || 'Software Developer',
    bio: profile.bio || '',
    avatarBg: profile.avatarBg || AVATAR_BG_PRESETS[0],
    githubUrl: profile.githubUrl || 'https://github.com',
    website: profile.website || '',
  });
  const [editError, setEditError] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Authoritative server data with synchronous eager hydration from dataCache
  const cachedDash = useMemo(() => dataCache.getDashboard(user?.id), [user?.id]);
  const [dashboardData, setDashboardData] = useState(() => cachedDash);
  const [serverSessions, setServerSessions] = useState(() => dataCache.getSessions(user?.id) || []);
  const [localSessions, setLocalSessions] = useState(() => getSavedSessions(user?.id));
  const [liveBadges, setLiveBadges] = useState(() => dataCache.getAchievements(user?.id) || []);
  const [srsDeck, setSrsDeck] = useState(() => dataCache.getDeck(user?.id) || []);
  const [srsDueCards, setSrsDueCards] = useState(() => dataCache.getDueCards(user?.id) || []);
  const [isLoading, setIsLoading] = useState(() => !cachedDash);

  // Synchronize user profile when auth user changes
  useEffect(() => {
    if (user) {
      setProfile((prev) => getStoredProfile(user.id, { ...user, ...prev }));
      setFriends(getStoredFriends(user.id));
    }
  }, [user]);

  // Lock background scroll when any modal is open & handle Escape key
  useEffect(() => {
    const hasModal = isEditModalOpen || isAddFriendModalOpen || !!selectedPeerProfile;
    if (hasModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          if (selectedPeerProfile) setSelectedPeerProfile(null);
          else if (isAddFriendModalOpen) setIsAddFriendModalOpen(false);
          else if (isEditModalOpen) setIsEditModalOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isEditModalOpen, isAddFriendModalOpen, selectedPeerProfile]);

  // Load all live user data from server and user-scoped store
  const loadUserData = useCallback(() => {
    let isMounted = true;
    setLocalSessions(getSavedSessions(user?.id));

    const p1 = dashboardService
      .getDashboardSummary()
      .then((data) => {
        if (isMounted && data) {
          setDashboardData(data);
          dataCache.setDashboard(user?.id, data);
        }
      })
      .catch((err) => {
        console.warn('Could not load user dashboard metrics for profile:', err);
      });

    const p2 = practiceService
      .getUserSessions({ page: 0, size: 50, sort: 'completedAt,desc' })
      .then((res) => {
        if (isMounted && res?.items) {
          const completedOnly = res.items.filter((s) => s.status === 'COMPLETED');
          setServerSessions(completedOnly);
          dataCache.setSessions(user?.id, completedOnly);
        }
      })
      .catch((err) => {
        console.warn('Could not load user practice sessions for profile:', err);
      });

    const p3 = achievementService
      .getAchievements()
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setLiveBadges(data);
          dataCache.setAchievements(user?.id, data);
        }
      })
      .catch(() => {});

    const p4 = Promise.allSettled([
      srsService.getDeck(),
      srsService.getDueCards(),
    ]).then(([deckRes, dueRes]) => {
      if (!isMounted) return;
      if (deckRes.status === 'fulfilled' && Array.isArray(deckRes.value)) {
        setSrsDeck(deckRes.value);
        dataCache.setDeck(user?.id, deckRes.value);
      }
      if (dueRes.status === 'fulfilled' && Array.isArray(dueRes.value)) {
        setSrsDueCards(dueRes.value);
        dataCache.setDueCards(user?.id, dueRes.value);
      }
    });

    Promise.allSettled([p1, p2, p3, p4]).finally(() => {
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    loadUserData();

    const handleSessionCompleted = () => loadUserData();
    const handleStorageUpdate = (e) => {
      if (!e.key || e.key.includes('devtype_sessions') || e.key.includes('devtype_auth')) {
        loadUserData();
      }
    };
    const handleCacheRevalidated = () => {
      const freshDash = dataCache.getDashboard(user?.id);
      if (freshDash) setDashboardData(freshDash);
      const freshSess = dataCache.getSessions(user?.id);
      if (freshSess) setServerSessions(freshSess);
      const freshAch = dataCache.getAchievements(user?.id);
      if (freshAch) setLiveBadges(freshAch);
    };

    window.addEventListener('devtype_session_completed', handleSessionCompleted);
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('devtype_cache_revalidated', handleCacheRevalidated);

    return () => {
      window.removeEventListener('devtype_session_completed', handleSessionCompleted);
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('devtype_cache_revalidated', handleCacheRevalidated);
    };
  }, [loadUserData]);

  // Formatted date helpers
  const formatJoinedDate = (createdAt) => {
    if (!createdAt) return 'Recently';
    const d = new Date(createdAt);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  };

  const formatPracticeTime = (seconds) => {
    if (!seconds || seconds <= 0) return '0m';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = (ms) => {
    if (!ms || ms <= 0) return '—';
    const totalSecs = Math.round(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  // Merge server and local sessions consistently across pages
  const allUserSessions = useMemo(() => {
    return mergeSessions(serverSessions, localSessions);
  }, [localSessions, serverSessions]);

  // Derive favorite language from user's actual sessions
  const favoriteLanguage = useMemo(() => {
    const sessions = allUserSessions.length > 0 ? allUserSessions : (dashboardData?.recentSessions || []);
    if (sessions.length === 0) return null;
    const counts = {};
    sessions.forEach((s) => {
      const lang = s.language || 'Code';
      counts[lang] = (counts[lang] || 0) + 1;
    });
    let topLang = null;
    let maxCount = 0;
    Object.entries(counts).forEach(([lang, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topLang = lang;
      }
    });
    return topLang;
  }, [allUserSessions, dashboardData]);

  // Calculate SRS recall statistics
  const srsStats = useMemo(() => {
    const total = srsDeck.length;
    const due = srsDueCards.length;
    const mastered = srsDeck.filter((c) => (c.repetition || 0) >= 3).length;
    const learning = Math.max(0, total - mastered);

    return {
      total,
      due,
      mastered,
      learning,
      masteredPercent: total > 0 ? Math.round((mastered / total) * 100) : 0,
      learningPercent: total > 0 ? Math.round((learning / total) * 100) : 0,
      duePercent: total > 0 ? Math.round((due / total) * 100) : 0,
    };
  }, [srsDeck, srsDueCards]);

  // Actual unlocked achievements
  const unlockedBadges = useMemo(() => {
    return liveBadges.filter((a) => a.unlocked).slice(0, 6);
  }, [liveBadges]);

  const totalBadgesCount = liveBadges.length || 10;
  const unlockedBadgesCount = liveBadges.filter((a) => a.unlocked).length;

  // Real user sessions (10 most recent)
  const recentSessions = useMemo(() => {
    return allUserSessions.slice(0, 10);
  }, [allUserSessions]);

  // Filtered peer directory for the Add Peer modal
  const filteredPeerDirectory = useMemo(() => {
    let list = searchPeerDirectory(peerSearchQuery);
    if (peerFilterTab === 'recommended') {
      list = list.filter((p) => p.mutualCount > 1 || p.level >= 10);
    } else if (peerFilterTab === 'top') {
      list = [...list].sort((a, b) => (b.bestWpm || 0) - (a.bestWpm || 0));
    }
    return list;
  }, [peerSearchQuery, peerFilterTab]);

  // Toggle follow status
  const handleToggleFollow = (peerId) => {
    if (!peerId) return;
    setFollowedPeers((prev) => {
      const isFollowing = prev.includes(peerId);
      const next = isFollowing ? prev.filter((id) => id !== peerId) : [...prev, peerId];
      try {
        localStorage.setItem(`devtype_following_${user?.id}`, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save follow status', e);
      }
      return next;
    });
  };

  // Connect with a peer from the directory or detail modal
  const handleConnectPeer = (peer) => {
    if (!peer) return;
    const isAlreadyConnected = friends.connected.some((f) => f.id === peer.id || f.name === peer.name);
    const isAlreadySent = friends.sent.some((f) => f.id === peer.id || f.name === peer.name);
    if (isAlreadyConnected || isAlreadySent) return;

    const newSentItem = {
      id: peer.id || `sent-${Date.now()}`,
      name: peer.name,
      displayName: peer.displayName,
      avatar: peer.avatar,
      avatarBg: peer.avatarBg,
      title: peer.title,
      level: peer.level,
      bestWpm: peer.bestWpm,
      primaryLang: peer.favLang || 'TypeScript',
    };

    const updated = { ...friends, sent: [...friends.sent, newSentItem] };
    setFriends(updated);
    saveStoredFriends(updated, user?.id);
  };

  // Handle direct username handle connect
  const handleDirectConnect = (e) => {
    e.preventDefault();
    if (!directHandleInput.trim()) return;
    const clean = directHandleInput.trim().replace(/^@/, '');
    const peer = getPeerFullProfile(clean);
    handleConnectPeer(peer);
    setDirectConnectMsg(`Connection request sent to @${clean}!`);
    setDirectHandleInput('');
    setTimeout(() => setDirectConnectMsg(''), 3000);
  };

  // Friends handlers
  const handleAcceptFriend = (req) => {
    const newConnected = [...friends.connected, { ...req, status: 'Online' }];
    const newReceived = friends.received.filter((r) => r.id !== req.id);
    const updated = { ...friends, connected: newConnected, received: newReceived };
    setFriends(updated);
    saveStoredFriends(updated, user?.id);
  };

  const handleRejectFriend = (reqId, type) => {
    if (type === 'received') {
      const updated = {
        ...friends,
        received: friends.received.filter((r) => r.id !== reqId),
      };
      setFriends(updated);
      saveStoredFriends(updated, user?.id);
    } else if (type === 'sent') {
      const updated = {
        ...friends,
        sent: friends.sent.filter((r) => r.id !== reqId),
      };
      setFriends(updated);
      saveStoredFriends(updated, user?.id);
    }
  };

  // Save profile edits: update server and user-specific storage
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editForm.displayName.trim()) {
      setEditError('Display name cannot be empty');
      return;
    }

    setIsSavingEdit(true);
    setEditError('');

    try {
      const cleanName = editForm.displayName.trim();
      // 1. Update on backend server
      await authService.updateProfile({ displayName: cleanName });

      // 2. Update context state
      if (updateUser) {
        updateUser({ displayName: cleanName });
      }

      // 3. Update local user-specific profile customization
      const updated = {
        ...profile,
        displayName: cleanName,
        title: editForm.title.trim(),
        bio: editForm.bio.trim(),
        avatarBg: editForm.avatarBg,
        avatar: cleanName.slice(0, 2).toUpperCase(),
        githubUrl: editForm.githubUrl.trim(),
        website: editForm.website.trim(),
      };
      setProfile(updated);
      saveStoredProfile(updated, user?.id);
      setSaveSuccessMsg('Profile saved successfully!');
      setTimeout(() => {
        setSaveSuccessMsg('');
        setIsEditModalOpen(false);
      }, 700);
    } catch (err) {
      console.warn('Could not update profile on server:', err);
      // Fallback: save locally
      const cleanName = editForm.displayName.trim();
      const updated = {
        ...profile,
        displayName: cleanName,
        title: editForm.title.trim(),
        bio: editForm.bio.trim(),
        avatarBg: editForm.avatarBg,
        avatar: cleanName.slice(0, 2).toUpperCase(),
        githubUrl: editForm.githubUrl.trim(),
        website: editForm.website.trim(),
      };
      setProfile(updated);
      saveStoredProfile(updated, user?.id);
      setSaveSuccessMsg('Profile saved locally!');
      setTimeout(() => {
        setSaveSuccessMsg('');
        setIsEditModalOpen(false);
      }, 700);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Real display attributes
  const currentDisplayName = user?.displayName || profile.displayName || user?.username || 'Developer';
  const currentUsername = user?.username || profile.username || 'developer';
  const avatarInitials = currentDisplayName.slice(0, 2).toUpperCase();
  const userRole = user?.role === 'ROLE_ADMIN' ? 'Platform Administrator' : (profile.title || 'Software Developer');
  const userJoinedDate = formatJoinedDate(user?.createdAt);

  const completedSessions = useMemo(() => {
    return Math.max(dashboardData?.totalCompletedSessions || 0, allUserSessions.length);
  }, [dashboardData, allUserSessions]);

  const bestWpm = useMemo(() => {
    const dashBest = dashboardData?.bestWpm != null && Number(dashboardData.bestWpm) > 0
      ? Math.round(Number(dashboardData.bestWpm))
      : null;
    if (dashBest) return dashBest;
    if (allUserSessions.length > 0) {
      const max = Math.max(...allUserSessions.map((s) => Number(s.netWpm ?? s.wpm ?? 0)));
      return max > 0 ? Math.round(max) : null;
    }
    return null;
  }, [dashboardData, allUserSessions]);

  const avgWpm = useMemo(() => {
    const dashAvg = dashboardData?.averageWpm != null && Number(dashboardData.averageWpm) > 0
      ? Math.round(Number(dashboardData.averageWpm))
      : null;
    if (dashAvg) return dashAvg;
    if (allUserSessions.length > 0) {
      const valid = allUserSessions.map((s) => Number(s.netWpm ?? s.wpm ?? 0)).filter((v) => v > 0);
      if (valid.length > 0) {
        return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
      }
    }
    return null;
  }, [dashboardData, allUserSessions]);

  const totalPracticeTime = useMemo(() => {
    if (dashboardData?.totalPracticeTimeSeconds && dashboardData.totalPracticeTimeSeconds > 0) {
      return dashboardData.totalPracticeTimeSeconds;
    }
    if (allUserSessions.length > 0) {
      return allUserSessions.reduce((acc, s) => {
        const secs = s.durationSeconds != null
          ? Number(s.durationSeconds)
          : Math.round((Number(s.durationMs) || 0) / 1000);
        return acc + secs;
      }, 0);
    }
    return 0;
  }, [dashboardData, allUserSessions]);

  const currentStreak = useMemo(() => {
    return calculateConsistentStreak(dashboardData?.currentStreak, dashboardData?.dailyActivity, allUserSessions);
  }, [dashboardData?.currentStreak, dashboardData?.dailyActivity, allUserSessions]);

  const dailyActivity = useMemo(() => {
    return buildUnifiedDailyActivity(dashboardData?.dailyActivity || [], allUserSessions);
  }, [dashboardData?.dailyActivity, allUserSessions]);
  const currentXp = dashboardData?.totalXp ?? (user?.totalXp || 0);
  const currentLevel = dashboardData?.level ?? (user?.level || 1);
  const nextLevelXp = dashboardData?.nextLevelXp ?? 200;
  const xpRemaining = Math.max(0, nextLevelXp - currentXp);
  const levelPercent = dashboardData?.levelProgressPercent ?? Math.min(100, Math.round((currentXp / nextLevelXp) * 100));

  return (
    <div className="dash prof-page-root" style={{ paddingBottom: 60 }}>
      {/* ==============================================================
          1. REAL PROFILE HEADER CARD
          ============================================================== */}
      <div className="card prof-header-card">
        <div className="card-bd prof-header-inner">
          <div className="prof-header-left">
            <div
              className="prof-avatar-large"
              style={{ background: profile.avatarBg || AVATAR_BG_PRESETS[0] }}
            >
              {avatarInitials}
            </div>

            <div className="prof-identity">
              <div className="prof-name-line">
                <h1 className="prof-display-name">{currentDisplayName}</h1>
                <span className="you-pill">YOU</span>
                <span className="level-pill">Level {currentLevel}</span>
              </div>

              <div className="prof-meta-line">
                <span className="prof-handle">@{currentUsername}</span>
                <span className="prof-sep">•</span>
                <span className="prof-title">{userRole}</span>
                <span className="prof-sep">•</span>
                <span className="prof-joined">
                  <Calendar size={13} />
                  Joined {userJoinedDate}
                </span>
              </div>

              {profile.bio && <p className="prof-bio">{profile.bio}</p>}

              {/* Authoritative XP Progress Bar */}
              <div className="prof-xp-block">
                <div className="prof-xp-labels">
                  <span className="xp-curr-val">
                    {currentXp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
                  </span>
                  <span className="xp-to-next">
                    {xpRemaining.toLocaleString()} XP to Level {currentLevel + 1}
                  </span>
                </div>
                <div className="xp-bar" style={{ height: 6 }}>
                  <div
                    className="xp-bar-fill"
                    style={{
                      width: `${Math.min(100, Math.max(0, levelPercent))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="prof-header-right">
            {/* Live Streak Indicator */}
            <div className="prof-streak-pill">
              <Flame size={18} className="prof-flame" />
              <div className="streak-meta">
                <span className="streak-num">
                  {currentStreak > 0 ? `${currentStreak} Day Streak` : '0 Day Streak'}
                </span>
                <span className="streak-sub">
                  {currentStreak > 0 ? 'Active & Growing' : 'Start a practice sprint today'}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-sm prof-edit-btn"
              onClick={() => {
                setEditForm({
                  displayName: currentDisplayName,
                  title: profile.title || userRole,
                  bio: profile.bio || '',
                  avatarBg: profile.avatarBg || AVATAR_BG_PRESETS[0],
                  githubUrl: profile.githubUrl || 'https://github.com',
                  website: profile.website || '',
                });
                setEditError('');
                setSaveSuccessMsg('');
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
          2. SUMMARY STAT CARDS (REAL AUTHORITATIVE METRICS)
          ============================================================== */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-top">
              <div className="stat-icon-wrap rose">
                <Zap size={19} strokeWidth={2.2} />
              </div>
              <span className="badge badge-teal">Top Speed</span>
            </div>
            <div className="stat-num">
              {bestWpm != null ? (
                <>
                  {bestWpm} <small style={{ fontSize: '0.8rem', color: 'var(--t3)' }}>WPM</small>
                </>
              ) : (
                '—'
              )}
            </div>
            <div className="stat-label">Personal Best Velocity</div>
            <div className="stat-sub">
              {bestWpm != null ? 'All-time personal velocity record' : 'Awaiting first completed run'}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-top">
              <div className="stat-icon-wrap emerald">
                <Target size={19} strokeWidth={2.2} />
              </div>
              <span className="badge badge-teal">Steady Pace</span>
            </div>
            <div className="stat-num">
              {avgWpm != null ? (
                <>
                  {avgWpm} <small style={{ fontSize: '0.8rem', color: 'var(--t3)' }}>WPM</small>
                </>
              ) : (
                '—'
              )}
            </div>
            <div className="stat-label">Average Practice Speed</div>
            <div className="stat-sub">
              {avgWpm != null ? 'Calculated across all practice runs' : 'Awaiting practice data'}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-top">
              <div className="stat-icon-wrap cobalt">
                <Clock size={19} strokeWidth={2.2} />
              </div>
              <span className="badge badge-teal">Sessions</span>
            </div>
            <div className="stat-num">{completedSessions}</div>
            <div className="stat-label">Total Practice Sessions</div>
            <div className="stat-sub">
              {formatPracticeTime(totalPracticeTime)} active typing time
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-top">
              <div className="stat-icon-wrap amber">
                <Code2 size={19} strokeWidth={2.2} />
              </div>
              <span className="badge badge-indigo">Primary</span>
            </div>
            <div className="stat-num">{favoriteLanguage || '—'}</div>
            <div className="stat-label">Favorite Language</div>
            <div className="stat-sub">
              {favoriteLanguage ? 'Most practiced syntax language' : 'Start typing to record top language'}
            </div>
          </div>
        </div>
      </div>

      {/* ==============================================================
          3. REAL USER ANNUAL ACTIVITY HEATMAP
          ============================================================== */}
      <ActivityHeatmap
        activityData={dailyActivity}
        title="Annual Keyboard Telemetry"
        subtitle="Your authenticated daily typing activity and streak consistency"
      />

      {/* ==============================================================
          4. REAL ACHIEVEMENTS & EARNED BADGES
          ============================================================== */}
      <div className="card prof-ach-card" style={{ marginTop: 24 }}>
        <div className="card-hd">
          <div className="card-hd-left">
            <div className="card-title">
              <Trophy size={18} color="var(--brand)" />
              <span>Earned Badges &amp; Accolades</span>
            </div>
            <div className="card-sub">Your unlocked developer milestones</div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/achievements')}
          >
            <span>View All ({unlockedBadgesCount}/{totalBadgesCount})</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="card-bd">
          {unlockedBadges.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 16px', textAlign: 'center' }}>
              <div className="empty-icon" style={{ margin: '0 auto 10px' }}>
                <Award size={22} color="var(--t3)" />
              </div>
              <div className="empty-title" style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                No Badges Unlocked Yet
              </div>
              <div className="empty-desc" style={{ fontSize: '0.82rem', marginTop: 4 }}>
                Complete your first practice session or solve today's sprint challenge to unlock milestone badges!
              </div>
            </div>
          ) : (
            <div className="prof-badges-grid">
              {unlockedBadges.map((badge) => (
                <div
                  key={badge.id || badge.code}
                  className="prof-badge-item"
                  onClick={() => navigate('/achievements')}
                  title={`${badge.name || badge.title}: ${badge.description}`}
                >
                  <div className="prof-badge-icon-wrap">
                    <Award size={22} color="#10B981" />
                  </div>
                  <div className="prof-badge-info">
                    <div className="prof-badge-name">{badge.name || badge.title}</div>
                    <div className="prof-badge-xp">+{badge.rewardXp || 50} XP</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ==============================================================
          5. SRS REVISION & PEERS DUAL GRID
          ============================================================== */}
      <div className="prof-dual-grid" style={{ marginTop: 24 }}>
        {/* Left: SRS Retention Statistics */}
        <div className="card prof-challenges-card">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-title">
                <Brain size={18} color="var(--brand)" />
                <span>SRS Memory Retention</span>
              </div>
              <div className="card-sub">SuperMemo SM-2 algorithmic recall progression</div>
            </div>
            <span className="badge badge-teal">
              {srsStats.mastered} / {Math.max(1, srsStats.total)} Mastered
            </span>
          </div>

          <div className="card-bd prof-challenges-inner">
            <div className="challenge-bar-row">
              <div className="challenge-bar-header">
                <span className="diff-title" style={{ color: '#10B981' }}>
                  Mastered Blueprints (Repetition &ge; 3)
                </span>
                <span className="diff-count">
                  {srsStats.mastered} / {srsStats.total}
                </span>
              </div>
              <div className="ach-card-bar" style={{ height: 8 }}>
                <div
                  className="ach-card-fill"
                  style={{
                    width: `${srsStats.masteredPercent}%`,
                    background: '#10B981',
                  }}
                />
              </div>
            </div>

            <div className="challenge-bar-row">
              <div className="challenge-bar-header">
                <span className="diff-title" style={{ color: '#F59E0B' }}>
                  Learning Phase (Repetition 1&ndash;2)
                </span>
                <span className="diff-count">
                  {srsStats.learning} / {srsStats.total}
                </span>
              </div>
              <div className="ach-card-bar" style={{ height: 8 }}>
                <div
                  className="ach-card-fill"
                  style={{
                    width: `${srsStats.learningPercent}%`,
                    background: '#F59E0B',
                  }}
                />
              </div>
            </div>

            <div className="challenge-bar-row">
              <div className="challenge-bar-header">
                <span className="diff-title" style={{ color: '#F43F5E' }}>
                  Due for Recall Today
                </span>
                <span className="diff-count">
                  {srsStats.due} due
                </span>
              </div>
              <div className="ach-card-bar" style={{ height: 8 }}>
                <div
                  className="ach-card-fill"
                  style={{
                    width: `${srsStats.duePercent}%`,
                    background: '#F43F5E',
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => navigate('/revision')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span>Launch SRS Drills</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: User's Peers Section */}
        <div className="card prof-friends-card">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-title">
                <Users size={18} color="var(--brand)" />
                <span>Developer Peers</span>
              </div>
              <div className="card-sub">Your typing colleagues and rivals</div>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setPeerSearchQuery('');
                setPeerFilterTab('all');
                setIsAddFriendModalOpen(true);
              }}
            >
              <UserPlus size={13} />
              <span>Add Peer</span>
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
                    <div className="empty-title">No connected peers yet</div>
                    <div className="empty-desc">Discover and connect with developers to inspect their networks and race!</div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: 12, marginInline: 'auto' }}
                      onClick={() => setIsAddFriendModalOpen(true)}
                    >
                      <UserPlus size={13} />
                      <span>Discover Peers</span>
                    </button>
                  </div>
                ) : (
                  friends.connected.map((friend) => (
                    <div
                      key={friend.id}
                      className="prof-friend-item"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedPeerProfile(getPeerFullProfile(friend.name || friend.id))}
                      title="Click to view complete profile and network"
                    >
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className={`friend-status-badge ${(friend.status || 'online').toLowerCase().replace(' ', '-')}`}>
                          {friend.status || 'Online'}
                        </span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPeerProfile(getPeerFullProfile(friend.name || friend.id));
                          }}
                        >
                          <Eye size={13} />
                          <span>Profile</span>
                        </button>
                      </div>
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
                    <div
                      key={req.id}
                      className="prof-friend-item"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedPeerProfile(getPeerFullProfile(req.name || req.id))}
                    >
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
                      <div className="friend-actions" onClick={(e) => e.stopPropagation()}>
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
                    <div
                      key={req.id}
                      className="prof-friend-item"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedPeerProfile(getPeerFullProfile(req.name || req.id))}
                    >
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejectFriend(req.id, 'sent');
                        }}
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
          6. REAL USER RECENT PRACTICE HISTORY TABLE
          ============================================================== */}
      <div className="card sessions-card" style={{ marginTop: 24 }}>
        <div className="card-hd">
          <div className="card-hd-left">
            <div className="card-title">
              <Clock size={18} color="var(--t3)" />
              <span>Recent Practice History</span>
            </div>
            <div className="card-sub">Your authenticated typing runs</div>
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
          {recentSessions.length === 0 ? (
            <div className="empty-state" style={{ padding: '36px 16px', textAlign: 'center' }}>
              <div className="empty-icon" style={{ margin: '0 auto 10px' }}>
                <Clock size={24} strokeWidth={1.8} />
              </div>
              <div className="empty-title" style={{ fontSize: '1rem', fontWeight: 600 }}>
                No Practice Sessions Recorded Yet
              </div>
              <div className="empty-desc" style={{ fontSize: '0.84rem', marginTop: 4 }}>
                Your completed code typing sessions, speed records, and precision metrics will appear here.
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/practice')}
                style={{ margin: '14px auto 0', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Code2 size={13} />
                <span>Start Your First Practice Session</span>
              </button>
            </div>
          ) : (
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
                  {recentSessions.map((s, idx) => {
                    const title = s.templateTitle || s.title || s.snippetTitle || s.templateSlug || 'Practice Sprint';
                    const lang = s.language || 'Code';
                    const langColor = LANG_COLORS[lang] || '#2563EB';
                    const speed = s.netWpm != null ? Math.round(Number(s.netWpm)) : (s.wpm != null ? Math.round(Number(s.wpm)) : '—');
                    const accuracy = s.accuracyPercent != null ? Math.round(Number(s.accuracyPercent)) : (s.accuracy != null ? Math.round(Number(s.accuracy)) : '—');
                    const durationMsVal = s.durationMs != null ? Number(s.durationMs) : (s.durationSeconds != null ? Number(s.durationSeconds) * 1000 : 0);
                    const dur = formatDuration(durationMsVal);
                    const dateStr = formatDate(s.completedAt || s.date || s.startedAt);

                    return (
                      <tr key={s.id || idx} className="roster-row">
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{title}</span>
                        </td>
                        <td>
                          <div className="session-lang" style={{ gap: 6 }}>
                            <div className="lang-dot" style={{ background: langColor }} />
                            <span>{lang}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-teal">{s.difficulty || 'Intermediate'}</span>
                        </td>
                        <td className="th-right">
                          <span className="metric-primary-text">{speed} WPM</span>
                        </td>
                        <td className="th-right">
                          <span className="metric-acc-text">{accuracy}%</span>
                        </td>
                        <td className="th-right">
                          <span className="metric-sessions-text">{dur}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.78rem', color: 'var(--t3)' }}>{dateStr}</span>
                        </td>
                        <td className="th-center">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              navigate(`/practice?snippet=${s.templateSlug || s.templateId || s.id}`);
                            }}
                            style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                          >
                            Practice
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ==============================================================
          PORTAL 1: EDIT DEVELOPER PROFILE MODAL
          ============================================================== */}
      {isEditModalOpen &&
        createPortal(
          <div
            className="modal-backdrop-portal"
            onClick={() => setIsEditModalOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="prof-modal-container"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="prof-modal-header">
                <div className="prof-modal-header-left">
                  <div className="prof-modal-title">
                    <Edit3 size={18} color="var(--brand)" />
                    <span>Edit Developer Profile</span>
                  </div>
                  <div className="prof-modal-sub">
                    Customize your public handle, focus role, and visual identity
                  </div>
                </div>
                <button
                  type="button"
                  className="prof-modal-close"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <div className="prof-modal-body">
                  {/* Live Mini Profile Preview */}
                  <div className="prof-preview-banner">
                    <div
                      className="prof-preview-avatar"
                      style={{ background: editForm.avatarBg }}
                    >
                      {(editForm.displayName || currentDisplayName).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="prof-preview-meta">
                      <div className="prof-preview-name-row">
                        <span className="prof-preview-name">
                          {editForm.displayName || currentDisplayName}
                        </span>
                        <span className="prof-preview-handle">@{currentUsername}</span>
                      </div>
                      <span className="prof-preview-title">
                        {editForm.title || 'Software Developer'}
                      </span>
                      {editForm.bio && (
                        <span className="prof-preview-bio">"{editForm.bio}"</span>
                      )}
                    </div>
                  </div>

                  {editError && <div className="modal-error-pill">{editError}</div>}
                  {saveSuccessMsg && <div className="modal-success-pill">{saveSuccessMsg}</div>}

                  {/* Avatar Preset Selector */}
                  <div className="form-group">
                    <label className="form-label">Avatar Gradient Theme</label>
                    <div className="avatar-preset-row">
                      {AVATAR_BG_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`avatar-preset-btn ${editForm.avatarBg === preset ? 'selected' : ''}`}
                          style={{ background: preset }}
                          onClick={() => setEditForm((f) => ({ ...f, avatarBg: preset }))}
                        >
                          {editForm.avatarBg === preset && <Check size={16} color="#FFF" />}
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
                      className="prof-input"
                      placeholder="e.g. Alex Rivera"
                    />
                  </div>

                  {/* Title / Role with Quick Chips */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-title">
                      Engineering Role &amp; Specialization
                    </label>
                    <input
                      id="edit-title"
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                      className="prof-input"
                      placeholder="e.g. Senior Systems Engineer"
                    />
                    <div className="prof-title-chips">
                      {QUICK_ROLES.map((role) => (
                        <button
                          key={role}
                          type="button"
                          className={`prof-title-chip ${editForm.title === role ? 'active' : ''}`}
                          onClick={() => setEditForm((f) => ({ ...f, title: role }))}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-bio">
                      Developer Bio (max 160 characters)
                    </label>
                    <textarea
                      id="edit-bio"
                      rows={3}
                      maxLength={160}
                      value={editForm.bio}
                      onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                      className="prof-textarea"
                      placeholder="Share your tech stack, keystroke goals, or favorite algorithms..."
                    />
                    <span className="form-char-count">{editForm.bio.length} / 160</span>
                  </div>

                  {/* External Links */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-github">GitHub Profile URL</label>
                      <input
                        id="edit-github"
                        type="url"
                        value={editForm.githubUrl}
                        onChange={(e) => setEditForm((f) => ({ ...f, githubUrl: e.target.value }))}
                        className="prof-input"
                        placeholder="https://github.com/..."
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-website">Portfolio Website</label>
                      <input
                        id="edit-website"
                        type="url"
                        value={editForm.website}
                        onChange={(e) => setEditForm((f) => ({ ...f, website: e.target.value }))}
                        className="prof-input"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>

                <div className="prof-modal-footer">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSavingEdit}>
                    {isSavingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ==============================================================
          PORTAL 2: DISCOVER & ADD PEERS MODAL
          ============================================================== */}
      {isAddFriendModalOpen &&
        createPortal(
          <div
            className="modal-backdrop-portal"
            onClick={() => setIsAddFriendModalOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="prof-modal-container large"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="prof-modal-header">
                <div className="prof-modal-header-left">
                  <div className="prof-modal-title">
                    <Users size={20} color="var(--brand)" />
                    <span>Discover &amp; Connect with Peers</span>
                  </div>
                  <div className="prof-modal-sub">
                    Inspect complete profiles, see mutual networks, and challenge peers
                  </div>
                </div>
                <button
                  type="button"
                  className="prof-modal-close"
                  onClick={() => setIsAddFriendModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="prof-modal-body">
                {/* Search Bar */}
                <div className="peer-search-box">
                  <Search size={18} className="peer-search-box-icon" />
                  <input
                    type="text"
                    className="peer-search-input"
                    placeholder="Search by name, @handle, role, or preferred language..."
                    value={peerSearchQuery}
                    onChange={(e) => setPeerSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>

                {/* Filter Pills Segmented Control */}
                <div className="peer-filter-pills">
                  <button
                    type="button"
                    className={`peer-filter-pill-btn ${peerFilterTab === 'all' ? 'active' : ''}`}
                    onClick={() => setPeerFilterTab('all')}
                  >
                    All Developers ({INITIAL_PEER_DIRECTORY.length})
                  </button>
                  <button
                    type="button"
                    className={`peer-filter-pill-btn ${peerFilterTab === 'recommended' ? 'active' : ''}`}
                    onClick={() => setPeerFilterTab('recommended')}
                  >
                    Recommended Peers
                  </button>
                  <button
                    type="button"
                    className={`peer-filter-pill-btn ${peerFilterTab === 'top' ? 'active' : ''}`}
                    onClick={() => setPeerFilterTab('top')}
                  >
                    Top Velocity (110+ WPM)
                  </button>
                </div>

                {/* Developer Peers Directory Grid */}
                <div className="peer-discover-grid">
                  {filteredPeerDirectory.length === 0 ? (
                    <div className="empty-state" style={{ padding: '36px 16px', textAlign: 'center' }}>
                      <div className="empty-title">No matching developers found</div>
                      <div className="empty-desc">Try searching by a different name, handle, or language.</div>
                    </div>
                  ) : (
                    filteredPeerDirectory.map((peer) => {
                      const isConnected = friends.connected.some((f) => f.id === peer.id || f.name === peer.name);
                      const isSent = friends.sent.some((f) => f.id === peer.id || f.name === peer.name);

                      return (
                        <div key={peer.id} className="peer-discover-card">
                          <div className="peer-discover-left">
                            <div
                              className="peer-discover-avatar"
                              style={{ background: peer.avatarBg }}
                            >
                              {peer.avatar}
                            </div>
                            <div className="peer-discover-info">
                              <div className="peer-discover-name-row">
                                <span className="peer-discover-name">{peer.displayName}</span>
                                <span className="peer-discover-handle">@{peer.name}</span>
                                <span className={`friend-status-badge ${(peer.status || 'online').toLowerCase().replace(' ', '-')}`}>
                                  {peer.status || 'Online'}
                                </span>
                              </div>
                              <div className="peer-discover-meta">
                                <span>{peer.title}</span>
                                <span>•</span>
                                <span className="peer-badge-speed">
                                  {peer.bestWpm} WPM
                                </span>
                                <span>•</span>
                                <span style={{ fontWeight: 600 }}>{peer.favLang}</span>
                                {peer.mutualCount > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="peer-badge-mutual">
                                      {peer.mutualCount} mutual peers
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="peer-discover-actions">
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => setSelectedPeerProfile(peer)}
                            >
                              <Eye size={14} />
                              <span>View Profile</span>
                            </button>

                            {isConnected ? (
                              <span className="badge badge-teal" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Check size={12} /> Connected
                              </span>
                            ) : isSent ? (
                              <span className="badge badge-indigo">Pending</span>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => handleConnectPeer(peer)}
                              >
                                <UserPlus size={13} />
                                <span>Connect</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Direct Handle Connect Option */}
                <form onSubmit={handleDirectConnect} className="peer-direct-card">
                  <label className="form-label" style={{ fontSize: '0.82rem', color: 'var(--t1)' }}>
                    Know an exact handle? Connect directly by @username:
                  </label>
                  <div className="peer-direct-row">
                    <span className="peer-direct-prefix">@</span>
                    <input
                      type="text"
                      className="prof-input"
                      style={{ flex: 1 }}
                      placeholder="username (e.g. linus_torvalds or alex_systems)"
                      value={directHandleInput}
                      onChange={(e) => setDirectHandleInput(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary btn-sm" style={{ flexShrink: 0, padding: '9px 16px' }}>
                      Send Request
                    </button>
                  </div>
                  {directConnectMsg && (
                    <div className="modal-success-pill">
                      {directConnectMsg}
                    </div>
                  )}
                </form>
              </div>

              <div className="prof-modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsAddFriendModalOpen(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ==============================================================
          PORTAL 3: COMPLETE PEER PROFILE INSPECTION MODAL
          ============================================================== */}
      {selectedPeerProfile &&
        createPortal(
          <div
            className="modal-backdrop-portal"
            onClick={() => setSelectedPeerProfile(null)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="prof-modal-container large"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="prof-modal-header">
                <div className="prof-modal-header-left">
                  <div className="prof-modal-title">
                    <Shield size={18} color="var(--brand)" />
                    <span>Developer Profile Telemetry</span>
                  </div>
                  <div className="prof-modal-sub">@{selectedPeerProfile.name}</div>
                </div>
                <button
                  type="button"
                  className="prof-modal-close"
                  onClick={() => setSelectedPeerProfile(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="prof-modal-body">
                {/* Hero Profile Banner */}
                <div className="peer-profile-hero">
                  <div className="peer-hero-identity">
                    <div
                      className="peer-hero-avatar"
                      style={{ background: selectedPeerProfile.avatarBg }}
                    >
                      {selectedPeerProfile.avatar}
                    </div>
                    <div className="peer-hero-info">
                      <div className="peer-hero-name-row">
                        <span className="peer-hero-name">
                          {selectedPeerProfile.displayName}
                        </span>
                        <span className="level-pill">Level {selectedPeerProfile.level}</span>
                        <span className={`friend-status-badge ${(selectedPeerProfile.status || 'online').toLowerCase().replace(' ', '-')}`}>
                          {selectedPeerProfile.status || 'Online'}
                        </span>
                      </div>
                      <div className="peer-hero-meta">
                        <span className="prof-handle">@{selectedPeerProfile.name}</span>
                        <span>•</span>
                        <span className="prof-title">{selectedPeerProfile.title}</span>
                        <span>•</span>
                        <span>Joined {selectedPeerProfile.joinedDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="peer-hero-actions">
                    {/* Connect Button */}
                    {friends.connected.some((f) => f.id === selectedPeerProfile.id || f.name === selectedPeerProfile.name) ? (
                      <span className="badge badge-teal" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Check size={12} /> Connected
                      </span>
                    ) : friends.sent.some((f) => f.id === selectedPeerProfile.id || f.name === selectedPeerProfile.name) ? (
                      <span className="badge badge-indigo">Pending</span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleConnectPeer(selectedPeerProfile)}
                      >
                        <UserPlus size={13} />
                        <span>Connect</span>
                      </button>
                    )}

                    {/* Follow Toggle */}
                    <button
                      type="button"
                      className={`btn btn-sm ${followedPeers.includes(selectedPeerProfile.id) ? 'btn-ghost' : 'btn-ghost'}`}
                      style={{
                        background: followedPeers.includes(selectedPeerProfile.id)
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'var(--bg-hover)',
                        borderColor: followedPeers.includes(selectedPeerProfile.id)
                          ? '#10B981'
                          : 'var(--border-subtle)',
                        color: followedPeers.includes(selectedPeerProfile.id) ? '#10B981' : 'var(--t1)',
                      }}
                      onClick={() => handleToggleFollow(selectedPeerProfile.id)}
                    >
                      {followedPeers.includes(selectedPeerProfile.id) ? (
                        <>
                          <Check size={13} />
                          <span>Following</span>
                        </>
                      ) : (
                        <span>Follow</span>
                      )}
                    </button>

                    {/* 1v1 Race Button */}
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      title="Challenge to a 1v1 Multiplayer Race"
                      onClick={() => {
                        setSelectedPeerProfile(null);
                        navigate('/multiplayer');
                      }}
                    >
                      <Swords size={13} />
                      <span>Race</span>
                    </button>
                  </div>

                  {selectedPeerProfile.bio && (
                    <div className="peer-hero-bio">"{selectedPeerProfile.bio}"</div>
                  )}
                </div>

                {/* 4 Stat Cards */}
                <div className="peer-stat-grid">
                  <div className="peer-stat-card">
                    <span className="peer-stat-num">{selectedPeerProfile.bestWpm} WPM</span>
                    <span className="peer-stat-label">Personal Best</span>
                  </div>
                  <div className="peer-stat-card">
                    <span className="peer-stat-num">{selectedPeerProfile.avgWpm} WPM</span>
                    <span className="peer-stat-label">Average Pace</span>
                  </div>
                  <div className="peer-stat-card">
                    <span className="peer-stat-num">{selectedPeerProfile.sessions}</span>
                    <span className="peer-stat-label">Practice Runs</span>
                  </div>
                  <div className="peer-stat-card">
                    <span className="peer-stat-num">{selectedPeerProfile.precision}%</span>
                    <span className="peer-stat-label">Keystroke Precision</span>
                  </div>
                </div>

                {/* Sub Navigation Tabs */}
                <div className="peer-tabs-bar">
                  <button
                    type="button"
                    className={`peer-tab-btn ${peerModalActiveTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setPeerModalActiveTab('overview')}
                  >
                    Overview &amp; Telemetry
                  </button>
                  <button
                    type="button"
                    className={`peer-tab-btn ${peerModalActiveTab === 'connected' ? 'active' : ''}`}
                    onClick={() => setPeerModalActiveTab('connected')}
                  >
                    Connected With ({selectedPeerProfile.connectedPeers?.length || 0})
                  </button>
                  <button
                    type="button"
                    className={`peer-tab-btn ${peerModalActiveTab === 'network' ? 'active' : ''}`}
                    onClick={() => setPeerModalActiveTab('network')}
                  >
                    Network ({(selectedPeerProfile.following?.length || 0) + (selectedPeerProfile.followers?.length || 0)})
                  </button>
                </div>

                {/* TAB 1: OVERVIEW */}
                {peerModalActiveTab === 'overview' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Primary Language */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--t3)' }}>Preferred Language:</span>
                      <span className="badge badge-teal" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <div
                          className="lang-dot"
                          style={{ background: LANG_COLORS[selectedPeerProfile.favLang] || '#2563EB' }}
                        />
                        {selectedPeerProfile.favLang}
                      </span>
                    </div>

                    {/* Recent Sessions */}
                    {selectedPeerProfile.recentSessions?.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--t2)' }}>
                          Recent Practice Benchmarks
                        </div>
                        <div className="lb-table-scroll-wrapper">
                          <table className="lb-roster-table" style={{ fontSize: '0.8rem' }}>
                            <thead>
                              <tr>
                                <th>Snippet Template</th>
                                <th>Language</th>
                                <th className="th-right">Speed</th>
                                <th className="th-right">Accuracy</th>
                                <th className="th-right">Duration</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedPeerProfile.recentSessions.map((run, idx) => (
                                <tr key={idx} className="roster-row">
                                  <td>{run.snippet}</td>
                                  <td>
                                    <span className="badge badge-teal" style={{ padding: '2px 6px', fontSize: '0.72rem' }}>
                                      {run.language}
                                    </span>
                                  </td>
                                  <td className="th-right" style={{ color: 'var(--brand)', fontWeight: 700 }}>
                                    {run.wpm} WPM
                                  </td>
                                  <td className="th-right" style={{ color: '#10B981', fontWeight: 600 }}>
                                    {run.accuracy}%
                                  </td>
                                  <td className="th-right">{run.duration}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Earned Badges */}
                    {selectedPeerProfile.badges?.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--t2)' }}>
                          Accolades &amp; Milestones
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {selectedPeerProfile.badges.map((b, idx) => (
                            <span
                              key={idx}
                              className="badge badge-indigo"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px' }}
                            >
                              <Award size={13} color="#6366F1" />
                              <span>{b}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: CONNECTED WITH (WHOM THEY ARE CONNECTED TO) */}
                {peerModalActiveTab === 'connected' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--t3)' }}>
                      Colleagues and developers in {selectedPeerProfile.displayName}'s inner typing circle:
                    </div>
                    <div className="peer-connections-list">
                      {(!selectedPeerProfile.connectedPeers || selectedPeerProfile.connectedPeers.length === 0) ? (
                        <div className="empty-state" style={{ padding: '20px' }}>
                          <div className="empty-title">No connected peers listed</div>
                        </div>
                      ) : (
                        selectedPeerProfile.connectedPeers.map((conn) => (
                          <div key={conn.id} className="peer-connection-item">
                            <div className="peer-conn-left">
                              <div className="peer-conn-avatar" style={{ background: conn.avatarBg }}>
                                {conn.avatar}
                              </div>
                              <div className="peer-conn-info">
                                <span className="peer-conn-name">{conn.displayName}</span>
                                <span className="peer-conn-role">{conn.title}</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span className="peer-conn-speed">{conn.bestWpm} WPM</span>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                                onClick={() => setSelectedPeerProfile(getPeerFullProfile(conn.id))}
                              >
                                View Profile
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: NETWORK (WHO THEY FOLLOW & FOLLOWERS) */}
                {peerModalActiveTab === 'network' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {/* Following */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--t1)' }}>
                        Following ({selectedPeerProfile.following?.length || 0})
                      </div>
                      <div className="peer-connections-list">
                        {(selectedPeerProfile.following || []).map((f) => (
                          <div key={f.id} className="peer-connection-item">
                            <div className="peer-conn-left">
                              <div className="peer-conn-avatar" style={{ background: f.avatarBg }}>
                                {f.avatar}
                              </div>
                              <div className="peer-conn-info">
                                <span className="peer-conn-name">{f.displayName}</span>
                                <span className="peer-conn-role">@{f.name}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                              onClick={() => setSelectedPeerProfile(getPeerFullProfile(f.name || f.id))}
                            >
                              View
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Followers */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--t1)' }}>
                        Followers ({selectedPeerProfile.followers?.length || 0})
                      </div>
                      <div className="peer-connections-list">
                        {(selectedPeerProfile.followers || []).map((fol) => (
                          <div key={fol.id} className="peer-connection-item">
                            <div className="peer-conn-left">
                              <div className="peer-conn-avatar" style={{ background: fol.avatarBg }}>
                                {fol.avatar}
                              </div>
                              <div className="peer-conn-info">
                                <span className="peer-conn-name">{fol.displayName}</span>
                                <span className="peer-conn-role">@{fol.name}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                              onClick={() => setSelectedPeerProfile(getPeerFullProfile(fol.name || fol.id))}
                            >
                              View
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="prof-modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setSelectedPeerProfile(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
