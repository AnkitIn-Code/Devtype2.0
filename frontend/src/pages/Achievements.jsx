// src/pages/Achievements.jsx
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star, Trophy, Award, Medal, Crown, Zap, Target,
  Shield, Flame, Code2, Terminal, Cpu, Layers,
  Compass, GitBranch, FileCode, FileCode2, Globe,
  Users, Moon, Calendar, Settings, Play, Database,
  Sparkles, CheckCircle2, Lock, X, ArrowRight, Search,
  ChevronRight, Filter
} from 'lucide-react';

import { getStoredAchievements, saveStoredAchievements } from '../data/achievementsData';

/* Map icon strings to Lucide components */
const ICON_MAP = {
  Zap, Target, Shield, Flame, Code2, Terminal,
  Award, Trophy, Sparkles, Cpu, Layers, Compass,
  GitBranch, FileCode, FileCode2, Globe, Users,
  Medal, Crown, Moon, Calendar, Settings, Play,
  Database, Star
};

const DIFFICULTY_THEMES = {
  Easy: {
    label: 'Easy',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.3)',
  },
  Medium: {
    label: 'Medium',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  Hard: {
    label: 'Hard',
    color: '#F43F5E',
    bg: 'rgba(244, 63, 94, 0.12)',
    border: 'rgba(244, 63, 94, 0.3)',
  },
};

