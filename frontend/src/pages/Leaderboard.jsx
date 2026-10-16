// src/pages/Leaderboard.jsx
import { useState, useMemo, useRef } from 'react';
import {
  Zap, Trophy, Medal, Crown, Star,
  Globe, Users, Search, X, RotateCcw, ChevronLeft,
  ChevronRight, ArrowRight, Award
} from 'lucide-react';

import { filterLeaderboard } from '../utils/leaderboardStore';

/* ================================================================
   TIMEFRAME OPTIONS
   ================================================================ */
const TIMEFRAMES = [
  { id: 'allTime', label: 'All Time' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'thisWeek', label: 'This Week' },
  { id: 'today', label: 'Today' },
];

const LANG_COLORS = {
  'C++': '#2563EB',
  Rust: '#EA580C',
  TypeScript: '#0284C7',
  Python: '#4F46E5',
  Go: '#0D9488',
  Java: '#DC2626',
  JavaScript: '#D97706',
  SQL: '#7C3AED',
};

/* ================================================================
   CLEAN TOP-3 PODIUM CARD (HUMAN, RESTRAINED, CUPERTINO GLASS)
   ================================================================ */
function TopPodiumCard({ dev, place, metric }) {
  if (!dev) return null;

  const isFirst = place === 1;
  const isSecond = place === 2;
  const isThird = place === 3;

  const config = isFirst
    ? {
        label: '1st Place',
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

  return (
    <div
      className={`card top-podium-card ${
        isFirst ? 'podium-rank-1' : isSecond ? 'podium-rank-2' : 'podium-rank-3'
      } ${dev.isCurrentUser ? 'podium-current-user' : ''}`}
    >
      {/* Top Header: Rank position & Level */}
      <div className="top-podium-header">
        <span className={`podium-pill ${config.badgeClass}`}>
          <IconComp size={13} />
          <span>{config.label}</span>
        </span>
        <span className="podium-level-pill">Lv {dev.level}</span>
      </div>

      {/* Avatar Section */}
      <div className="top-podium-avatar-section">
        {isFirst && (
          <div className="podium-crown-halo" title="Rank 1 Champion">
            <Crown size={19} color="#F59E0B" fill="#F59E0B" />
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

      {/* Identity: Name, Handle, Title */}
      <div className="top-podium-identity">
        <div className="podium-name-row">
          <h3 className="podium-name">{dev.displayName}</h3>
          {dev.isCurrentUser && <span className="you-pill">YOU</span>}
        </div>
        <div className="podium-handle">@{dev.name}</div>
        <div className="podium-title">{dev.title}</div>
      </div>

      {/* Stack Badge */}
      <div className="podium-stack-row">
        <span className="podium-stack-pill">
          <span
            className="lang-dot-mini"
            style={{ background: LANG_COLORS[dev.primaryLang] || 'var(--t3)' }}
          />
          {dev.primaryLang}
        </span>
      </div>

      {/* Big Score Box */}
      <div className="podium-score-box">
        <span className="podium-score-num">
          {metric === 'wpm' ? dev.wpm : dev.xp.toLocaleString()}
        </span>
        <span className="podium-score-unit">
          {metric === 'wpm' ? 'WPM' : 'XP'}
        </span>
      </div>

      {/* Sub-stats Row */}
      <div className="podium-substats-row">
        <div className="podium-substat">
          <span className="substat-label">Accuracy</span>
          <span className="substat-val">{dev.accuracy}%</span>
        </div>
        <div className="podium-substat-divider" />
        <div className="podium-substat">
          <span className="substat-label">Sessions</span>
          <span className="substat-val">{dev.sessions}</span>
        </div>
        <div className="podium-substat-divider" />
        <div className="podium-substat">
          <span className="substat-label">{metric === 'wpm' ? 'Total XP' : 'Speed'}</span>
          <span className="substat-val">
            {metric === 'wpm' ? `${(dev.xp / 1000).toFixed(1)}k` : `${dev.wpm} WPM`}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   MAIN LEADERBOARD PAGE COMPONENT
   ================================================================ */
export default function Leaderboard() {
  const [scope, setScope] = useState('global'); // 'global' | 'friends'
  const [metric, setMetric] = useState('wpm'); // 'wpm' | 'xp'
  const [timeframe, setTimeframe] = useState('allTime'); // 'allTime' | 'thisMonth' | 'thisWeek' | 'today'
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const userRowRef = useRef(null);

  // Filter and dynamic ranking logic
  const rankedDevelopers = useMemo(() => {
    return filterLeaderboard({
      scope,
      metric,
      timeframe,
      searchQuery,
    });
  }, [scope, metric, timeframe, searchQuery]);

  // Current user's relative standing
  const currentUserStanding = useMemo(() => {
    return rankedDevelopers.find((dev) => dev.isCurrentUser);
  }, [rankedDevelopers]);

  // Top 3 for podium (Order: 2nd place on left, 1st place in center, 3rd place on right)
  const topThree = useMemo(() => {
    if (rankedDevelopers.length >= 3 && !searchQuery.trim()) {
      return [
        { dev: rankedDevelopers[1], place: 2 }, // 2nd Silver
        { dev: rankedDevelopers[0], place: 1 }, // 1st Gold (Center)
        { dev: rankedDevelopers[2], place: 3 }, // 3rd Bronze
      ];
    }
    return [];
  }, [rankedDevelopers, searchQuery]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(rankedDevelopers.length / pageSize));
  const paginatedDevelopers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rankedDevelopers.slice(start, start + pageSize);
  }, [rankedDevelopers, page]);

  // Scroll to current user row
  const scrollToCurrentUser = () => {
    if (currentUserStanding) {
      const userIndex = rankedDevelopers.findIndex((d) => d.isCurrentUser);
      if (userIndex !== -1) {
        const targetPage = Math.floor(userIndex / pageSize) + 1;
        if (targetPage !== page) {
          setPage(targetPage);
        }
        setTimeout(() => {
          userRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setScope('global');
    setMetric('wpm');
    setTimeframe('allTime');
    setSearchQuery('');
    setPage(1);
  };

  return (
    <div className="dash lb-dashboard-root">
      {/* ==============================================================
          1. HEADER (CLEAN APPLE CUPERTINO GLASS STYLE)
          ============================================================== */}
      <div className="dash-welcome">
        <div className="welcome-left">
          <div className="welcome-sup">DEVELOPER RANKINGS</div>
          <h1 className="welcome-title">Leaderboard</h1>
          <p className="welcome-sub">
            Track community typing velocity, accuracy, and coding consistency.
          </p>
        </div>

        {/* Current User Quick Standing Banner */}
        {currentUserStanding && (
          <div className="welcome-widget">
            <div className="welcome-widget-top">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={16} className="welcome-cal-icon" />
                <span>Your Standing</span>
              </span>
              <span className="you-pill">YOU</span>
            </div>

            <div className="welcome-widget-sub">
              <Zap size={14} />
              <span>
                <strong>#{currentUserStanding.rank}</strong> of {rankedDevelopers.length} developers
                {' '}• {metric === 'wpm' ? `${currentUserStanding.wpm} WPM` : `${currentUserStanding.xp.toLocaleString()} XP`}
              </span>
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-sm lb-jump-action"
              onClick={scrollToCurrentUser}
              style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}
            >
              <span>Scroll to My Row</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}
      </div>

      {/* ==============================================================
          2. CONTROLS TOOLBAR (SCOPE, METRIC, TIMEFRAME, BALANCED SEARCH)
          ============================================================== */}
      <div className="card lb-toolbar-card">
        <div className="card-bd lb-toolbar-inner">
          <div className="lb-toolbar-row">
            {/* Scope Toggle: Global vs Friends */}
            <div className="lb-segmented-control" role="tablist" aria-label="Ranking Scope">
              <button
                type="button"
                role="tab"
                aria-selected={scope === 'global'}
                className={`lb-segment-btn ${scope === 'global' ? 'active' : ''}`}
                onClick={() => {
                  setScope('global');
                  setPage(1);
                }}
              >
                <Globe size={14} />
                <span>Global Rankings</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={scope === 'friends'}
                className={`lb-segment-btn ${scope === 'friends' ? 'active' : ''}`}
                onClick={() => {
                  setScope('friends');
                  setPage(1);
                }}
              >
                <Users size={14} />
                <span>Friends & Peers</span>
              </button>
            </div>

            {/* Metric Toggle: WPM vs XP */}
            <div className="lb-segmented-control" role="tablist" aria-label="Ranking Metric">
              <button
                type="button"
                role="tab"
                aria-selected={metric === 'wpm'}
                className={`lb-segment-btn ${metric === 'wpm' ? 'active' : ''}`}
                onClick={() => {
                  setMetric('wpm');
                  setPage(1);
                }}
              >
                <Zap size={14} />
                <span>WPM Speed</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={metric === 'xp'}
                className={`lb-segment-btn ${metric === 'xp' ? 'active' : ''}`}
                onClick={() => {
                  setMetric('xp');
                  setPage(1);
                }}
              >
                <Star size={14} />
                <span>XP Points</span>
              </button>
            </div>

            {/* Timeframe Filter Pills */}
            <div className="lb-timeframe-pills" role="radiogroup" aria-label="Timeframe">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.id}
                  type="button"
                  className={`lb-tf-pill ${timeframe === tf.id ? 'active' : ''}`}
                  onClick={() => {
                    setTimeframe(tf.id);
                    setPage(1);
                  }}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Search Input - Cleanly integrated */}
            <div className="lb-search-field-wrap">
              <Search size={14} className="lb-search-input-icon" />
              <input
                type="text"
                placeholder="Search engineer by name, handle, role..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="lb-search-field"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="lb-search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ==============================================================
          3. CLEAN TOP-3 PODIUM (HUMAN, RESTRAINED, NO CODE BLOAT)
          ============================================================== */}
      {rankedDevelopers.length === 0 ? (
        /* Empty State */
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">
              {scope === 'friends' ? <Users size={24} strokeWidth={1.8} /> : <Search size={24} strokeWidth={1.8} />}
            </div>
            <div className="empty-title">
              {scope === 'friends' ? 'No friends on this board yet' : 'No developers found'}
            </div>
            <div className="empty-desc">
              {scope === 'friends'
                ? 'None of your peers have activity recorded for this timeframe. You can switch to Global Rankings or invite colleagues.'
                : `No benchmark profiles matched "${searchQuery}".`}
            </div>
            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleResetFilters}
              >
                <RotateCcw size={13} />
                <span>Reset All Filters</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Top 3 Podium (Only when full list visible without search query) */}
          {topThree.length === 3 && (
            <div className="top-podium-row">
              {topThree.map(({ dev, place }) => (
                <TopPodiumCard key={dev.id} dev={dev} place={place} metric={metric} />
              ))}
            </div>
          )}

          {/* ==============================================================
              4. RANKED ROSTER TABLE (MATCHES DASHBOARD SESSIONS CARD)
              ============================================================== */}
          <div className="card sessions-card lb-table-card">
            <div className="card-hd">
              <div className="card-hd-left">
                <div className="card-title">
                  <Trophy size={18} color="var(--brand)" />
                  <span>Ranked Engineering Roster</span>
                </div>
                <div className="card-sub">
                  Showing {paginatedDevelopers.length} of {rankedDevelopers.length} developers sorted by{' '}
                  <strong>{metric === 'wpm' ? 'Speed (WPM)' : 'Experience (XP)'}</strong>
                </div>
              </div>

              <div className="practice-meta">
                <span className="badge badge-teal">
                  <Globe size={12} />
                  {scope === 'global' ? 'Global' : 'Friends'}
                </span>
                <span className="level-pill">
                  {TIMEFRAMES.find((t) => t.id === timeframe)?.label}
                </span>
              </div>
            </div>

            <div className="card-bd" style={{ padding: '0 0 8px 0' }}>
              <div className="lb-table-scroll-wrapper">
                <table className="lb-roster-table" aria-label="Developer Leaderboard Table">
                  <thead>
                    <tr>
                      <th scope="col" className="th-center" style={{ width: 64 }}>Rank</th>
                      <th scope="col">Developer</th>
                      <th scope="col" style={{ width: 80 }}>Level</th>
                      <th scope="col" style={{ width: 110 }}>Language</th>
                      <th scope="col" className="th-right" style={{ width: 110 }}>
                        {metric === 'wpm' ? 'Best Speed' : 'XP Points'}
                      </th>
                      <th scope="col" className="th-right" style={{ width: 110 }}>
                        {metric === 'wpm' ? 'XP Points' : 'Best Speed'}
                      </th>
                      <th scope="col" className="th-right" style={{ width: 90 }}>Accuracy</th>
                      <th scope="col" className="th-right" style={{ width: 90 }}>Sessions</th>
                      <th scope="col" className="th-center" style={{ width: 90 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDevelopers.map((dev) => {
                      const isCurrentUser = dev.isCurrentUser;
                      const isTop1 = dev.rank === 1;
                      const isTop2 = dev.rank === 2;
                      const isTop3 = dev.rank === 3;

                      return (
                        <tr
                          key={dev.id}
                          ref={isCurrentUser ? userRowRef : null}
                          className={`roster-row ${isCurrentUser ? 'current-user-roster-row' : ''} ${
                            isTop1 ? 'row-rank-1' : isTop2 ? 'row-rank-2' : isTop3 ? 'row-rank-3' : ''
                          }`}
                        >
                          {/* Rank */}
                          <td className="th-center">
                            {isTop1 ? (
                              <span className="rank-medal rank-gold" title="Rank 1">
                                <Crown size={13} /> 1
                              </span>
                            ) : isTop2 ? (
                              <span className="rank-medal rank-silver" title="Rank 2">
                                <Medal size={13} /> 2
                              </span>
                            ) : isTop3 ? (
                              <span className="rank-medal rank-bronze" title="Rank 3">
                                <Award size={13} /> 3
                              </span>
                            ) : (
                              <span className="rank-plain">#{dev.rank}</span>
                            )}
                          </td>

                          {/* Developer Info */}
                          <td>
                            <div className="engineer-cell">
                              <div
                                className="engineer-avatar"
                                style={{ background: dev.avatarBg || '#2563EB' }}
                              >
                                {dev.avatar}
                              </div>
                              <div className="engineer-meta">
                                <div className="engineer-name-line">
                                  <span className="engineer-name">{dev.displayName}</span>
                                  {isCurrentUser && (
                                    <span className="you-pill">YOU</span>
                                  )}
                                </div>
                                <div className="engineer-sub-line">
                                  <span className="engineer-handle">@{dev.name}</span>
                                  <span className="engineer-sep">•</span>
                                  <span className="engineer-title">{dev.title}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Level */}
                          <td>
                            <span className="level-badge">Lv {dev.level}</span>
                          </td>

                          {/* Primary Language */}
                          <td>
                            <div className="session-lang" style={{ gap: 6, fontWeight: 600 }}>
                              <div
                                className="lang-dot"
                                style={{ background: LANG_COLORS[dev.primaryLang] || 'var(--t3)' }}
                              />
                              <span>{dev.primaryLang}</span>
                            </div>
                          </td>

                          {/* Primary Metric */}
                          <td className="th-right">
                            <span className="metric-primary-text">
                              {metric === 'wpm' ? `${dev.wpm} WPM` : `${dev.xp.toLocaleString()} XP`}
                            </span>
                          </td>

                          {/* Secondary Metric */}
                          <td className="th-right">
                            <span className="metric-secondary-text">
                              {metric === 'wpm' ? `${dev.xp.toLocaleString()} XP` : `${dev.wpm} WPM`}
                            </span>
                          </td>

                          {/* Accuracy */}
                          <td className="th-right">
                            <span className="metric-acc-text">{dev.accuracy}%</span>
                          </td>

                          {/* Sessions */}
                          <td className="th-right">
                            <span className="metric-sessions-text">{dev.sessions}</span>
                          </td>

                          {/* Status */}
                          <td className="th-center">
                            {isCurrentUser ? (
                              <span className="badge badge-teal">Active</span>
                            ) : dev.isFriend ? (
                              <span className="badge badge-indigo">Peer</span>
                            ) : (
                              <span className="badge" style={{ background: 'var(--bg-hover)', color: 'var(--t3)' }}>
                                Global
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              {totalPages > 1 && (
                <div className="lb-pagination-footer">
                  <div className="pagination-text">
                    Page <strong>{page}</strong> of {totalPages} ({rankedDevelopers.length} developers)
                  </div>
                  <div className="pagination-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft size={14} />
                      <span>Previous</span>
                    </button>
                    <div className="page-pill-row">
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`page-pill-btn ${page === i + 1 ? 'active' : ''}`}
                          onClick={() => setPage(i + 1)}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      <span>Next</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
