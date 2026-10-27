// src/pages/Leaderboard.jsx
import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, Medal, Crown, Award, Swords,
  Search, X, RotateCcw, ChevronLeft, ChevronRight,
  ArrowRight, Shield, Zap, TrendingUp, Users, Play,
  Sparkles, Check, Flame
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import {
  getUserEloData,
  getTierForRating,
  COMPETITIVE_LEADERBOARD_ROSTER,
  ELO_EVENT_NAME
} from '../utils/eloRatingStore';
import { getStoredFriends } from '../data/profileStore';

const TIER_FILTERS = [
  { id: 'all', label: 'All Tiers' },
  { id: 'Grandmaster', label: 'Grandmaster (2400+)' },
  { id: 'Master', label: 'Master (2000+)' },
  { id: 'Diamond', label: 'Diamond (1800+)' },
  { id: 'Gold', label: 'Gold (1500+)' },
  { id: 'Silver', label: 'Silver (1200+)' },
  { id: 'Bronze', label: 'Bronze (<1200)' },
];

/* ================================================================
   TOP-3 PODIUM CARD (CHESS-STYLE ELO LADDER)
   ================================================================ */
function TopPodiumCard({ dev, place }) {
  const navigate = useNavigate();
  if (!dev) return null;

  const isFirst = place === 1;
  const isSecond = place === 2;
  const tier = getTierForRating(dev.rating);

  const config = isFirst
    ? {
        label: '1st Place · Champion',
        badgeClass: 'podium-badge-gold',
        icon: Crown,
        crownColor: '#F59E0B',
      }
    : isSecond
    ? {
        label: '2nd Place',
        badgeClass: 'podium-badge-silver',
        icon: Medal,
        crownColor: '#94A3B8',
      }
    : {
        label: '3rd Place',
        badgeClass: 'podium-badge-bronze',
        icon: Award,
        crownColor: '#D97706',
      };

  const IconComp = config.icon;
  const totalMatches = (dev.wins || 0) + (dev.losses || 0);
  const winRate = totalMatches > 0 ? Math.round((dev.wins / totalMatches) * 100) : 0;

  return (
    <div
      className={`card top-podium-card ${
        isFirst ? 'podium-rank-1' : isSecond ? 'podium-rank-2' : 'podium-rank-3'
      } ${dev.isCurrentUser ? 'podium-current-user' : ''}`}
    >
      {/* Top Header: Rank & Tier badge */}
      <div className="top-podium-header">
        <span className={`podium-pill ${config.badgeClass}`}>
          <IconComp size={13} />
          <span>{config.label}</span>
        </span>
        <span
          className="podium-tier-pill"
          style={{
            backgroundColor: tier.bg,
            color: tier.color,
            borderColor: tier.border,
          }}
        >
          {tier.icon} {tier.name}
        </span>
      </div>

      {/* Avatar Section */}
      <div className="top-podium-avatar-section">
        {isFirst && (
          <div className="podium-crown-halo" title="Rank 1 Champion">
            <Crown size={22} color="#F59E0B" fill="#F59E0B" />
          </div>
        )}
        <div
          className="top-podium-avatar"
          style={{
            background: dev.avatarBg || '#2563EB',
            boxShadow: `0 0 0 3px var(--bg-surface), 0 0 0 5px ${config.crownColor}55`,
          }}
        >
          {dev.avatar}
        </div>
        {dev.isCurrentUser && <span className="podium-you-tag">YOU</span>}
      </div>

      {/* Identity */}
      <div className="top-podium-ident">
        <h3 className="podium-display-name">{dev.displayName}</h3>
        <span className="podium-username">@{dev.name}</span>
      </div>

      {/* Primary Score: ELO RATING */}
      <div className="podium-score-block">
        <span className="podium-score-val">{dev.rating.toLocaleString()}</span>
        <span className="podium-score-unit">ELO RATING</span>
      </div>

      {/* Sub-stats Row */}
      <div className="podium-substats-row">
        <div className="podium-substat">
          <span className="substat-label">Win Rate</span>
          <span className="substat-val">{winRate}%</span>
        </div>
        <div className="podium-substat-divider" />
        <div className="podium-substat">
          <span className="substat-label">W / L</span>
          <span className="substat-val">
            {dev.wins}W - {dev.losses}L
          </span>
        </div>
        <div className="podium-substat-divider" />
        <div className="podium-substat">
          <span className="substat-label">Peak ELO</span>
          <span className="substat-val">{dev.peakRating || dev.rating}</span>
        </div>
      </div>

      {!dev.isCurrentUser && (
        <button
          type="button"
          className="btn btn-ghost btn-xs podium-challenge-btn"
          onClick={() => navigate('/multiplayer')}
        >
          <Swords size={12} />
          <span>Challenge</span>
        </button>
      )}
    </div>
  );
}