export default function Achievements() {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState(() => getStoredAchievements());
  const [filterDifficulty, setFilterDifficulty] = useState('All'); // 'All' | 'Easy' | 'Medium' | 'Hard' | 'Unlocked'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBadgeModal, setActiveBadgeModal] = useState(null);

  // Derived progress statistics
  const totalCount = achievements.length;
  const unlockedCount = useMemo(() => achievements.filter((a) => a.unlocked).length, [achievements]);
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);
  const totalEarnedXp = useMemo(
    () => achievements.filter((a) => a.unlocked).reduce((sum, a) => sum + a.rewardXp, 0),
    [achievements]
  );
  const totalPotentialXp = useMemo(
    () => achievements.reduce((sum, a) => sum + a.rewardXp, 0),
    [achievements]
  );

  // Filtered achievements
  const filteredAchievements = useMemo(() => {
    return achievements.filter((item) => {
      // Difficulty / Unlocked filter
      if (filterDifficulty === 'Unlocked' && !item.unlocked) return false;
      if (filterDifficulty !== 'All' && filterDifficulty !== 'Unlocked' && item.difficulty !== filterDifficulty) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchCategory = item.category.toLowerCase().includes(q);
        return matchTitle || matchDesc || matchCategory;
      }
      return true;
    });
  }, [achievements, filterDifficulty, searchQuery]);

  return (
    <div className="dash ach-page-root">
      {/* ==============================================================
          1. HEADER (APPLE CUPERTINO GLASS STYLE)
          ============================================================== */}
      <div className="dash-welcome">
        <div className="welcome-left">
          <div className="welcome-sup">DEVELOPER ACCOLADES &amp; MILESTONES</div>
          <h1 className="welcome-title">Achievements</h1>
          <p className="welcome-sub">
            Track milestones, unlock technical accolades, and earn XP rewards as your typing mastery expands.
          </p>
        </div>

        {/* Quick Earned XP Widget */}
        <div className="welcome-widget">
          <div className="welcome-widget-top">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Star size={16} className="welcome-cal-icon" fill="currentColor" />
              <span>Accolade Rewards</span>
            </span>
            <span className="you-pill">ACTIVE</span>
          </div>

          <div className="welcome-widget-sub">
            <Trophy size={14} />
            <span>
              <strong>{totalEarnedXp.toLocaleString()} XP</strong> earned of {totalPotentialXp.toLocaleString()} XP
            </span>
          </div>

          <div className="xp-bar" style={{ marginTop: 8, height: 5 }}>
            <div
              className="xp-bar-fill"
              style={{
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #10B981, #3B82F6)',
              }}
            />
          </div>
        </div>
      </div>

      {/* ==============================================================
          2. OVERALL UNLOCK PROGRESS CARD
          ============================================================== */}
      <div className="card ach-overview-card">
        <div className="card-bd ach-overview-inner">
          <div className="ach-overview-left">
            <div className="ach-progress-circle-wrap">
              <div className="ach-progress-ring">
                <span className="ring-percent">{progressPercent}%</span>
                <span className="ring-sub">Unlocked</span>
              </div>
            </div>

            <div className="ach-overview-info">
              <h2 className="ach-overview-title">
                {unlockedCount} of {totalCount} Badges Unlocked
              </h2>
              <p className="ach-overview-desc">
                You have claimed <strong>{totalEarnedXp.toLocaleString()} XP</strong> from completed coding milestones.
                Keep practicing daily to unlock remaining hard challenges.
              </p>

              <div className="ach-overview-bar-wrap">
                <div className="ach-overview-bar">
                  <div
                    className="ach-overview-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="ach-tier-breakdown">
                  <span className="ach-tier-pill tier-easy">
                    <span className="tier-dot" style={{ background: '#10B981' }} />
                    {achievements.filter((a) => a.difficulty === 'Easy' && a.unlocked).length} /{' '}
                    {achievements.filter((a) => a.difficulty === 'Easy').length} Easy
                  </span>
                  <span className="ach-tier-pill tier-medium">
                    <span className="tier-dot" style={{ background: '#F59E0B' }} />
                    {achievements.filter((a) => a.difficulty === 'Medium' && a.unlocked).length} /{' '}
                    {achievements.filter((a) => a.difficulty === 'Medium').length} Medium
                  </span>
                  <span className="ach-tier-pill tier-hard">
                    <span className="tier-dot" style={{ background: '#F43F5E' }} />
                    {achievements.filter((a) => a.difficulty === 'Hard' && a.unlocked).length} /{' '}
                    {achievements.filter((a) => a.difficulty === 'Hard').length} Hard
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==============================================================
          3. CONTROLS TOOLBAR (FILTER TABS & SEARCH)
          ============================================================== */}
      <div className="card ach-toolbar-card">
        <div className="card-bd ach-toolbar-inner">
          <div className="ach-filter-tabs">
            {[
              { id: 'All', label: `All (${totalCount})` },
              { id: 'Easy', label: `Easy (${achievements.filter((a) => a.difficulty === 'Easy').length})` },
              { id: 'Medium', label: `Medium (${achievements.filter((a) => a.difficulty === 'Medium').length})` },
              { id: 'Hard', label: `Hard (${achievements.filter((a) => a.difficulty === 'Hard').length})` },
              { id: 'Unlocked', label: `Unlocked (${unlockedCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`ach-tab-btn ${filterDifficulty === tab.id ? 'active' : ''}`}
                onClick={() => setFilterDifficulty(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="ach-search-wrap">
            <Search size={14} className="ach-search-icon" />
            <input
              type="text"
              placeholder="Search badges by title, requirement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ach-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="ach-search-clear"
                onClick={() => setSearchQuery('')}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ==============================================================
          4. RESPONSIVE GRID OF ACHIEVEMENT CARDS
          ============================================================== */}
      {filteredAchievements.length === 0 ? (
        <div className="card ach-empty-card">
          <div className="empty-state">
            <div className="empty-icon">
              <Award size={26} strokeWidth={1.8} />
            </div>
            <div className="empty-title">No badges match your filter</div>
            <div className="empty-desc">
              Try adjusting your difficulty tab or search terms to browse the accolade catalog.
            </div>
            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setFilterDifficulty('All');
                  setSearchQuery('');
                }}
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="ach-cards-grid">
          {filteredAchievements.map((badge) => {
            const Icon = ICON_MAP[badge.icon] || Award;
            const diffTheme = DIFFICULTY_THEMES[badge.difficulty] || DIFFICULTY_THEMES.Easy;
            const pct = Math.min(100, Math.round((badge.progress / badge.maxProgress) * 100));

            return (
              <div
                key={badge.id}
                className={`card ach-card ${badge.unlocked ? 'unlocked' : 'locked'}`}
                onClick={() => setActiveBadgeModal(badge)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setActiveBadgeModal(badge)}
              >
                {/* Header: Difficulty & Reward XP */}
                <div className="ach-card-header">
                  <span
                    className="ach-diff-pill"
                    style={{
                      color: diffTheme.color,
                      background: diffTheme.bg,
                      borderColor: diffTheme.border,
                    }}
                  >
                    {badge.difficulty}
                  </span>

                  <span className="ach-reward-xp">
                    <Star size={11} fill="currentColor" />
                    +{badge.rewardXp} XP
                  </span>
                </div>

                {/* Badge Icon & Halo */}
                <div className="ach-icon-area">
                  <div
                    className={`ach-icon-circle ${badge.unlocked ? 'icon-unlocked' : 'icon-locked'}`}
                    style={{
                      background: badge.unlocked ? diffTheme.bg : 'var(--bg-hover)',
                      borderColor: badge.unlocked ? diffTheme.border : 'var(--glass-border)',
                      color: badge.unlocked ? diffTheme.color : 'var(--t3)',
                    }}
                  >
                    <Icon size={24} strokeWidth={2} />
                    {badge.unlocked ? (
                      <span className="ach-check-badge" title="Unlocked">
                        <CheckCircle2 size={13} color="#10B981" fill="var(--bg-surface)" />
                      </span>
                    ) : (
                      <span className="ach-lock-badge" title="Locked">
                        <Lock size={11} color="var(--t3)" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Content: Title & Description */}
                <div className="ach-card-body">
                  <h3 className="ach-card-title">{badge.title}</h3>
                  <p className="ach-card-desc">{badge.description}</p>
                </div>

                {/* Footer: Progress Bar & Status Text */}
                <div className="ach-card-footer">
                  <div className="ach-progress-row">
                    <span className="ach-progress-text">
                      {badge.unlocked ? (
                        <span className="ach-unlocked-status">
                          <CheckCircle2 size={12} color="#10B981" />
                          <span>Unlocked</span>
                        </span>
                      ) : (
                        <span>
                          {badge.progress} / {badge.maxProgress} {badge.unit}
                        </span>
                      )}
                    </span>
                    <span className="ach-progress-pct">{pct}%</span>
                  </div>

                  <div className="ach-card-bar">
                    <div
                      className="ach-card-fill"
                      style={{
                        width: `${pct}%`,
                        background: badge.unlocked
                          ? diffTheme.color
                          : 'linear-gradient(90deg, #3B82F6, #6366F1)',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==============================================================
          5. BADGE DETAILS MODAL (REQUIREMENTS, PROGRESS, TIPS, REWARD)
          ============================================================== */}
      {activeBadgeModal && (() => {
        const badge = activeBadgeModal;
        const Icon = ICON_MAP[badge.icon] || Award;
        const diffTheme = DIFFICULTY_THEMES[badge.difficulty] || DIFFICULTY_THEMES.Easy;
        const pct = Math.min(100, Math.round((badge.progress / badge.maxProgress) * 100));

        return (
          <div className="modal-backdrop" onClick={() => setActiveBadgeModal(null)}>
            <div
              className="modal-box ach-details-modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              {/* Close Button */}
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActiveBadgeModal(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>

              <div className="ach-modal-content">
                {/* Large Badge Icon */}
                <div
                  className="ach-modal-icon-circle"
                  style={{
                    background: badge.unlocked ? diffTheme.bg : 'var(--bg-hover)',
                    borderColor: badge.unlocked ? diffTheme.border : 'var(--glass-border)',
                    color: badge.unlocked ? diffTheme.color : 'var(--t2)',
                  }}
                >
                  <Icon size={36} strokeWidth={2} />
                </div>

                <div className="ach-modal-tags">
                  <span
                    className="ach-diff-pill"
                    style={{
                      color: diffTheme.color,
                      background: diffTheme.bg,
                      borderColor: diffTheme.border,
                    }}
                  >
                    {badge.difficulty}
                  </span>
                  <span className="badge badge-indigo">{badge.category}</span>
                  <span className="ach-reward-xp" style={{ fontSize: '0.8rem' }}>
                    <Star size={13} fill="currentColor" />
                    +{badge.rewardXp} XP
                  </span>
                </div>

                <h2 className="ach-modal-title">{badge.title}</h2>
                <p className="ach-modal-desc">{badge.description}</p>

                {/* Progress Box */}
                <div className="ach-modal-progress-card">
                  <div className="modal-prog-header">
                    <span className="prog-label">Progress</span>
                    <span className="prog-val">
                      {badge.progress} / {badge.maxProgress} {badge.unit} ({pct}%)
                    </span>
                  </div>
                  <div className="ach-card-bar" style={{ height: 8 }}>
                    <div
                      className="ach-card-fill"
                      style={{
                        width: `${pct}%`,
                        background: badge.unlocked ? diffTheme.color : 'linear-gradient(90deg, #3B82F6, #6366F1)',
                      }}
                    />
                  </div>
                </div>

                {/* Practical Tip */}
                {badge.tips && (
                  <div className="ach-modal-tip-box">
                    <Sparkles size={16} className="tip-sparkle" />
                    <div className="tip-text">
                      <strong>Strategy Tip:</strong> {badge.tips}
                    </div>
                  </div>
                )}

                {/* Timestamp info if unlocked */}
                {badge.unlocked && badge.unlockedAt && (
                  <div className="ach-modal-date-tag">
                    <CheckCircle2 size={13} color="#10B981" />
                    <span>Unlocked on {new Date(badge.unlockedAt).toLocaleDateString()}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="ach-modal-actions">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setActiveBadgeModal(null)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setActiveBadgeModal(null);
                      navigate('/practice');
                    }}
                  >
                    <Play size={13} fill="currentColor" />
                    <span>Practice Now</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
