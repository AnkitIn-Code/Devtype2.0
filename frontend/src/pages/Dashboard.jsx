// src/pages/Dashboard.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Target, BookOpen, Flame, Play,
  Clock, Star, ArrowRight, Code2, Cpu, TrendingUp,
  Calendar, MoreHorizontal, AlertCircle, RotateCcw,
  Brain, Sparkles, Layers, Eye, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dashboardService';
import { templateService } from '../services/templateService';
import { srsService } from '../services/srsService';
import ActivityHeatmap from '../components/common/ActivityHeatmap';

const DEFAULT_PRACTICE = {
  title: 'Binary Search Algorithm',
  language: 'C++',
  difficulty: 'Intermediate',
  sub: 'Logarithmic O(log N) divide-and-conquer search pattern.',
  rawCode: `int binarySearch(const vector<int>& nums, int target) {
    int left = 0, right = nums.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
};

const LANG_COLORS = {
  'C++': '#2563EB',
  cpp: '#2563EB',
  c: '#0284C7',
  Python: '#4F46E5',
  python: '#4F46E5',
  Java: '#0D9488',
  java: '#0D9488',
  JavaScript: '#EAB308',
  javascript: '#EAB308',
  TypeScript: '#0284C7',
  typescript: '#0284C7',
  Rust: '#EA580C',
  rust: '#EA580C',
  Go: '#0284C7',
  go: '#0284C7',
};

/* ================================================================
   STAT CARD
   ================================================================ */
function StatCard({ icon: Icon, tone, label, value, sub, rightIcon: RightIcon }) {
  return (
    <div className="stat-card">
      <div className="stat-card-content">
        <div className="stat-top">
          <div className={`stat-icon-wrap ${tone}`}>
            <Icon size={19} strokeWidth={2.2} />
          </div>
          <div className="stat-top-right">
            {RightIcon ? <RightIcon size={16} className="stat-action-icon" /> : <MoreHorizontal size={16} className="stat-action-icon" />}
          </div>
        </div>

        <div className="stat-num">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
        {sub && (
          <div className="stat-sub">
            <TrendingUp size={13} strokeWidth={2.2} />
            <span>{sub}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   PRACTICE CARD
   ================================================================ */
function PracticeCard({ p, onStart }) {
  const rawCode = p?.rawCode || p?.content || (typeof p?.code === 'string' ? p.code : '');
  const displayLines = rawCode
    ? rawCode
        .split('\n')
        .map((l) => l.trimEnd())
        .filter((l) => l.trim().length > 0)
        .slice(0, 5)
    : [];

  return (
    <div className="card practice-card">
      <div className="practice-hd">
        <div className="practice-hd-left">
          <div className="practice-title-row">
            <div className="practice-icon-box">
              <Cpu size={18} strokeWidth={2} />
            </div>
            <h4>{p?.title || 'Current Practice'}</h4>
          </div>
          <p>{p?.sub || 'Continue your regular code typing drills.'}</p>
        </div>
        <div className="practice-meta">
          <span className="badge badge-teal">
            <Code2 size={13} />
            {p?.language || 'C++'}
          </span>
          <span className="badge badge-indigo">{p?.difficulty || 'Intermediate'}</span>
        </div>
      </div>

      <div className="practice-body">
        <div className="code-block">
          {displayLines.length > 0 ? (
            displayLines.map((lineText, idx) => (
              <div key={idx} className="code-row">
                <span className="code-ln">{idx + 1}</span>
                <span className="code-tokens" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.86rem', color: 'var(--t1)' }}>
                  {lineText}
                </span>
              </div>
            ))
          ) : (
            <div className="code-row">
              <span className="code-ln">1</span>
              <span className="code-tokens" style={{ color: 'var(--t2)' }}>// Ready to practice snippet</span>
            </div>
          )}
          <div className="code-status-row">
            <div className="status-dot" />
            <span className="status-text">{p?.statusHint || 'Ready to begin'}</span>
            <span className="status-hint">{p?.statusSub || 'Start typing to improve your speed and accuracy.'}</span>
          </div>
        </div>
      </div>

      <div className="practice-actions">
        <div className="practice-status-chip">
          <span className="chip-dot" />
          <span>{p?.chipText || 'Next in Sequence'}</span>
        </div>
        <button className="btn btn-primary btn-sm" id="btn-start-typing" onClick={onStart}>
          <Play size={12} fill="currentColor" strokeWidth={0} />
          <span>{p?.btnText || 'Start Practice'}</span>
        </button>
      </div>
    </div>
  );
}

/* ================================================================
   PROGRESSION & ACCOLADES CARD
   ================================================================ */
function ProgressCard({
  totalXp = 0,
  level = 1,
  nextLevelXp = 200,
  levelProgressPercent = 0,
  srsCardsCount = 0,
  unlockedAchievementsCount = 0,
  totalAchievementsCount = 15,
  totalPracticeTimeSeconds = 0,
  totalCharactersTyped = 0,
}) {
  const formatTime = (secs) => {
    if (!secs || secs <= 0) return '0s';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.round(secs % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const xpRemaining = Math.max(0, nextLevelXp - totalXp);

  return (
    <div className="card progress-card">
      <div className="card-hd">
        <div className="card-hd-left">
          <div className="card-title">
            <Target size={18} color="var(--brand)" />
            <span>Progression &amp; Accolades</span>
          </div>
          <div className="card-sub">Authoritative server level, XP velocity, and retention</div>
        </div>
        <div className="level-pill">
          Level {level}
        </div>
      </div>

      <div className="card-bd">
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 600 }}>
          <span style={{ color: 'var(--t1)' }}>Level Progress</span>
          <span style={{ color: 'var(--t3)' }}>{xpRemaining.toLocaleString()} XP to Level {level + 1}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--t1)' }}>
            {(totalXp || 0).toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--t3)' }}>/ {(nextLevelXp || 0).toLocaleString()} XP</span>
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Star size={13} fill="currentColor" />
            {levelProgressPercent}% Completed
          </span>
        </div>

        <div className="prog-bar">
          <div className="prog-bar-fill" style={{ width: `${Math.min(100, Math.max(0, levelProgressPercent))}%` }} />
        </div>

        <div className="prog-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))' }}>
          <div className="prog-stat">
            <div className="prog-stat-icon"><Clock size={16} strokeWidth={2} /></div>
            <div className="prog-stat-val">{formatTime(totalPracticeTimeSeconds)}</div>
            <div className="prog-stat-lbl">Practice Time</div>
          </div>
          <div className="prog-stat">
            <div className="prog-stat-icon"><Target size={16} strokeWidth={2} /></div>
            <div className="prog-stat-val">{(totalCharactersTyped || 0).toLocaleString()}</div>
            <div className="prog-stat-lbl">Characters</div>
          </div>
          <div className="prog-stat">
            <div className="prog-stat-icon"><Brain size={16} strokeWidth={2} /></div>
            <div className="prog-stat-val">{srsCardsCount}</div>
            <div className="prog-stat-lbl">SRS Blueprints</div>
          </div>
          <div className="prog-stat">
            <div className="prog-stat-icon"><Star size={16} strokeWidth={2} /></div>
            <div className="prog-stat-val">{unlockedAchievementsCount} / {totalAchievementsCount || 15}</div>
            <div className="prog-stat-lbl">Achievements</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   RECENT SESSIONS
   ================================================================ */
function RecentSessions({ sessions = [], onViewAll }) {
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

  return (
    <div className="card sessions-card">
      <div className="card-hd">
        <div className="card-hd-left">
          <div className="card-title">
            <Clock size={18} color="var(--t3)" />
            <span>Recent Sessions</span>
          </div>
          <div className="card-sub">Your latest completed code typing drills</div>
        </div>
        {sessions.length > 0 && (
          <button className="btn btn-ghost btn-sm" id="btn-sessions-all" onClick={onViewAll}>
            <span>View all</span>
            <ArrowRight size={13} strokeWidth={2.2} />
          </button>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><BookOpen size={22} strokeWidth={1.8} /></div>
          <div className="empty-title">No sessions yet</div>
          <div className="empty-desc">
            Your completed sessions will appear here.
            <br />
            Practice your first snippet to start tracking your progress, speed, and accuracy.
          </div>
        </div>
      ) : (
        <>
          <div className="sessions-header">
            <div className="sessions-col-hd">Language</div>
            <div className="sessions-col-hd">Snippet / Blueprint</div>
            <div className="sessions-col-hd">Speed</div>
            <div className="sessions-col-hd">Accuracy</div>
            <div className="sessions-col-hd">Date</div>
          </div>
          {sessions.map((s, i) => {
            const lang = s.language || 'Code';
            const title = s.templateTitle || s.title || s.templateSlug || 'Practice Session';
            const wpmVal = s.netWpm != null ? Math.round(Number(s.netWpm)) : (s.wpm ?? '—');
            const accVal = s.accuracyPercent != null ? Math.round(Number(s.accuracyPercent)) : (s.accuracy ?? '—');
            const dateStr = formatDate(s.completedAt || s.date);

            return (
              <div key={s.id || i} className="session-row">
                <div className="session-lang">
                  <div className="lang-dot" style={{ background: LANG_COLORS[lang] ?? '#2563EB' }} />
                  {lang}
                </div>
                <div className="session-title" title={title}>{title}</div>
                <div className="session-wpm">{wpmVal} WPM</div>
                <div className="session-acc">{accVal}%</div>
                <div className="session-date">{dateStr}</div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

/* ================================================================
   MAIN DASHBOARD COMPONENT
   ================================================================ */
export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [currentPractice, setCurrentPractice] = useState(null);
  const [dueSrsCards, setDueSrsCards] = useState([]);
  const [totalSrsCards, setTotalSrsCards] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setError(null);
    dashboardService
      .getDashboardSummary()
      .then((data) => {
        setDashboardData(data);
      })
      .catch((err) => {
        setError(err.message || 'Unable to connect to DevType server to retrieve dashboard stats.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    let isMounted = true;
    dashboardService
      .getDashboardSummary()
      .then((data) => {
        if (isMounted) {
          setDashboardData(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Unable to connect to DevType server to retrieve dashboard stats.');
          setIsLoading(false);
        }
      });

    // Load SRS recall cards
    srsService
      .getDueCards()
      .then((due) => {
        if (isMounted) setDueSrsCards(due || []);
      })
      .catch(() => {});

    srsService
      .getDeck()
      .then((deck) => {
        if (isMounted) setTotalSrsCards(deck?.length || 0);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // ── Determine Current Practice: Resume where left off, or First Template for new user ──
  useEffect(() => {
    let isMounted = true;
    templateService
      .getTemplates({ size: 100, sort: 'id,asc' })
      .then((res) => {
        if (!isMounted) return;
        const templates = res?.items || res?.content || [];
        if (templates.length === 0) return;

        const recent = dashboardData?.recentSessions || [];
        let chosenTemplate = templates[0];
        let isResume = false;

        if (recent.length > 0) {
          const last = recent[0];
          const lastId = last.templateId;
          const lastSlug = last.templateSlug;
          const lastTitle = last.templateTitle;

          const idx = templates.findIndex(
            (t) =>
              (lastId && (t.numericId === lastId || t.id === lastId || String(t.id) === String(lastId))) ||
              (lastSlug && t.slug === lastSlug) ||
              (lastTitle && t.title === lastTitle)
          );

          if (idx >= 0 && idx + 1 < templates.length) {
            chosenTemplate = templates[idx + 1];
            isResume = true;
          } else if (idx >= 0) {
            chosenTemplate = templates[idx];
            isResume = true;
          }
        }

        setCurrentPractice({
          template: chosenTemplate,
          title: isResume ? `Next: ${chosenTemplate.title}` : `Current Practice: ${chosenTemplate.title}`,
          language: chosenTemplate.language || 'Code',
          difficulty: chosenTemplate.difficulty || 'Intermediate',
          sub: isResume
            ? 'Pick up where you left off. Next template in your sequence.'
            : 'Start with your first practice template to build typing speed.',
          rawCode: chosenTemplate.code || chosenTemplate.content || '',
          chipText: isResume ? 'Next in Sequence' : 'First Lesson',
          btnText: isResume ? 'Resume Practice' : 'Start Typing',
          statusHint: isResume ? 'Ready to continue' : 'Welcome to DevType',
          statusSub: isResume
            ? `Continue your practice streak with ${chosenTemplate.language}`
            : 'Start typing to begin your interactive code sprint.',
        });
      })
      .catch((err) => {
        console.warn('Could not load current practice template:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [dashboardData]);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';
  const displayName = user?.displayName || user?.username || 'Developer';

  const todayStr = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const bestWpm = dashboardData?.bestWpm != null ? Math.round(Number(dashboardData.bestWpm)) : null;
  const avgAccuracy = dashboardData?.averageAccuracy != null ? Math.round(Number(dashboardData.averageAccuracy)) : null;
  const completedSessions = dashboardData?.totalCompletedSessions ?? 0;
  const currentStreak = dashboardData?.currentStreak ?? 0;
  const bestStreak = dashboardData?.bestStreak ?? 0;
  const totalPracticeTimeSeconds = dashboardData?.totalPracticeTimeSeconds ?? 0;
  const totalCharactersTyped = dashboardData?.totalCharactersTyped ?? 0;
  const recentSessions = dashboardData?.recentSessions || [];
  const dailyActivity = dashboardData?.dailyActivity || [];

  // Decaying recall archetypes to display in the queue
  const displayDueCards = useMemo(() => {
    if (dueSrsCards.length >= 3) {
      return dueSrsCards.slice(0, 3);
    }
    const sampleArchetypes = [
      {
        id: 'binary-search-cpp',
        snippetId: 'binary-search-cpp',
        title: 'Binary Search Algorithm',
        language: 'cpp',
        retention: 78,
        desc: 'Logarithmic O(log N) divide-and-conquer search pattern.',
        intervalDays: 1,
        repetition: 0,
      },
      {
        id: 'two-sum-cpp',
        snippetId: 'two-sum-cpp',
        title: 'Two Sum Map Resolution',
        language: 'cpp',
        retention: 84,
        desc: 'One-pass hash table complement lookup in O(N) runtime.',
        intervalDays: 6,
        repetition: 1,
      },
      {
        id: 'react-use-effect',
        snippetId: 'react-use-effect',
        title: 'React useEffect Hook',
        language: 'javascript',
        retention: 71,
        desc: 'Lifecycle synchronization, cleanup handlers, and dependency arrays.',
        intervalDays: 1,
        repetition: 0,
      },
    ];

    if (dueSrsCards.length === 0) return sampleArchetypes;
    return [...dueSrsCards, ...sampleArchetypes].slice(0, 3);
  }, [dueSrsCards]);

  return (
    <div className="dash space-y-6">
      {/* ── Welcome Header ── */}
      <div className="dash-welcome">
        <div className="welcome-left">
          <div className="welcome-sup flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>DevType Executive Telemetry // Kernel Synced</span>
          </div>
          <h1 className="welcome-title">{greeting}, {displayName} 👋</h1>
          <p className="welcome-sub">
            Your algorithmic muscle memory is active.{' '}
            <span className="text-primary font-semibold">
              {dueSrsCards.length > 0 ? `${dueSrsCards.length} Spaced Repetition cards` : 'SRS retention'}
            </span>{' '}
            are scheduled for synap-decay reinforcement today.
          </p>
        </div>

        {/* Ice Glass Date & Streak Widget */}
        <div className="welcome-widget">
          <div className="welcome-widget-top">
            <span>{todayStr}</span>
            <Calendar size={15} className="welcome-cal-icon" />
          </div>
          <div className="welcome-widget-sub">
            <Flame size={14} fill="currentColor" strokeWidth={0} />
            <span>{currentStreak > 0 ? `${currentStreak} day streak` : '0 day streak'}</span>
          </div>
        </div>
      </div>

      {/* ── Error Banner with Retry ── */}
      {error && (
        <div
          className="card"
          style={{
            padding: '16px 20px',
            marginBottom: '20px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertCircle size={20} color="#EF4444" />
            <div>
              <div style={{ fontWeight: 600, color: '#EF4444', fontSize: '0.9rem' }}>
                Failed to load live dashboard statistics
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--t3)' }}>{error}</div>
            </div>
          </div>
          <button
            className="btn btn-secondary-glass btn-sm"
            onClick={handleRetry}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RotateCcw size={13} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="stat-grid">
        <StatCard
          icon={Zap}
          tone="rose"
          label="Best WPM"
          value={isLoading ? '...' : (bestWpm != null ? `${bestWpm}` : '—')}
          sub={bestWpm != null ? 'All-time personal record' : 'No records yet'}
        />
        <StatCard
          icon={Target}
          tone="emerald"
          label="Accuracy"
          value={isLoading ? '...' : (avgAccuracy != null ? `${avgAccuracy}%` : '—')}
          sub={avgAccuracy != null ? 'All-time precision average' : 'Awaiting first session'}
        />
        <StatCard
          icon={BookOpen}
          tone="cobalt"
          label="Practice Sessions"
          value={isLoading ? '...' : completedSessions}
          sub="Completed sessions"
        />
        <StatCard
          icon={Brain}
          tone="amber"
          label="SRS Due Cards"
          value={isLoading ? '...' : (dueSrsCards.length)}
          sub={dueSrsCards.length > 0 ? 'Requires reinforcement' : 'All caught up'}
        />
      </div>

      {/* ── 1. Spaced Repetition (SRS) Action Spotlight Queue ── */}
      <section className="srs-dashboard-section" aria-label="Spaced Repetition Recall Queue">
        <div className="srs-dashboard-header">
          <div className="srs-header-left">
            <div className="srs-header-icon-box">
              <Brain size={22} strokeWidth={2.2} />
            </div>
            <div className="srs-header-titles">
              <div className="srs-header-title-row">
                <h2 className="srs-header-title">
                  Spaced Repetition Recall Queue
                </h2>
                <span className="srs-active-pill">
                  SM-2 Active
                </span>
              </div>
              <p className="srs-header-desc">
                Review decaying syntax archetypes to maintain deterministic typing throughput.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/revision')}
            className="btn btn-primary btn-sm"
            id="btn-srs-start-review"
          >
            <Sparkles size={14} />
            <span>Start Full Review Session ({dueSrsCards.length || 3})</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* 3 Interactive Cards */}
        <div className="srs-recall-grid">
          {displayDueCards.map((card, idx) => {
            const lang = (card.language || 'cpp').toUpperCase();
            const retentionPct = card.retention || (idx === 0 ? 74 : idx === 1 ? 82 : 68);
            const isDueNow = !card.dueDate || new Date(card.dueDate) <= new Date();
            const retentionClass =
              retentionPct >= 80 ? 'retention-good' : retentionPct >= 70 ? 'retention-warn' : 'retention-danger';

            return (
              <div
                key={card.snippetId || card.id || idx}
                className="srs-recall-card"
              >
                <div>
                  <div className="srs-card-top">
                    <span className="srs-lang-tag">
                      {lang}
                    </span>
                    <span className={`srs-retention-badge ${retentionClass}`}>
                      Retention {retentionPct}%
                    </span>
                  </div>

                  <h3 className="srs-card-title">
                    {card.title || card.snippetTitle || card.snippetId}
                  </h3>

                  <p className="srs-card-desc">
                    {card.desc || 'Algorithmic logic review to reinforce syntactical muscle memory.'}
                  </p>
                </div>

                <div className="srs-card-footer">
                  <span className="srs-due-label">
                    {isDueNow ? 'Due Today' : 'Scheduled'}
                  </span>
                  <div className="srs-card-actions">
                    <button
                      onClick={() => navigate(`/practice?snippet=${card.snippetId || card.id}&mode=cloze`)}
                      className="btn-srs-cloze"
                      title="Cloze masked recall drill"
                    >
                      Cloze
                    </button>
                    <button
                      onClick={() => navigate(`/practice?snippet=${card.snippetId || card.id}&mode=copy`)}
                      className="btn-srs-drill"
                      title="Full syntax speed drill"
                    >
                      Drill
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 2. Practice Activity & Current Practice Section ── */}
      <div className="two-col">
        <PracticeCard
          p={currentPractice || DEFAULT_PRACTICE}
          onStart={() => {
            if (currentPractice?.template) {
              navigate(`/practice?snippet=${currentPractice.template.slug || currentPractice.template.id}`, {
                state: { snippet: currentPractice.template },
              });
            } else {
              navigate('/practice?snippet=binary-search-cpp');
            }
          }}
        />

        <ProgressCard
          totalXp={dashboardData?.totalXp ?? (user?.totalXp || 0)}
          level={dashboardData?.level ?? (user?.level || 1)}
          nextLevelXp={dashboardData?.nextLevelXp ?? 200}
          levelProgressPercent={dashboardData?.levelProgressPercent ?? 0}
          srsCardsCount={totalSrsCards || dashboardData?.srsTotalCardsCount || 4}
          unlockedAchievementsCount={dashboardData?.unlockedAchievementsCount ?? 0}
          totalAchievementsCount={dashboardData?.totalAchievementsCount ?? 15}
          totalPracticeTimeSeconds={totalPracticeTimeSeconds}
          totalCharactersTyped={totalCharactersTyped}
        />
      </div>

      {/* ── 3. Activity Heatmap ── */}
      <div className="card" style={{ padding: '24px' }}>
        <ActivityHeatmap activityData={dailyActivity} />
      </div>

      {/* ── 4. Recent Sessions ── */}
      <RecentSessions
        sessions={recentSessions}
        onViewAll={() => navigate('/reports')}
      />
    </div>
  );
}