/* ================================================================
   MAIN COMPETITIVE MULTIPLAYER LEADERBOARD
   ================================================================ */
export default function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedTier, setSelectedTier] = useState('all');
  const [scope, setScope] = useState('global'); // 'global' | 'friends'
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [userElo, setUserElo] = useState(() => getUserEloData());
  const [friendsData, setFriendsData] = useState(() => getStoredFriends(user?.id));
  const userRowRef = useRef(null);

  // Sync ELO on storage and custom event updates
  useEffect(() => {
    const handleEloSync = () => {
      setUserElo(getUserEloData());
    };
    window.addEventListener(ELO_EVENT_NAME, handleEloSync);
    window.addEventListener('storage', handleEloSync);
    return () => {
      window.removeEventListener(ELO_EVENT_NAME, handleEloSync);
      window.removeEventListener('storage', handleEloSync);
    };
  }, []);

  // Sync friends when user changes or window regains focus
  useEffect(() => {
    setFriendsData(getStoredFriends(user?.id));
    const onFocus = () => setFriendsData(getStoredFriends(user?.id));
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user?.id]);

  // Build the complete combined competitive leaderboard
  const allRankedCompetitors = useMemo(() => {
    const friendsSet = new Set(
      (friendsData?.connected || []).map((f) => (f.id || f.name || '').toLowerCase())
    );

    const currentUserEntry = {
      id: user?.id ? `user-${user.id}` : 'current-user',
      name: user?.username || 'you',
      displayName: user?.displayName || user?.username || 'You',
      avatar: (user?.displayName || user?.username || 'U').slice(0, 2).toUpperCase(),
      avatarBg: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
      rating: userElo.rating,
      peakRating: userElo.peakRating,
      wins: userElo.wins,
      losses: userElo.losses,
      recentDelta: userElo.recentDelta,
      favLang: 'C++',
      status: 'Ready for Battle',
      title: 'Competitive Challenger',
      isCurrentUser: true,
      isFriend: false,
    };

    const roster = COMPETITIVE_LEADERBOARD_ROSTER.map((peer) => {
      const isFriend =
        friendsSet.has((peer.id || '').toLowerCase()) ||
        friendsSet.has((peer.name || '').toLowerCase());
      return {
        ...peer,
        isCurrentUser: false,
        isFriend,
      };
    });

    const combined = [currentUserEntry, ...roster];

    // Sort strictly by ELO rating descending
    combined.sort((a, b) => b.rating - a.rating);

    // Assign sequential ranks
    return combined.map((player, idx) => ({
      ...player,
      rank: idx + 1,
    }));
  }, [user, userElo, friendsData]);

  // Current user's relative standing
  const currentUserStanding = useMemo(() => {
    return allRankedCompetitors.find((dev) => dev.isCurrentUser);
  }, [allRankedCompetitors]);

  // Filter based on Scope, Tier, and Search
  const filteredCompetitors = useMemo(() => {
    return allRankedCompetitors.filter((dev) => {
      // Scope filter
      if (scope === 'friends' && !dev.isFriend && !dev.isCurrentUser) {
        return false;
      }

      // Tier filter
      if (selectedTier !== 'all') {
        const tier = getTierForRating(dev.rating);
        if (tier.name !== selectedTier) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = dev.name?.toLowerCase().includes(q);
        const matchDisplay = dev.displayName?.toLowerCase().includes(q);
        const matchLang = dev.favLang?.toLowerCase().includes(q);
        if (!matchName && !matchDisplay && !matchLang) return false;
      }

      return true;
    });
  }, [allRankedCompetitors, scope, selectedTier, searchQuery]);

  // Top 3 Podium
  const topThree = useMemo(() => {
    return [allRankedCompetitors[0], allRankedCompetitors[1], allRankedCompetitors[2]];
  }, [allRankedCompetitors]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredCompetitors.length / pageSize));
  const paginatedCompetitors = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCompetitors.slice(start, start + pageSize);
  }, [filteredCompetitors, page]);

  const handleScrollToUser = () => {
    if (userRowRef.current) {
      userRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const userTier = getTierForRating(userElo.rating);

  return (
    <div className="dash space-y-6">
      {/* ── Top Navigation Switcher Between Multiplayer Arena & Leaderboard ── */}
      <div className="multiplayer-nav-switcher card">
        <div className="multiplayer-nav-tabs">
          <button
            type="button"
            className="multiplayer-nav-tab"
            onClick={() => navigate('/multiplayer')}
          >
            <Swords size={16} />
            <span>Multiplayer Arena</span>
          </button>
          <button
            type="button"
            className="multiplayer-nav-tab is-active"
            onClick={() => {}}
          >
            <Trophy size={16} />
            <span>Multiplayer Rank Leaderboard</span>
          </button>
        </div>
        <div className="multiplayer-nav-right">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/multiplayer')}
          >
            <Play size={13} fill="currentColor" />
            <span>Play Ranked Match</span>
          </button>
        </div>
      </div>

      {/* ── Welcome & Overview Banner ── */}
      <div className="dash-welcome">
        <div className="welcome-left">
          <div className="welcome-tag">
            <Trophy size={13} />
            <span>Competitive ELO Ladder · Season 1</span>
          </div>
          <h1>Multiplayer Rank Leaderboard</h1>
          <p>
            Official chess-style ELO rating system. Win ranked races in Classic Race or 1v1 Battle to gain rating points, climb tiers, and become Grandmaster.
          </p>
        </div>

        <div className="welcome-widget">
          <div className="widget-label">YOUR RATING</div>
          <div className="widget-val" style={{ color: userTier.color }}>
            {userElo.rating} ELO
          </div>
          <div className="widget-sub">
            {userTier.icon} {userTier.name} Tier · #{currentUserStanding?.rank || '—'} Global
          </div>
        </div>
      </div>

      {/* ── Stats Grid (4 Cards) ── */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB' }}>
            <Users size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Active Competitors</span>
            <div className="stat-number">{allRankedCompetitors.length.toLocaleString()}</div>
            <span className="stat-trend positive">Global ladder</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
            <Crown size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Apex Champion</span>
            <div className="stat-number">{allRankedCompetitors[0]?.rating || 2684} ELO</div>
            <span className="stat-trend neutral">@{allRankedCompetitors[0]?.name || 'neo_matrix'}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
            <TrendingUp size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Your Win Rate</span>
            <div className="stat-number">
              {userElo.matchesPlayed > 0
                ? `${Math.round((userElo.wins / userElo.matchesPlayed) * 100)}%`
                : '0%'}
            </div>
            <span className="stat-trend positive">
              {userElo.wins}W - {userElo.losses}L
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(225, 29, 72, 0.1)', color: '#E11D48' }}>
            <Swords size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Ranked Matches</span>
            <div className="stat-number">{userElo.matchesPlayed}</div>
            <span className="stat-trend neutral">Peak: {userElo.peakRating} ELO</span>
          </div>
        </div>
      </div>

      {/* ── Top-3 Podium ── */}
      <div className="top-podium-grid">
        <TopPodiumCard dev={topThree[1]} place={2} />
        <TopPodiumCard dev={topThree[0]} place={1} />
        <TopPodiumCard dev={topThree[2]} place={3} />
      </div>

      {/* ── Your Personal Competitive Standing Card ── */}
      {currentUserStanding && (
        <div className="card your-elo-card">
          <div className="your-elo-left">
            <div className="your-elo-rank-circle">#{currentUserStanding.rank}</div>
            <div className="your-elo-avatar">{currentUserStanding.avatar}</div>
            <div className="your-elo-ident">
              <div className="your-elo-name-row">
                <span className="your-elo-name">{currentUserStanding.displayName}</span>
                <span
                  className="your-elo-tier-badge"
                  style={{
                    backgroundColor: userTier.bg,
                    color: userTier.color,
                    borderColor: userTier.border,
                  }}
                >
                  {userTier.icon} {userTier.name}
                </span>
                <span className="your-elo-you-pill">YOU</span>
              </div>
              <span className="your-elo-status">
                Baseline starting rating: 1,200 ELO · Complete ranked matches to climb
              </span>
            </div>
          </div>

          <div className="your-elo-right">
            <div className="your-elo-metric-block">
              <span className="your-elo-metric-label">CURRENT RATING</span>
              <span className="your-elo-metric-val" style={{ color: userTier.color }}>
                {userElo.rating} <small>ELO</small>
              </span>
            </div>

            <div className="your-elo-divider" />

            <div className="your-elo-metric-block">
              <span className="your-elo-metric-label">W / L RECORD</span>
              <span className="your-elo-metric-val">
                {userElo.wins}W - {userElo.losses}L
              </span>
            </div>

            <div className="your-elo-divider" />

            <div className="your-elo-metric-block">
              <span className="your-elo-metric-label">RECENT DELTA</span>
              <span
                className={`your-elo-metric-val ${
                  userElo.recentDelta > 0
                    ? 'delta-positive'
                    : userElo.recentDelta < 0
                    ? 'delta-negative'
                    : ''
                }`}
              >
                {userElo.recentDelta > 0 ? `+${userElo.recentDelta}` : userElo.recentDelta} ELO
              </span>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/multiplayer')}
            >
              <Swords size={14} />
              <span>Play Ranked</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Toolbar: Scope, Tier Filters & Search ── */}
      <div className="card leaderboard-filter-card">
        <div className="leaderboard-filter-row">
          {/* Scope Toggle */}
          <div className="scope-tabs-group">
            <button
              type="button"
              className={`scope-tab-btn ${scope === 'global' ? 'is-active' : ''}`}
              onClick={() => {
                setScope('global');
                setPage(1);
              }}
            >
              <Users size={14} />
              <span>Global Ladder</span>
            </button>
            <button
              type="button"
              className={`scope-tab-btn ${scope === 'friends' ? 'is-active' : ''}`}
              onClick={() => {
                setScope('friends');
                setPage(1);
              }}
            >
              <Shield size={14} />
              <span>Friends Only</span>
            </button>
          </div>

          {/* Tier Filter Dropdown / Pills */}
          <div className="tier-filter-scroll">
            {TIER_FILTERS.map((tf) => (
              <button
                key={tf.id}
                type="button"
                className={`tier-filter-btn ${selectedTier === tf.id ? 'is-active' : ''}`}
                onClick={() => {
                  setSelectedTier(tf.id);
                  setPage(1);
                }}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="leaderboard-search-wrap">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search competitor..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="leaderboard-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Competitive Table ── */}
      <div className="card table-container">
        <div className="table-responsive">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th style={{ width: '70px', textAlign: 'center' }}>RANK</th>
                <th>COMPETITOR</th>
                <th>RATING (ELO)</th>
                <th>TIER</th>
                <th>W / L RECORD</th>
                <th>WIN RATE</th>
                <th>PEAK ELO</th>
                <th>RECENT TREND</th>
                <th style={{ textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCompetitors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="table-empty-row">
                    <Trophy size={28} style={{ color: 'var(--t3)', margin: '0 auto 8px' }} />
                    <p>No competitors found matching your search and tier filters.</p>
                  </td>
                </tr>
              ) : (
                paginatedCompetitors.map((dev) => {
                  const devTier = getTierForRating(dev.rating);
                  const totalMatches = (dev.wins || 0) + (dev.losses || 0);
                  const wr = totalMatches > 0 ? Math.round((dev.wins / totalMatches) * 100) : 0;
                  const isTop3 = dev.rank <= 3;

                  return (
                    <tr
                      key={dev.id}
                      ref={dev.isCurrentUser ? userRowRef : null}
                      className={`leaderboard-row ${dev.isCurrentUser ? 'is-current-user-row' : ''}`}
                    >
                      {/* Rank Position */}
                      <td style={{ textAlign: 'center' }}>
                        <div className="rank-cell-wrap">
                          {dev.rank === 1 ? (
                            <span className="rank-badge rank-badge-1" title="Rank 1">
                              👑 1
                            </span>
                          ) : dev.rank === 2 ? (
                            <span className="rank-badge rank-badge-2" title="Rank 2">
                              🥈 2
                            </span>
                          ) : dev.rank === 3 ? (
                            <span className="rank-badge rank-badge-3" title="Rank 3">
                              🥉 3
                            </span>
                          ) : (
                            <span className="rank-number">#{dev.rank}</span>
                          )}
                        </div>
                      </td>

                      {/* Competitor */}
                      <td>
                        <div className="competitor-cell">
                          <div
                            className="competitor-avatar"
                            style={{ background: dev.avatarBg || '#2563EB' }}
                          >
                            {dev.avatar}
                          </div>
                          <div className="competitor-info">
                            <div className="competitor-name-row">
                              <span className="competitor-name">{dev.displayName}</span>
                              {dev.isCurrentUser && (
                                <span className="competitor-you-tag">YOU</span>
                              )}
                              {dev.isFriend && (
                                <span className="competitor-friend-tag">FRIEND</span>
                              )}
                            </div>
                            <span className="competitor-handle">
                              @{dev.name} · {dev.favLang}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* ELO Rating */}
                      <td>
                        <div className="elo-rating-cell">
                          <span className="elo-rating-val">{dev.rating.toLocaleString()}</span>
                          <span className="elo-rating-unit">ELO</span>
                        </div>
                      </td>

                      {/* Tier Badge */}
                      <td>
                        <span
                          className="table-tier-pill"
                          style={{
                            backgroundColor: devTier.bg,
                            color: devTier.color,
                            borderColor: devTier.border,
                          }}
                        >
                          {devTier.icon} {devTier.name}
                        </span>
                      </td>

                      {/* W / L Record */}
                      <td>
                        <span className="wl-record-text">
                          <strong style={{ color: '#10B981' }}>{dev.wins}W</strong> -{' '}
                          <span style={{ color: '#EF4444' }}>{dev.losses}L</span>
                        </span>
                      </td>

                      {/* Win Rate */}
                      <td>
                        <div className="win-rate-cell">
                          <span className="win-rate-num">{wr}%</span>
                          <div className="win-rate-bar-bg">
                            <div
                              className="win-rate-bar-fill"
                              style={{ width: `${Math.min(100, wr)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Peak ELO */}
                      <td>
                        <span className="peak-elo-text">{dev.peakRating || dev.rating}</span>
                      </td>

                      {/* Recent Trend */}
                      <td>
                        <span
                          className={`recent-trend-badge ${
                            dev.recentDelta > 0
                              ? 'is-pos'
                              : dev.recentDelta < 0
                              ? 'is-neg'
                              : 'is-neutral'
                          }`}
                        >
                          {dev.recentDelta > 0
                            ? `+${dev.recentDelta}`
                            : dev.recentDelta < 0
                            ? `${dev.recentDelta}`
                            : '0'}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: 'right' }}>
                        {dev.isCurrentUser ? (
                          <span className="current-user-tag">Active</span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs table-duel-btn"
                            onClick={() => navigate('/multiplayer')}
                            title={`Challenge ${dev.displayName} to 1v1 Battle`}
                          >
                            <Swords size={12} />
                            <span>1v1</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Pagination ── */}
        {totalPages > 1 && (
          <div className="leaderboard-pagination">
            <span className="pagination-info">
              Showing {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, filteredCompetitors.length)} of{' '}
              {filteredCompetitors.length} ranked competitors
            </span>

            <div className="pagination-controls">
              <button
                type="button"
                className="pagination-btn"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`pagination-page-btn ${page === i + 1 ? 'active' : ''}`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}

              <button
                type="button"
                className="pagination-btn"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
