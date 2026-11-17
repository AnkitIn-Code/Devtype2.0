// src/pages/Revision.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Calendar,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Zap,
  Layers,
  ChevronRight,
  BookOpen,
  ShieldCheck,
  Target,
  MoreHorizontal,
  Play,
  Flame
} from 'lucide-react';
import srsService from '../services/srsService';
import { useAuth } from '../context/AuthContext';
import { dataCache } from '../services/dataCache';

export default function Revision() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const cachedDeck = dataCache.getDeck(user?.id);
  const [deck, setDeck] = useState(() => cachedDeck || srsService.getLocalDeck());
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'due' | 'algo' | 'mastered'
  const [searchQuery, setSearchQuery] = useState('');

  const loadDeck = useCallback(async () => {
    try {
      const data = await srsService.getDeck();
      if (data && Array.isArray(data)) {
        setDeck(data);
        dataCache.setDeck(user?.id, data);
      }
    } catch (err) {
      console.error('Failed to load SRS deck:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDeck();
    const handleSrsUpdate = () => loadDeck();
    const handleCacheRevalidated = () => {
      const cached = dataCache.getDeck(user?.id);
      if (cached && Array.isArray(cached)) {
        setDeck(cached);
      }
    };
    window.addEventListener('devtype_srs_updated', handleSrsUpdate);
    window.addEventListener('devtype_cache_revalidated', handleCacheRevalidated);
    return () => {
      window.removeEventListener('devtype_srs_updated', handleSrsUpdate);
      window.removeEventListener('devtype_cache_revalidated', handleCacheRevalidated);
    };
  }, [loadDeck, user?.id]);

  const now = new Date();
  const dueCards = useMemo(() => {
    return deck.filter((c) => !c.isMastered && (!c.dueDate || new Date(c.dueDate) <= now));
  }, [deck]);

  const masteredCards = useMemo(() => {
    return deck.filter((c) => c.isMastered || c.intervalDays === null);
  }, [deck]);

  const filteredCards = useMemo(() => {
    return deck.filter((c) => {
      // Tab filter
      if (activeTab === 'due' && (c.isMastered || (c.dueDate && new Date(c.dueDate) > now))) {
        return false;
      }
      if (activeTab === 'mastered' && !c.isMastered && c.intervalDays !== null) {
        return false;
      }
      if (activeTab === 'algo') {
        const isAlgo =
          (c.category || '').toLowerCase().includes('algo') ||
          (c.category || '').toLowerCase().includes('foundation') ||
          (c.category || '').toLowerCase().includes('structure') ||
          ['binary-search', 'two-sum', 'quick-sort', 'merge-sort', 'lru-cache', 'cpp-fast-io', 'cp-'].some((k) =>
            (c.snippetId || '').toLowerCase().includes(k)
          );
        if (!isAlgo) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (c.title || c.snippetTitle || '').toLowerCase().includes(q);
        const matchesLang = (c.language || '').toLowerCase().includes(q);
        const matchesId = (c.snippetId || '').toLowerCase().includes(q);
        const matchesCat = (c.category || '').toLowerCase().includes(q);
        return matchesTitle || matchesLang || matchesId || matchesCat;
      }

      return true;
    });
  }, [deck, activeTab, searchQuery]);

  const handleStartPractice = (card) => {
    const id = card.snippetId || card.id;
    const lang = card.language || 'C++';
    navigate(`/practice?snippet=${encodeURIComponent(id)}&lang=${encodeURIComponent(lang)}`);
  };

  const handleViewTheory = (card) => {
    const target = card.slug || card.snippetId || card.id;
    navigate(`/theory/${encodeURIComponent(target)}`);
  };

  // Retention index computation based on average ease factors, repetitions, and mastery
  const retentionIndex = useMemo(() => {
    if (deck.length === 0) return 92.4;
    const totalScore = deck.reduce((acc, c) => {
      const ef = c.easeFactor || 2.50;
      const rep = Math.min(5, c.repetition || 0);
      const masteryBonus = c.isMastered ? 12 : 0;
      return acc + (ef * 26 + rep * 4 + masteryBonus);
    }, 0);
    const avg = totalScore / deck.length;
    return Math.min(99.6, Math.max(70.0, avg)).toFixed(1);
  }, [deck]);

  const avgEaseFactor = useMemo(() => {
    if (deck.length === 0) return '2.50';
    const sum = deck.reduce((acc, c) => acc + (c.easeFactor || 2.50), 0);
    return (sum / deck.length).toFixed(2);
  }, [deck]);

  return (
    <div className="dash space-y-6">
      {/* ── Welcome Header (Matches Dashboard Design Exactly) ── */}
      <div className="dash-welcome">
        <div className="welcome-left">
          <div className="welcome-sup flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>SM-2 Cognitive Engine // Active Spaced Repetition</span>
          </div>
          <h1 className="welcome-title">Active Recall &amp; Revision</h1>
          <p className="welcome-sub">
            Reinforce decaying algorithmic syntax and patterns through scientifically scheduled spaced repetition drills.{' '}
            <span className="text-primary font-semibold">
              {dueCards.length > 0 ? `${dueCards.length} cards due for recall today` : 'All scheduled cards are up to date'}
            </span>.
          </p>
        </div>

        {/* Ice Glass Due Review Widget */}
        <div className="welcome-widget">
          <div className="welcome-widget-top">
            <span>{dueCards.length} Due Now</span>
            <Brain size={16} className="welcome-cal-icon" />
          </div>
          <div className="welcome-widget-sub">
            <Clock size={14} fill="currentColor" strokeWidth={0} />
            <span>SM-2 Schedule Active</span>
          </div>
        </div>
      </div>

      {/* ── 4 Stat Cards Grid (Matches Dashboard Exactly) ── */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-top">
              <div className="stat-icon-wrap amber">
                <Clock size={19} strokeWidth={2.2} />
              </div>
              <div className="stat-top-right">
                <span className={`badge ${dueCards.length > 0 ? 'badge-rose' : 'badge-teal'}`}>
                  {dueCards.length > 0 ? 'Action Due' : 'Synced'}
                </span>
              </div>
            </div>
            <div className="stat-num">{loading ? '...' : dueCards.length}</div>
            <div className="stat-label">Due for Recall</div>
            <div className="stat-sub">
              <span>{dueCards.length > 0 ? 'Review to prevent decay' : 'Peak retention'}</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-top">
              <div className="stat-icon-wrap cobalt">
                <Layers size={19} strokeWidth={2.2} />
              </div>
              <div className="stat-top-right">
                <span className="badge badge-teal">Deck</span>
              </div>
            </div>
            <div className="stat-num">{loading ? '...' : deck.length}</div>
            <div className="stat-label">Total Deck Size</div>
            <div className="stat-sub">
              <span>{masteredCards.length} permanently mastered</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-top">
              <div className="stat-icon-wrap emerald">
                <Target size={19} strokeWidth={2.2} />
              </div>
              <div className="stat-top-right">
                <TrendingUp size={16} className="stat-action-icon" />
              </div>
            </div>
            <div className="stat-num">{retentionIndex}%</div>
            <div className="stat-label">Synaptic Retention Index</div>
            <div className="stat-sub">
              <span>Weighted SM-2 cognitive score</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-top">
              <div className="stat-icon-wrap rose">
                <Zap size={19} strokeWidth={2.2} />
              </div>
              <div className="stat-top-right">
                <Sparkles size={16} className="stat-action-icon" />
              </div>
            </div>
            <div className="stat-num">{avgEaseFactor}x</div>
            <div className="stat-label">Average Ease Factor</div>
            <div className="stat-sub">
              <span>SuperMemo difficulty multiplier</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Dual Practice & Theory Modes Spotlight ── */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Sparkles size={16} color="var(--brand)" />
          <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--t1)', margin: 0 }}>
            Structured Recall Workflow: Practice &amp; Theory
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          <div style={{ padding: 16, borderRadius: 10, background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="badge badge-teal" style={{ fontSize: '0.68rem' }}>Option 1 &bull; Typing Drills</span>
              <Play size={14} color="var(--brand)" />
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>Hands-On Code Practice</div>
            <p style={{ fontSize: '0.78rem', color: 'var(--t3)', margin: 0, lineHeight: 1.5 }}>
              Type the exact blueprint with real-time error detection, WPM tracking, and auto-indent to ingrain muscle memory and syntax cadences.
            </p>
          </div>

          <div style={{ padding: 16, borderRadius: 10, background: 'var(--bg-surface)', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="badge badge-cobalt" style={{ fontSize: '0.68rem' }}>Option 2 &bull; Conceptual Study</span>
              <BookOpen size={14} color="#3B82F6" />
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>Algorithmic Theory &amp; Architecture</div>
            <p style={{ fontSize: '0.78rem', color: 'var(--t3)', margin: 0, lineHeight: 1.5 }}>
              Explore comprehensive mathematical formulas, asymptotic proofs, invariant properties, and architecture diagrams for each pattern.
            </p>
          </div>
        </div>
      </div>

      {/* ── Recall Action Spotlight Queue ── */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--glass-border-sub)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(217, 119, 6, 0.12)', border: '1px solid rgba(217, 119, 6, 0.25)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} strokeWidth={2.2} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--t1)', margin: 0 }}>
                Recall Action Queue ({dueCards.length})
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--t3)', margin: 0 }}>
                High-priority cards scheduled for immediate review to maintain muscle memory.
              </p>
            </div>
          </div>

          {dueCards.length > 0 && (
            <button
              onClick={() => handleStartPractice(dueCards[0])}
              className="btn btn-primary btn-sm"
            >
              <Sparkles size={13} />
              <span>Practice Due Cards Now</span>
            </button>
          )}
        </div>

        {deck.length === 0 ? (
          <div style={{ padding: '36px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={24} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--t1)', margin: 0 }}>
              No Reviews Scheduled Yet
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--t3)', maxWidth: 460, margin: 0, lineHeight: 1.5 }}>
              You haven't practiced any templates yet. Complete coding practice drills to automatically schedule algorithmic patterns to your review queue.
            </p>
            <button
              onClick={() => navigate('/practice')}
              className="btn btn-primary btn-sm"
              style={{ marginTop: 6 }}
            >
              <Zap size={13} />
              <span>Go to Practice Mode</span>
            </button>
          </div>
        ) : dueCards.length === 0 ? (
          <div style={{ padding: '36px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={24} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--t1)', margin: 0 }}>
              All caught up! Zero cards due right now.
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--t3)', maxWidth: 460, margin: 0, lineHeight: 1.5 }}>
              Your motor recall for scheduled blueprints is in peak state. Complete more drills in the Templates Catalog to expand your personal deck.
            </p>
            <button
              onClick={() => navigate('/templates')}
              className="btn btn-secondary-glass btn-sm"
              style={{ marginTop: 6 }}
            >
              <BookOpen size={13} />
              <span>Browse Blueprint Catalog</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {dueCards.map((card) => {
              const lang = card.language || 'Code';
              return (
                <div
                  key={card.id || card.snippetId}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span className="badge badge-teal" style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                        {lang}
                      </span>
                      <span className="badge badge-rose" style={{ fontSize: '0.68rem' }}>
                        Due Now
                      </span>
                    </div>

                    <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--t1)', margin: '0 0 6px 0' }}>
                      {card.title || card.snippetTitle || card.snippetId}
                    </h4>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--t3)', margin: '8px 0' }}>
                      <span>Rep: <strong style={{ color: 'var(--t1)' }}>{card.repetition || 0}</strong></span>
                      <span>&bull;</span>
                      <span>Interval: <strong style={{ color: 'var(--brand)' }}>{card.intervalDays != null ? `${card.intervalDays}d` : 'Mastered'}</strong></span>
                      <span>&bull;</span>
                      <span>EF: <strong style={{ color: 'var(--t1)' }}>{(card.easeFactor || 2.5).toFixed(2)}</strong></span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                    <button
                      onClick={() => handleStartPractice(card)}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, justifyContent: 'center', height: 32 }}
                    >
                      <Play size={13} fill="currentColor" strokeWidth={0} />
                      <span>Practice</span>
                    </button>
                    <button
                      onClick={() => handleViewTheory(card)}
                      className="btn btn-secondary-glass btn-sm"
                      style={{ flex: 1, justifyContent: 'center', height: 32 }}
                    >
                      <BookOpen size={13} />
                      <span>View Theory</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── SRS Master Deck Table Inside a Card ── */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--t1)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={18} color="var(--brand)" />
              <span>Master Deck Registry ({filteredCards.length})</span>
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--t3)', margin: '2px 0 0 0' }}>
              Full cognitive inventory of tracked algorithmic patterns and retention intervals.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div className="search-wrap" style={{ width: 220 }}>
              <Search className="search-icon" size={15} />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search deck..."
                className="search-input"
                style={{ height: 34, fontSize: '0.8rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.04)', padding: 3, borderRadius: 8 }}>
              {[
                { id: 'all', label: 'All Cards' },
                { id: 'due', label: `Due (${dueCards.length})` },
                { id: 'mastered', label: `Mastered (${masteredCards.length})` },
                { id: 'algo', label: 'Algorithms' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ height: 30, padding: '0 10px', fontSize: '0.74rem' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Master Deck List */}
        {deck.length === 0 ? (
          <div style={{ padding: '36px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={24} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--t1)', margin: 0 }}>
              Your Master Deck is Empty
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--t3)', maxWidth: 460, margin: 0, lineHeight: 1.5 }}>
              Your spaced repetition deck is built automatically when you complete coding templates in Practice Mode.
            </p>
            <button
              onClick={() => navigate('/practice')}
              className="btn btn-primary btn-sm"
              style={{ marginTop: 6 }}
            >
              <Zap size={13} />
              <span>Start First Practice Session</span>
            </button>
          </div>
        ) : filteredCards.length === 0 ? (
          <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--t3)', fontSize: '0.84rem' }}>
            No cards found matching your query.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredCards.map((card) => {
              const isDue = !card.isMastered && (!card.dueDate || new Date(card.dueDate) <= now);
              const isMastered = card.isMastered || card.intervalDays === null;

              return (
                <div
                  key={card.id || card.snippetId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--glass-border)',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 220 }}>
                    <span className="badge badge-teal" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                      {card.language || 'Code'}
                    </span>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--t1)', margin: 0 }}>
                        {card.title || card.snippetTitle || card.snippetId}
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--t3)' }}>
                        {card.category || 'General'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
                    <span>Rep: <strong style={{ color: 'var(--t1)' }}>{card.repetition || 0}</strong></span>
                    <span>
                      Interval:{' '}
                      <strong style={{ color: 'var(--brand)' }}>
                        {isMastered ? 'Mastered' : `${card.intervalDays || 1}d`}
                      </strong>
                    </span>
                    <span>EF: <strong style={{ color: 'var(--t1)' }}>{(card.easeFactor || 2.5).toFixed(2)}</strong></span>
                    <span className={`badge ${isMastered ? 'badge-teal' : isDue ? 'badge-rose' : 'badge-teal'}`}>
                      {isMastered ? 'Mastered' : isDue ? 'Due Today' : `${card.intervalDays}d`}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => handleStartPractice(card)}
                      className="btn btn-primary btn-sm"
                      style={{ height: 30 }}
                      title="Practice this blueprint in Practice Mode"
                    >
                      <Play size={11} fill="currentColor" strokeWidth={0} />
                      <span>Practice</span>
                    </button>
                    <button
                      onClick={() => handleViewTheory(card)}
                      className="btn btn-secondary-glass btn-sm"
                      style={{ height: 30 }}
                      title="View algorithm theory, invariants, and architecture"
                    >
                      <BookOpen size={12} />
                      <span>View Theory</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
