// src/pages/Leaderboard.jsx
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, Medal, Crown, Award, Swords,
  Search, X, ChevronLeft, ChevronRight,
  Shield, TrendingUp, TrendingDown, Users,
  Check, Flame, AlertCircle, RefreshCw,
  Clock, ArrowUpRight
} from 'lucide-react';

import { apiFetch } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { leaderboardService } from '../services/leaderboardService';
import { dataCache } from '../services/dataCache';
import {
  BGMI_TIER_ORDER,
  BGMI_TIER_CONFIG,
  getTierGroup,
  getBgmiTierVisuals
} from '../utils/eloRatingStore';

const TIER_FILTER_OPTIONS = [
  { id: 'all', label: 'All Tiers' },
  { id: 'Conqueror', label: 'Conqueror' },
  { id: 'Ace', label: 'Ace / Dominator (4200+)' },
  { id: 'Crown', label: 'Crown I–V (3500–4199)' },
  { id: 'Diamond', label: 'Diamond I–V (3000–3499)' },
  { id: 'Platinum', label: 'Platinum I–V (2500–2999)' },
  { id: 'Gold', label: 'Gold I–V (2000–2499)' },
  { id: 'Silver', label: 'Silver I–V (1500–1999)' },
  { id: 'Bronze', label: 'Bronze I–V (1000–1499)' },
];

/* ================================================================
   1. PODIUM CARD FOR TOP 3 (GOLD / SILVER / BRONZE)
   ================================================================ */
function TopPodiumCard({ dev, place }) {
  const navigate = useNavigate();
  if (!dev) return null;

  const isFirst = place === 1;
  const isSecond = place === 2;
  const tierVisuals = getBgmiTierVisuals(dev.seasonTier);

  const config = isFirst
    ? {
        label: '1st Place · Champion',
        badgeClass: 'podium-badge-gold',
        icon: Crown,
        crownColor: '#F59E0B',
      }
    : isSecond
    ? {
        label: '2nd Place · Runner-Up',
        badgeClass: 'podium-badge-silver',
        icon: Medal,
        crownColor: '#94A3B8',
      }
    : {
        label: '3rd Place · Bronze',
        badgeClass: 'podium-badge-bronze',
        icon: Award,
        crownColor: '#D97706',
      };

  const IconComp = config.icon;
  const totalMatches = dev.matchesPlayed || (dev.wins || 0) + (dev.losses || 0);
  const winRate = totalMatches > 0 ? Math.round(((dev.wins || 0) / totalMatches) * 100) : 0;

  return (
    <div
      className={`lb-podium-card rank-${place} ${dev.isCurrentUser ? 'podium-current-user' : ''}`}
    >
      {/* Top Header Tag */}
      <span className="lb-podium-rank-tag">
        <IconComp size={13} />
        <span>{config.label}</span>
      </span>

      {/* Avatar with Halo */}
      <div className="lb-podium-avatar-wrap">
        {isFirst && (
          <div className="lb-podium-crown" title="Rank 1 Active Champion">
            <Crown size={28} color="#F59E0B" fill="#F59E0B" />
          </div>
        )}
        <div
          className="lb-podium-avatar"
          style={{
            background: dev.avatarBg || 'linear-gradient(135deg, #2563EB, #1D4ED8)',
          }}
        >
          {dev.avatar || (dev.name || 'U').slice(0, 2).toUpperCase()}
        </div>
      </div>

      {/* Name and Username */}
      <h3 className="lb-podium-name" title={dev.name}>{dev.name}</h3>
      <span className="lb-podium-username">@{dev.username}</span>

      {/* Season Tier Badge */}
      <div
        className="bgmi-tier-badge"
        style={{
          color: tierVisuals.color,
          backgroundColor: tierVisuals.bg,
          border: `1px solid ${tierVisuals.border}`,
        }}
      >
        <span>{tierVisuals.icon}</span>
        <span>{dev.seasonTier || 'Bronze V'}</span>
      </div>

      {/* Primary Score: Rating */}
      <div className="lb-podium-score-box">
        <div className="lb-podium-score-num">
          {(dev.rating || 1200).toLocaleString()}
        </div>
        <div className="lb-podium-score-label">Points · ELO Rating</div>
      </div>

      {/* Sub-stats: Peak Rating & Last Match Points */}
      <div className="lb-podium-stats-row">
        <div className="lb-podium-stat-item">
          <span className="lb-podium-stat-label">Peak Rating</span>
          <span className="lb-podium-stat-val">{dev.peakRating || dev.rating || 1200}</span>
        </div>
        <div className="podium-substat-divider" />
        <div className="lb-podium-stat-item">
          <span className="lb-podium-stat-label">Last Points</span>
          <span
            className="lb-podium-stat-val"
            style={{
              color: dev.lastMatchPoints != null && dev.lastMatchPoints > 0 ? '#10B981' : dev.lastMatchPoints != null && dev.lastMatchPoints < 0 ? '#EF4444' : 'inherit',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)'
            }}
          >
            {dev.lastMatchPoints != null ? (dev.lastMatchPoints > 0 ? `+${dev.lastMatchPoints} pts` : `${dev.lastMatchPoints} pts`) : '—'}
          </span>
        </div>
      </div>

      {!dev.isCurrentUser && (
        <button
          type="button"
          className="btn btn-ghost btn-xs podium-challenge-btn"
          style={{ marginTop: '14px' }}
          onClick={() => navigate('/multiplayer')}
        >
          <Swords size={12} />
          <span>Challenge In 1v1</span>
        </button>
      )}
    </div>
  );
}

/* ================================================================
   MAIN PAGE COMPONENT
   ================================================================ */
export default function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // Page Subview: 'leaderboard' or 'my-rank'
  const [activeTab, setActiveTab] = useState('leaderboard');

  // Filters & Search
  const [selectedTier, setSelectedTier] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rating'); // 'rating' | 'peak' | 'wins' | 'winrate'
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Eager Loading State from Cache
  const cachedLb = dataCache.getLeaderboard(selectedTier);
  const cachedSeason = dataCache.getSeasonInfo();
  const cachedMyRank = dataCache.getMyRank(user?.id);
  const cachedTierConfig = dataCache.getTierConfig();

  const [tierConfiguration, setTierConfiguration] = useState(() => cachedTierConfig || null);
  const [leaderboardData, setLeaderboardData] = useState(() => cachedLb || []);
  const [seasonInfo, setSeasonInfo] = useState(() => cachedSeason || null);
  const [myRankData, setMyRankData] = useState(() => cachedMyRank || null);
  const [isLoading, setIsLoading] = useState(() => !cachedLb || cachedLb.length === 0);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (!tierConfiguration) {
      apiFetch('/api/v1/leaderboard/tiers')
        .then((tc) => {
          if (tc) {
            setTierConfiguration(tc);
            dataCache.setTierConfig(tc);
          }
        })
        .catch(() => {});
    }
  }, [tierConfiguration]);

  useEffect(() => {
    if (!seasonInfo || !user?.id) return;
    const prefix = `devtype_season_notice_${user.id}_`;
    try {
      const previous = localStorage.getItem(`${prefix}active`);
      if (previous && previous !== String(seasonInfo.seasonNumber))
        addNotification({ title: 'New ranked season', message: `${seasonInfo.seasonName} is active. Your tier reset is complete.`, link: '/leaderboard' });
      localStorage.setItem(`${prefix}active`, String(seasonInfo.seasonNumber));
      const warningKey = `${prefix}${seasonInfo.seasonNumber}_ending`;
      if (seasonInfo.daysRemaining <= 3 && !localStorage.getItem(warningKey)) {
        addNotification({ title: 'Ranked season ending', message: seasonInfo.daysRemaining === 0 ? 'The season is ending. Final standings and resets will be processed by the server.' : `${seasonInfo.daysRemaining} days remain in ${seasonInfo.seasonName}.`, link: '/leaderboard' });
        localStorage.setItem(warningKey, 'shown');
      }
    } catch { /* Notifications remain optional when browser storage is disabled. */ }
  }, [seasonInfo, user?.id, addNotification]);

  const userRowRef = useRef(null);

  // Fetch real authoritative data directly from backend database with silent background revalidation
  const fetchData = useCallback(async () => {
    const existing = dataCache.getLeaderboard(selectedTier);
    if (!existing || existing.length === 0) {
      setIsLoading(true);
    }
    try {
      const [lb, sInfo, myRank] = await Promise.all([
        leaderboardService.getLeaderboard(selectedTier),
        leaderboardService.getSeasonInfo(),
        leaderboardService.getMyRank(),
      ]);

      if (lb && lb.length > 0) {
        setLeaderboardData(lb);
        dataCache.setLeaderboard(selectedTier, lb);
        setIsOffline(false);
      } else if (!sInfo && (!lb || lb.length === 0)) {
        if (!existing || existing.length === 0) {
          setLeaderboardData([]);
          setIsOffline(true);
        }
      } else {
        setLeaderboardData(lb || []);
        dataCache.setLeaderboard(selectedTier, lb || []);
        setIsOffline(false);
      }

      if (sInfo) {
        setSeasonInfo(sInfo);
        dataCache.setSeasonInfo(sInfo);
      }
      if (myRank) {
        setMyRankData(myRank);
        dataCache.setMyRank(user?.id, myRank);
      }
    } catch (err) {
      console.warn('Backend unavailable, real database data could not be fetched:', err);
      if (!existing || existing.length === 0) {
        setIsOffline(true);
        setLeaderboardData([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedTier, user?.id]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchData();
    });
    const refresh = setInterval(fetchData, 6000);
    const handleSync = () => {
      if (active) fetchData();
    };
    const handleStorage = (e) => {
      if (e.key === 'devtype_last_rating_update' || e.key === 'devtype_elo_user') {
        if (active) fetchData();
      }
    };
    const handleRevalidate = () => {
      if (!active) return;
      const freshLb = dataCache.getLeaderboard(selectedTier);
      if (freshLb && freshLb.length > 0) setLeaderboardData(freshLb);
      const freshSeason = dataCache.getSeasonInfo();
      if (freshSeason) setSeasonInfo(freshSeason);
      const freshMyRank = dataCache.getMyRank(user?.id);
      if (freshMyRank) setMyRankData(freshMyRank);
      const freshTiers = dataCache.getTierConfig();
      if (freshTiers) setTierConfiguration(freshTiers);
      setIsLoading(false);
    };

    window.addEventListener('devtype_elo_updated', handleSync);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('devtype_cache_revalidated', handleRevalidate);

    return () => {
      active = false;
      clearInterval(refresh);
      window.removeEventListener('devtype_elo_updated', handleSync);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('devtype_cache_revalidated', handleRevalidate);
    };
  }, [fetchData, selectedTier, user?.id]);

  // Filtered and Sorted Competitors
  const processedCompetitors = useMemo(() => {
    let list = [...leaderboardData];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (dev) =>
          (dev.name && dev.name.toLowerCase().includes(q)) ||
          (dev.username && dev.username.toLowerCase().includes(q))
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'peak') {
        return (b.peakRating || 0) - (a.peakRating || 0);
      }
      if (sortBy === 'wins') {
        return (b.wins || 0) - (a.wins || 0);
      }
      if (sortBy === 'winrate') {
        return (b.winRate || 0) - (a.winRate || 0);
      }
      if (sortBy === 'lastPoints') {
        return (b.lastMatchPoints ?? -9999) - (a.lastMatchPoints ?? -9999);
      }
      return (b.rating || 0) - (a.rating || 0);
    });

    return list;
  }, [leaderboardData, searchQuery, sortBy]);

  // Top 3 Podium
  const topThree = useMemo(() => {
    return [leaderboardData[0], leaderboardData[1], leaderboardData[2]];
  }, [leaderboardData]);

  // Current user's relative standing
  const currentUserStanding = useMemo(() => {
    return leaderboardData.find((dev) => dev.isCurrentUser);
  }, [leaderboardData]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(processedCompetitors.length / pageSize));
  const paginatedCompetitors = useMemo(() => {
    const start = (page - 1) * pageSize;
    return processedCompetitors.slice(start, start + pageSize);
  }, [processedCompetitors, page]);

  const handleScrollToUser = () => {
    if (userRowRef.current) {
      userRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const daysRemaining = seasonInfo?.daysRemaining ?? (myRankData?.daysRemaining ?? 0);
  const seasonName = seasonInfo?.seasonName || 'Season unavailable';
  const activeCompetitors = (seasonInfo?.activeCompetitors && seasonInfo.activeCompetitors > 0)
    ? seasonInfo.activeCompetitors
    : (leaderboardData.length || 0);
  const champName = seasonInfo?.lastSeasonChampionName || 'No archived champion';
  const champUsername = seasonInfo?.lastSeasonChampionUsername || '—';
  const champRating = seasonInfo?.lastSeasonChampionRating || 0;

  const currentTier = myRankData?.tier || currentUserStanding?.seasonTier || 'Unavailable';
  const currentRating = myRankData?.rating ?? currentUserStanding?.rating ?? '—';
  const currentPeak = myRankData?.peakRating ?? currentUserStanding?.peakRating ?? '—';
  const currentWins = myRankData?.wins || currentUserStanding?.wins || 0;
  const currentLosses = myRankData?.losses || currentUserStanding?.losses || 0;
  const currentWinRate = myRankData?.winRate || currentUserStanding?.winRate || 0;
  const pointsToNext = myRankData?.pointsToNextTier ?? 0;
  const nextTierName = myRankData?.nextTierName || 'Unavailable';
  const currentRankPos = myRankData?.rank || currentUserStanding?.rank || '—';
  const currentBand = tierConfiguration?.tiers.find(t => currentRating >= t.minRating && currentRating <= t.maxRating);
  const tierProgress = currentBand ? (currentBand.maxRating >= 99999 ? 100 : Math.max(0, Math.min(100, 100 * (currentRating - currentBand.minRating) / (currentBand.maxRating + 1 - currentBand.minRating)))) : 0;
  const myTierVisuals = getBgmiTierVisuals(currentTier);

  return (
    <div className="dash space-y-6">
      {/* ── Top Page Switcher: Leaderboard vs My Rank ── */}
      <div className="lb-view-switcher">
        <div className="lb-view-tabs">
          <button
            type="button"
            className={`lb-view-tab ${activeTab === 'leaderboard' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            <Trophy size={16} />
            <span>Global Leaderboard</span>
          </button>
          <button
            type="button"
            className={`lb-view-tab ${activeTab === 'my-rank' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('my-rank')}
          >
            <Shield size={16} />
            <span>Current Rank</span>
          </button>
        </div>

        <div className="lb-season-badge-tag">
          <span className="season-countdown-pulse">
            <span className="pulse-dot" />
            <span>{seasonName}</span>
          </span>
          <span style={{ color: 'var(--border-subtle)' }}>•</span>
          <span style={{ color: '#F59E0B' }}>
            <Clock size={13} style={{ display: 'inline', marginRight: 4 }} />
            {!seasonInfo ? 'Season unavailable' : daysRemaining === 0 ? 'Season ended — finalizing' : daysRemaining === 1 ? 'Final day' : `${daysRemaining} Days Left`}
          </span>
        </div>
      </div>

      {/* ── Backend Offline Notification (Pure consistency, no fake players) ── */}
      {isOffline && (
        <div className="lb-offline-banner">
          <AlertCircle size={24} className="lb-offline-icon" />
          <div className="lb-offline-text">
            <h4>Database & Backend Offline</h4>
            <p>
              Leaderboard rankings are strictly synchronized with PostgreSQL database records. Start the backend server (<code>./mvnw spring-boot:run</code>) to stream real player rankings.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={fetchData}
            disabled={isLoading}
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* ============================================================
          VIEW 1: GLOBAL COMPETITIVE LEADERBOARD
          ============================================================ */}
      {activeTab === 'leaderboard' && (
        <>
          {/* ── Top Stats Grid (Active Competitors, Last Champion, Countdown, Peak) ── */}
          <div className="lb-season-stat-grid">
            {/* Active Competitors */}
            <div className="lb-stat-card">
              <div
                className="lb-stat-icon-wrap"
                style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}
              >
                <Users size={22} />
              </div>
              <div>
                <div className="lb-stat-label">Active Competitors</div>
                <div className="lb-stat-value">{activeCompetitors}</div>
                <div className="lb-stat-sub">Registered Ranked Developers</div>
              </div>
            </div>

            {/* Last Season Champion */}
            <div className="lb-stat-card">
              <div
                className="lb-stat-icon-wrap"
                style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}
              >
                <Crown size={22} />
              </div>
              <div>
                <div className="lb-stat-label">Last Season Champion</div>
                <div className="lb-stat-value" style={{ fontSize: '1.05rem', color: '#F59E0B' }}>
                  {champName}
                </div>
                <div className="lb-stat-sub">
                  @{champUsername} · {champRating} ELO
                </div>
              </div>
            </div>

            {/* Days Remaining in Season */}
            <div className="lb-stat-card">
              <div
                className="lb-stat-icon-wrap"
                style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}
              >
                <Clock size={22} />
              </div>
              <div>
                <div className="lb-stat-label">Season Ending In</div>
                <div className="lb-stat-value" style={{ color: '#10B981' }}>
                  {daysRemaining} Days
                </div>
                <div className="lb-stat-sub">Automatic Tier Reset at End</div>
              </div>
            </div>

            {/* Top Tier Benchmark */}
            <div className="lb-stat-card">
              <div
                className="lb-stat-icon-wrap"
                style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#F43F5E' }}
              >
                <Flame size={22} />
              </div>
              <div>
                <div className="lb-stat-label">Dominator Cutoff</div>
                <div className="lb-stat-value" style={{ color: '#F43F5E' }}>
                  4,200+
                </div>
                <div className="lb-stat-sub">Ace & Conqueror Tier</div>
              </div>
            </div>
          </div>

          {/* ── Top 3 Master Podium Showcase ── */}
          <div className="lb-podium-master-card">
            <div className="lb-podium-master-header">
              <div className="lb-podium-master-title">
                <Crown size={20} color="#F59E0B" />
                <h2>Top 3 Competitors · Grand Podium</h2>
              </div>
              <span className="lb-podium-master-tag">Season 1 Leaders</span>
            </div>

            {leaderboardData.length >= 3 ? (
              <div className="lb-top3-grid">
                {/* 2nd Place */}
                <TopPodiumCard dev={topThree[1]} place={2} />
                {/* 1st Place */}
                <TopPodiumCard dev={topThree[0]} place={1} />
                {/* 3rd Place */}
                <TopPodiumCard dev={topThree[2]} place={3} />
              </div>
            ) : leaderboardData.length > 0 ? (
              <div className="lb-top3-grid">
                {leaderboardData.map((player, idx) => (
                  <TopPodiumCard key={player.userId || idx} dev={player} place={idx + 1} />
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: '36px',
                  textAlign: 'center',
                  color: 'var(--t3)',
                }}
              >
                <Trophy size={36} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
                <p>No active database competitors recorded yet. Play ranked matches to claim the top podium!</p>
              </div>
            )}
          </div>

          {/* ── User's Personal Standing Box (Down from Top 3) ── */}
          <div className="lb-user-standing-banner">
            <div className="lb-user-standing-left">
              <div className="lb-user-rank-box" title="Your Global Sequential Rank">
                #{currentRankPos}
              </div>
              <div className="lb-user-profile-info">
                <div className="lb-user-profile-title">
                  <span className="lb-user-name">
                    {user?.displayName || user?.username || 'You'}
                  </span>
                  <span className="lb-user-you-tag">YOU</span>
                  <span
                    className="bgmi-tier-badge"
                    style={{
                      margin: 0,
                      color: myTierVisuals.color,
                      backgroundColor: myTierVisuals.bg,
                      border: `1px solid ${myTierVisuals.border}`,
                    }}
                  >
                    {myTierVisuals.icon} {currentTier}
                  </span>
                </div>
                <span className="lb-user-handle">@{user?.username || 'developer'}</span>
              </div>
            </div>

            <div className="lb-user-stats-bar">
              <div className="lb-user-stat-cell">
                <span className="lb-user-stat-label">Current Rating</span>
                <span className="lb-user-stat-val" style={{ color: myTierVisuals.color }}>
                  {currentRating} ELO
                </span>
              </div>
              <div className="lb-user-stat-cell">
                <span className="lb-user-stat-label">Peak This Season</span>
                <span className="lb-user-stat-val">{currentPeak}</span>
              </div>
              <div className="lb-user-stat-cell">
                <span className="lb-user-stat-label">W - L Record</span>
                <span className="lb-user-stat-val">
                  {currentWins}W - {currentLosses}L ({currentWinRate}%)
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleScrollToUser}
              >
                <span>Jump to My Row</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          </div>

          {/* ── Full Leaderboard Directory Table with Filter & Pagination ── */}
          <div className="card lb-table-card">
            {/* Table Toolbar */}
            <div className="card-header" style={{ flexWrap: 'wrap', gap: 14 }}>
              <div>
                <h3 className="card-title">All Ranked Competitors</h3>
                <p className="card-subtitle">
                  Synchronized with database ratings. Climb the BGMI tier ladder through ranked multiplayer duels.
                </p>
              </div>

              {/* Filters Toolbar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                {/* Search Input */}
                <div className="search-wrap lb-search-wrap">
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    className="search-input lb-search-input"
                    placeholder="Search name or username..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      onClick={() => setSearchQuery('')}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Tier Filter Dropdown */}
                <select
                  className="lb-select"
                  value={selectedTier}
                  onChange={(e) => {
                    setSelectedTier(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by Tier"
                >
                  {TIER_FILTER_OPTIONS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>

                {/* Sort Option */}
                <select
                  className="lb-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort by metric"
                >
                  <option value="rating">Sort by Rating</option>
                  <option value="peak">Sort by Peak Rating</option>
                  <option value="lastPoints">Sort by Last Points</option>
                  <option value="wins">Sort by Wins</option>
                  <option value="winrate">Sort by Win Rate</option>
                </select>
              </div>
            </div>

            {/* Table Content */}
            <div className="lb-table-scroll-wrapper">
              <table className="lb-roster-table">
                <thead>
                  <tr>
                    <th style={{ width: 70 }} className="th-center">Rank</th>
                    <th>Developer</th>
                    <th>Season Tier</th>
                    <th className="th-center">Rating</th>
                    <th className="th-center">Peak This Season</th>
                    <th className="th-center">Last Points</th>
                    <th className="th-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCompetitors.length > 0 ? (
                    paginatedCompetitors.map((dev) => {
                      const tierVis = getBgmiTierVisuals(dev.seasonTier);
                      const isTop1 = dev.rank === 1;
                      const isTop2 = dev.rank === 2;
                      const isTop3 = dev.rank === 3;
                      const totalMatches = dev.matchesPlayed || (dev.wins || 0) + (dev.losses || 0);
                      const winRate = totalMatches > 0 ? Math.round(((dev.wins || 0) / totalMatches) * 100) : 0;

                      return (
                        <tr
                          key={dev.userId || dev.username}
                          ref={dev.isCurrentUser ? userRowRef : null}
                          className={`roster-row ${dev.isCurrentUser ? 'current-user-roster-row' : ''}`}
                        >
                          {/* Rank # */}
                          <td className="th-center">
                            {isTop1 ? (
                              <span className="rank-medal rank-gold">
                                <Crown size={12} fill="#F59E0B" /> #1
                              </span>
                            ) : isTop2 ? (
                              <span className="rank-medal rank-silver">
                                <Medal size={12} /> #2
                              </span>
                            ) : isTop3 ? (
                              <span className="rank-medal rank-bronze">
                                <Award size={12} /> #3
                              </span>
                            ) : (
                              <span className="rank-plain">#{dev.rank}</span>
                            )}
                          </td>

                          {/* Developer Name & Username */}
                          <td>
                            <div className="engineer-cell">
                              <div
                                className="engineer-avatar"
                                style={{
                                  background: dev.avatarBg || 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                }}
                              >
                                {dev.avatar || (dev.name || 'U').slice(0, 2).toUpperCase()}
                              </div>
                              <div className="engineer-info">
                                <div className="engineer-name-row">
                                  <span className="engineer-name" style={{ fontWeight: 700 }}>
                                    {dev.name}
                                  </span>
                                  {dev.isCurrentUser && (
                                    <span className="podium-you-tag" style={{ marginLeft: 6 }}>
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <span className="engineer-handle">@{dev.username}</span>
                              </div>
                            </div>
                          </td>

                          {/* Season Tier */}
                          <td>
                            <span
                              className="bgmi-tier-badge"
                              style={{
                                margin: 0,
                                color: tierVis.color,
                                backgroundColor: tierVis.bg,
                                border: `1px solid ${tierVis.border}`,
                              }}
                            >
                              <span>{tierVis.icon}</span>
                              <span>{dev.seasonTier || 'Bronze V'}</span>
                            </span>
                          </td>

                          {/* Rating */}
                          <td className="th-center">
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                color: tierVis.color,
                              }}
                            >
                              {dev.rating?.toLocaleString() || 1200}
                            </span>
                          </td>

                          {/* Peak Rating */}
                          <td className="th-center">
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                              {dev.peakRating || dev.rating || 1200}
                            </span>
                          </td>

                          {/* Last Match Points (Positive or Negative) */}
                          <td className="th-center">
                            {dev.lastMatchPoints != null ? (
                              <span
                                className={`lb-points-pill ${dev.lastMatchPoints > 0 ? 'points-gain' : dev.lastMatchPoints < 0 ? 'points-loss' : 'points-neutral'}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '0.82rem',
                                  fontWeight: 800,
                                  fontFamily: 'var(--font-mono)',
                                  background: dev.lastMatchPoints > 0 ? 'rgba(16, 185, 129, 0.12)' : dev.lastMatchPoints < 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(148, 163, 184, 0.12)',
                                  color: dev.lastMatchPoints > 0 ? '#10B981' : dev.lastMatchPoints < 0 ? '#EF4444' : 'var(--t3)',
                                  border: `1px solid ${dev.lastMatchPoints > 0 ? 'rgba(16, 185, 129, 0.25)' : dev.lastMatchPoints < 0 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(148, 163, 184, 0.25)'}`,
                                }}
                              >
                                {dev.lastMatchPoints > 0 ? (
                                  <>
                                    <TrendingUp size={13} />
                                    <span>+{dev.lastMatchPoints} pts</span>
                                  </>
                                ) : dev.lastMatchPoints < 0 ? (
                                  <>
                                    <TrendingDown size={13} />
                                    <span>{dev.lastMatchPoints} pts</span>
                                  </>
                                ) : (
                                  <span>0 pts</span>
                                )}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--t3)' }}>—</span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="th-right">
                            {dev.isCurrentUser ? (
                              <span className="btn btn-ghost btn-xs" style={{ opacity: 0.6 }}>
                                Current User
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs"
                                onClick={() => navigate('/multiplayer')}
                              >
                                <Swords size={12} />
                                <span>Duel</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--t3)' }}>
                        <Trophy size={32} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                        <p>No competitors found matching the current filter.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Pagination Controls */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <span className="pagination-info">
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, processedCompetitors.length)} of {processedCompetitors.length} competitors
                </span>

                <div className="pagination-controls">
                  <button
                    type="button"
                    className="pagination-btn"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, padding: '0 8px' }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="pagination-btn"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================================================
          VIEW 2: USER CURRENT RANK & BGMI TIER PROGRESSION
          ============================================================ */}
      {activeTab === 'my-rank' && (
        <div className="bgmi-tier-view">
          {/* ── Hero Card: Current BGMI Tier & Countdown ── */}
          <div className="bgmi-hero-card">
            <div className="bgmi-hero-top">
              <div className="bgmi-tier-badge-large">
                <div
                  className="bgmi-tier-emblem"
                  style={{
                    backgroundColor: myTierVisuals.bg,
                    borderColor: myTierVisuals.border,
                    color: myTierVisuals.color,
                  }}
                >
                  {myTierVisuals.icon}
                </div>
                <div className="bgmi-tier-titles">
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: myTierVisuals.color }}>
                    Current Ranked Standing
                  </span>
                  <h1 style={{ color: myTierVisuals.color }}>{currentTier}</h1>
                  <div className="bgmi-tier-subtitle">
                    Global Rank: #{currentRankPos} · Peak Rating This Season: {currentPeak} ELO
                  </div>
                </div>
              </div>

              {/* Season Countdown */}
              <div className="bgmi-countdown-box">
                <div className="bgmi-countdown-label">Days Remaining in Season</div>
                <div className="bgmi-countdown-val">
                  {daysRemaining} Days
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--t3)' }}>
                  Tier reset occurs on season end
                </span>
              </div>
            </div>

            {/* Progress Bar to Next Sub-tier */}
            <div className="bgmi-progress-block">
              <div className="bgmi-progress-meta">
                <span>Current Rating: <strong>{currentRating} ELO</strong></span>
                <span className="points-left">
                  {pointsToNext > 0 ? `${pointsToNext} points to reach ${nextTierName}` : 'Max Tier Benchmark Achieved'}
                </span>
              </div>
              <div className="bgmi-progress-bar-bg">
                <div
                  className="bgmi-progress-bar-fill"
                  style={{
                    width: `${tierProgress}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── BGMI Tier Roadmap Ladder (Bronze -> Ace) ── */}
          <div className="bgmi-tier-ladder">
            <div className="bgmi-ladder-header">
              <h3>BGMI Tier Roadmap & Hierarchy</h3>
              <p>Advance through the competitive tiers by winning 1v1 Battles and multiplayer ranked races.</p>
            </div>

            <div className="bgmi-ladder-row">
              {BGMI_TIER_ORDER.map((tierGroup) => {
                const conf = BGMI_TIER_CONFIG[tierGroup] || BGMI_TIER_CONFIG.Bronze;
                const isCurrentGroup = getTierGroup(currentTier) === tierGroup;

                return (
                  <div
                    key={tierGroup}
                    className={`bgmi-ladder-step ${isCurrentGroup ? 'current-step' : ''}`}
                    style={isCurrentGroup ? { borderColor: conf.color } : {}}
                  >
                    {isCurrentGroup && (
                      <span
                        className="bgmi-step-active-tag"
                        style={{ background: conf.color, color: '#fff' }}
                      >
                        CURRENT
                      </span>
                    )}
                    <span className="bgmi-step-icon">{conf.icon}</span>
                    <span className="bgmi-step-name" style={{ color: isCurrentGroup ? conf.color : 'inherit' }}>
                      {tierGroup}
                    </span>
                    <span className="bgmi-step-range">
                      {tierGroup === 'Conqueror' ? `Top ${tierConfiguration?.conquerorPositions ?? '—'} · 4200+ · ranked match required` : tierGroup === 'Ace' ? '4200+' : tierGroup === 'Crown' ? '3500–4199' : tierGroup === 'Diamond' ? '3000–3499' : tierGroup === 'Platinum' ? '2500–2999' : tierGroup === 'Gold' ? '2000–2499' : tierGroup === 'Silver' ? '1500–1999' : '1000–1499'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Season End Tier Reduction Table (BGMI Rule System from Attached Photo) ── */}
          <div className="bgmi-reset-card">
            <div className="bgmi-reset-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <TrendingUp size={22} color="#38BDF8" />
                <h3>Key Thresholds & What They Give You Next Season</h3>
              </div>
              <p>
                At the conclusion of each ranked season, player ranks undergo soft reset based on the exact BGMI tier reduction system.
                Historical season standings are preserved.
              </p>
            </div>

            <table className="bgmi-reset-table">
              <thead>
                <tr>
                  <th>Target Tier to Reach</th>
                  <th>Starting Tier Next Season</th>
                  <th>Points Baseline</th>
                </tr>
              </thead>
              <tbody>
                {(tierConfiguration?.resetRules || []).map((rule) => {
                  const isMatchingRule = rule.targetTier === currentTier;

                  return (
                    <tr
                      key={rule.targetTier}
                      className={isMatchingRule ? 'active-user-threshold' : ''}
                    >
                      <td>
                        <span className="bgmi-reset-target-badge">
                          {rule.targetTier}
                          {isMatchingRule && (
                            <span className="bgmi-you-marker">YOUR TARGET</span>
                          )}
                        </span>
                      </td>
                      <td>
                        <span className="bgmi-reset-start-badge">
                          <Check size={14} />
                          {rule.startingNextSeason}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {rule.startingRating} ELO
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
