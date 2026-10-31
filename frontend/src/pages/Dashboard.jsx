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
import { srsService, computeCardRetention } from '../services/srsService';
import { dataCache } from '../services/dataCache';
import { getSavedSessions } from '../utils/reportStore';
import { mergeSessions, buildUnifiedDailyActivity, calculateConsistentStreak } from '../utils/sessionSync';
import ActivityHeatmap from '../components/common/ActivityHeatmap';
import { PREDEFINED_BLUEPRINTS, getPredefinedSnippet } from '../data/predefinedBlueprints';

function getInitialPractice(userId, preferredLang) {
  const lang = preferredLang || localStorage.getItem('devtype_preferred_lang') || 'C++';
  try {
    const cached = localStorage.getItem(`devtype_current_practice_${userId || 'guest'}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.title && parsed.template) {
        return parsed;
      }
    }
  } catch (_) {}

  try {
    const saved = getSavedSessions(userId);
    const completedKeys = new Set();
    saved.forEach((s) => {
      if (s.templateId) completedKeys.add(String(s.templateId));
      if (s.templateSlug) completedKeys.add(String(s.templateSlug).toLowerCase());
      if (s.snippetId) completedKeys.add(String(s.snippetId).toLowerCase());
      if (s.templateTitle) completedKeys.add(String(s.templateTitle).toLowerCase());
      if (s.snippetTitle) completedKeys.add(String(s.snippetTitle).toLowerCase());
      if (s.title) completedKeys.add(String(s.title).toLowerCase());
    });

    for (const bp of PREDEFINED_BLUEPRINTS) {
      const key = bp.key.toLowerCase();
      const title = bp.title.toLowerCase();
      if (!completedKeys.has(key) && !completedKeys.has(title)) {
        const snippet = getPredefinedSnippet(bp.key, lang);
        if (snippet) {
          const isResume = saved.length > 0;
          return {
            template: snippet,
            title: isResume ? `Next: ${snippet.title}` : `Current Practice: ${snippet.title}`,
            language: lang,
            difficulty: bp.difficulty || 'Intermediate',
            sub: isResume
              ? 'Pick up where you left off. Next template in your sequence.'
              : 'Start with your first practice template to build typing speed.',
            rawCode: snippet.code || '',
            chipText: isResume ? 'Next in Sequence' : 'First Lesson',
            btnText: isResume ? 'Resume Practice' : 'Start Typing',
            statusHint: isResume ? 'Ready to continue' : 'Welcome to DevType',
            statusSub: isResume
              ? `Continue your practice streak with ${lang}`
              : 'Start typing to begin your interactive code sprint.',
          };
        }
      }
    }
  } catch (_) {}

  const fallbackSnippet = getPredefinedSnippet('two-sum', lang) || getPredefinedSnippet('binary-search', lang);
  return {
    template: fallbackSnippet,
    title: fallbackSnippet ? `Current Practice: ${fallbackSnippet.title}` : 'Current Practice',
    language: lang,
    difficulty: fallbackSnippet?.difficulty || 'Intermediate',
    sub: 'Continue your regular code typing drills.',
    rawCode: fallbackSnippet?.code || '',
    chipText: 'Next in Sequence',
    btnText: 'Start Typing',
    statusHint: 'Ready to continue',
    statusSub: `Continue your practice streak with ${lang}`,
  };
}

const DEFAULT_PRACTICE = {
  title: 'Two Sum Problem',
  language: 'C++',
  difficulty: 'Beginner',
  sub: 'Optimal hash map lookup pattern for target sums.',
  rawCode: `vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < (int)nums.size(); ++i) {
        int complement = target - nums[i];
        if (seen.count(complement)) return {seen[complement], i};
        seen[nums[i]] = i;
    }
    return {};
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
   CODE SYNTAX HIGHLIGHTER HELPER FOR CODE BLOCKS
   ================================================================ */
function highlightCodeLine(text) {
  if (!text) return null;
  // Normalize tabs to 4 spaces to preserve indentation accurately
  const normalized = text.replace(/\t/g, '    ');
  const tokens = [];
  const regex = /(\/\/[^\n]*)|("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')|(\b(?:int|void|bool|char|double|float|long|vector|string|size_t|auto|const|return|if|else|while|for|do|break|continue|switch|case|default|class|struct|public|private|protected|virtual|template|typename|using|namespace|function|def|let|var|import|export|from|new|this|nullptr|null|true|false)\b)|(\b\d+\b)|([{}()[\],;.<>:=+\-*/&|!~?])|([a-zA-Z_]\w*)|(\s+)/g;

  let match;
  let keyIdx = 0;

  while ((match = regex.exec(normalized)) !== null) {
    const [full, comment, string, keyword, number, punct, identifier, space] = match;
    if (comment) {
      tokens.push(<span key={keyIdx++} style={{ color: '#94A3B8', fontStyle: 'italic', whiteSpace: 'pre' }}>{comment}</span>);
    } else if (string) {
      tokens.push(<span key={keyIdx++} style={{ color: '#4ADE80', whiteSpace: 'pre' }}>{string}</span>);
    } else if (keyword) {
      tokens.push(<span key={keyIdx++} style={{ color: '#C084FC', fontWeight: 600, whiteSpace: 'pre' }}>{keyword}</span>);
    } else if (number) {
      tokens.push(<span key={keyIdx++} style={{ color: '#FB923C', whiteSpace: 'pre' }}>{number}</span>);
    } else if (punct) {
      tokens.push(<span key={keyIdx++} style={{ color: '#93C5FD', whiteSpace: 'pre' }}>{punct}</span>);
    } else if (identifier) {
      tokens.push(<span key={keyIdx++} style={{ color: '#F8FAFC', whiteSpace: 'pre' }}>{identifier}</span>);
    } else {
      tokens.push(<span key={keyIdx++} style={{ whiteSpace: 'pre' }}>{space}</span>);
    }
  }

  if (tokens.length === 0) {
    return <span style={{ color: '#F8FAFC', whiteSpace: 'pre' }}>{normalized}</span>;
  }
  return tokens;
}

/* ================================================================
   PRACTICE CARD
   ================================================================ */
function PracticeCard({ p, onStart, onSelectLang, currentLang }) {
  const rawCode = p?.rawCode || p?.content || (typeof p?.code === 'string' ? p.code : '');
  const displayLines = rawCode
    ? rawCode
        .split('\n')
        .map((l) => l.trimEnd())
        .filter((l) => l.trim().length > 0)
        .slice(0, 6)
    : [];

  const activeLang = p?.language || currentLang || 'C++';

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
          <div className="practice-lang-picker-wrap" title="Select target programming language">
            <Code2 size={13} />
            <select
              className="practice-lang-select"
              value={activeLang}
              onChange={(e) => onSelectLang && onSelectLang(e.target.value)}
              aria-label="Select target programming language"
            >
              {['C++', 'Python', 'Java', 'JavaScript', 'TypeScript', 'C', 'Rust', 'Go'].map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
          <span className="badge badge-indigo">{p?.difficulty || 'Intermediate'}</span>
        </div>
      </div>

      <div className="practice-body">
        <div className="code-block" style={{ color: '#F8FAFC', whiteSpace: 'pre', overflowX: 'auto' }}>
          {displayLines.length > 0 ? (
            displayLines.map((lineText, idx) => (
              <div key={idx} className="code-row" style={{ display: 'flex', gap: '14px', alignItems: 'baseline', whiteSpace: 'pre' }}>
                <span className="code-ln" style={{ userSelect: 'none', flexShrink: 0 }}>{idx + 1}</span>
                <span className="code-tokens" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.86rem', color: '#F8FAFC', whiteSpace: 'pre', tabSize: 4 }}>
                  {highlightCodeLine(lineText)}
                </span>
              </div>
            ))
          ) : (
            <div className="code-row" style={{ display: 'flex', gap: '14px', whiteSpace: 'pre' }}>
              <span className="code-ln">1</span>
              <span className="code-tokens" style={{ color: '#94A3B8', whiteSpace: 'pre' }}>// Ready to practice snippet</span>
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

  // ── Synchronous Eager Hydration from Cache (Zero Loading Wait) ──
  const cachedDash = useMemo(() => dataCache.getDashboard(user?.id), [user?.id]);
  const [dashboardData, setDashboardData] = useState(() => cachedDash);
  const [preferredLang, setPreferredLang] = useState(() => {
    return localStorage.getItem('devtype_preferred_lang') || 'C++';
  });
  const [currentPractice, setCurrentPractice] = useState(() => getInitialPractice(user?.id, localStorage.getItem('devtype_preferred_lang') || 'C++'));
  const [dueSrsCards, setDueSrsCards] = useState(() => dataCache.getDueCards(user?.id) || []);
  const [totalSrsCards, setTotalSrsCards] = useState(() => dataCache.getDeck(user?.id)?.length || 0);
  const [localSessions, setLocalSessions] = useState(() => getSavedSessions(user?.id));
  const [isLoading, setIsLoading] = useState(() => !cachedDash);
  const [error, setError] = useState(null);

  const fetchLiveDashboard = useCallback(() => {
    dashboardService
      .getDashboardSummary()
      .then((data) => {
        if (data) {
          setDashboardData(data);
          dataCache.setDashboard(user?.id, data);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (!cachedDash) {
          setError(err.message || 'Unable to connect to DevType server to retrieve dashboard stats.');
        }
        setIsLoading(false);
      });
  }, [user?.id, cachedDash]);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchLiveDashboard();
  }, [fetchLiveDashboard]);

  // ── Background Revalidation & Live Event Listeners ──
  useEffect(() => {
    let isMounted = true;
    fetchLiveDashboard();

    // Load SRS recall cards
    const loadSrs = () => {
      srsService
        .getDueCards()
        .then((due) => {
          if (isMounted && due) {
            setDueSrsCards(due);
            dataCache.setDueCards(user?.id, due);
          }
        })
        .catch(() => {});

      srsService
        .getDeck()
        .then((deck) => {
          if (isMounted && deck) {
            setTotalSrsCards(deck.length);
            dataCache.setDeck(user?.id, deck);
          }
        })
        .catch(() => {});
    };

    loadSrs();

    // Synchronize immediately on practice completion or cross-tab storage
    const handleSessionCompleted = () => {
      if (!isMounted) return;
      setLocalSessions(getSavedSessions(user?.id));
      fetchLiveDashboard();
    };

    const handleStorageUpdate = (e) => {
      if (!isMounted) return;
      if (!e.key || e.key.includes('devtype_sessions') || e.key.includes('devtype_auth')) {
        setLocalSessions(getSavedSessions(user?.id));
      }
    };

    const handleCacheRevalidated = () => {
      if (!isMounted) return;
      const freshDash = dataCache.getDashboard(user?.id);
      if (freshDash) setDashboardData(freshDash);
      const freshDue = dataCache.getDueCards(user?.id);
      if (freshDue) setDueSrsCards(freshDue);
      const freshDeck = dataCache.getDeck(user?.id);
      if (freshDeck) setTotalSrsCards(freshDeck.length);
    };

    window.addEventListener('devtype_session_completed', handleSessionCompleted);
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('devtype_cache_revalidated', handleCacheRevalidated);
    window.addEventListener('devtype_srs_updated', loadSrs);

    return () => {
      isMounted = false;
      window.removeEventListener('devtype_session_completed', handleSessionCompleted);
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('devtype_cache_revalidated', handleCacheRevalidated);
      window.removeEventListener('devtype_srs_updated', loadSrs);
    };
  }, [user?.id, fetchLiveDashboard]);

  const handleLanguageChange = (newLang) => {
    setPreferredLang(newLang);
    localStorage.setItem('devtype_preferred_lang', newLang);
    const eager = getInitialPractice(user?.id, newLang);
    if (eager) setCurrentPractice(eager);
  };

  // ── Determine Current Practice: Resume where left off, or First Template for new user ──
  useEffect(() => {
    let isMounted = true;
    templateService
      .getTemplates({ size: 100, sort: 'id,asc' })
      .then(async (res) => {
        if (!isMounted) return;
        const templates = res?.items || res?.content || [];
        if (templates.length === 0) return;

        const recent = dashboardData?.recentSessions || [];
        const completedKeys = new Set();
        recent.forEach((s) => {
          if (s.templateId) completedKeys.add(String(s.templateId));
          if (s.templateSlug) completedKeys.add(s.templateSlug.toLowerCase());
          if (s.templateTitle) completedKeys.add(s.templateTitle.toLowerCase());
        });

        // Filter templates by preferred language if available
        const normLang = preferredLang?.toLowerCase() || '';
        const langTemplates = templates.filter(
          (t) => !normLang || (t.language && t.language.toLowerCase() === normLang)
        );
        const pool = langTemplates.length > 0 ? langTemplates : templates;

        // Find the first template in the pool that has NOT been completed recently
        const uncompleted = pool.filter((t) => {
          const idMatch = t.id && completedKeys.has(String(t.id));
          const numMatch = t.numericId && completedKeys.has(String(t.numericId));
          const slugMatch = t.slug && completedKeys.has(t.slug.toLowerCase());
          const titleMatch = t.title && completedKeys.has(t.title.toLowerCase());
          return !idMatch && !numMatch && !slugMatch && !titleMatch;
        });

        let chosenTemplate = null;
        let isResume = false;

        if (uncompleted.length > 0) {
          chosenTemplate = uncompleted[0];
          isResume = recent.length > 0;
        } else if (recent.length > 0) {
          // If all templates in pool were completed, pick next in circular sequence
          const last = recent[0];
          const lastId = last.templateId;
          const lastSlug = last.templateSlug?.toLowerCase();
          const lastTitle = last.templateTitle?.toLowerCase();

          const idx = pool.findIndex(
            (t) =>
              (lastId && (t.numericId === lastId || t.id === lastId || String(t.id) === String(lastId))) ||
              (lastSlug && t.slug?.toLowerCase() === lastSlug) ||
              (lastTitle && t.title?.toLowerCase() === lastTitle)
          );

          if (idx >= 0 && idx + 1 < pool.length) {
            chosenTemplate = pool[idx + 1];
          } else {
            chosenTemplate = pool[0];
          }
          isResume = true;
        } else {
          chosenTemplate = pool[0];
          isResume = false;
        }

        // Ensure template code is loaded
        if (chosenTemplate && !chosenTemplate.code && !chosenTemplate.content) {
          try {
            const fullTpl = await templateService.getTemplateById(chosenTemplate.slug || chosenTemplate.id);
            if (fullTpl && (fullTpl.code || fullTpl.content) && isMounted) {
              chosenTemplate = { ...chosenTemplate, ...fullTpl };
            }
          } catch (_) {}
        }

        if (!isMounted) return;

        const practiceObj = {
          template: chosenTemplate,
          title: isResume ? `Next: ${chosenTemplate.title}` : `Current Practice: ${chosenTemplate.title}`,
          language: chosenTemplate.language || preferredLang,
          difficulty: chosenTemplate.difficulty || 'Intermediate',
          sub: isResume
            ? 'Pick up where you left off. Next template in your sequence.'
            : 'Start with your first practice template to build typing speed.',
          rawCode: chosenTemplate.code || chosenTemplate.content || '',
          chipText: isResume ? 'Next in Sequence' : 'First Lesson',
          btnText: isResume ? 'Resume Practice' : 'Start Typing',
          statusHint: isResume ? 'Ready to continue' : 'Welcome to DevType',
          statusSub: isResume
            ? `Continue your practice streak with ${chosenTemplate.language || preferredLang}`
            : 'Start typing to begin your interactive code sprint.',
        };
        setCurrentPractice(practiceObj);
        try {
          localStorage.setItem(`devtype_current_practice_${user?.id || 'guest'}`, JSON.stringify(practiceObj));
        } catch (_) {}
      })
      .catch((err) => {
        console.warn('Could not load current practice template:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [dashboardData, preferredLang]);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';
  const displayName = user?.displayName || user?.username || 'Developer';

  const todayStr = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // ── Unified Session Merging: Consistent across Dashboard, Profile, and Reports ──
  const allUserSessions = useMemo(() => {
    const serverRecent = dashboardData?.recentSessions || [];
    return mergeSessions(serverRecent, localSessions);
  }, [dashboardData?.recentSessions, localSessions]);

  const recentSessions = useMemo(() => {
    return allUserSessions.slice(0, 5);
  }, [allUserSessions]);

  const dailyActivity = useMemo(() => {
    return buildUnifiedDailyActivity(dashboardData?.dailyActivity || [], allUserSessions);
  }, [dashboardData?.dailyActivity, allUserSessions]);

  const currentStreak = useMemo(() => {
    return calculateConsistentStreak(dashboardData?.currentStreak, dashboardData?.dailyActivity, allUserSessions);
  }, [dashboardData?.currentStreak, dashboardData?.dailyActivity, allUserSessions]);

  const completedSessions = useMemo(() => {
    return Math.max(Number(dashboardData?.totalCompletedSessions) || 0, allUserSessions.length);
  }, [dashboardData?.totalCompletedSessions, allUserSessions.length]);

  const bestWpm = useMemo(() => {
    const serverBest = Number(dashboardData?.bestWpm) || 0;
    const sessionBests = allUserSessions.map((s) => Number(s.wpm || s.netWpm) || 0);
    const maxVal = Math.max(serverBest, ...sessionBests);
    return maxVal > 0 ? Math.round(maxVal) : (dashboardData?.bestWpm != null ? Math.round(Number(dashboardData.bestWpm)) : null);
  }, [dashboardData?.bestWpm, allUserSessions]);

  const avgAccuracy = useMemo(() => {
    if (dashboardData?.averageAccuracy != null) {
      return Math.round(Number(dashboardData.averageAccuracy));
    }
    if (allUserSessions.length > 0) {
      const sum = allUserSessions.reduce((acc, s) => acc + (s.accuracy || 100), 0);
      return Math.round(sum / allUserSessions.length);
    }
    return null;
  }, [dashboardData?.averageAccuracy, allUserSessions]);

  const totalPracticeTimeSeconds = useMemo(() => {
    const serverTime = Number(dashboardData?.totalPracticeTimeSeconds) || 0;
    const localTime = allUserSessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
    return Math.max(serverTime, localTime);
  }, [dashboardData?.totalPracticeTimeSeconds, allUserSessions]);

  const totalCharactersTyped = useMemo(() => {
    const serverChars = Number(dashboardData?.totalCharactersTyped) || 0;
    const localChars = allUserSessions.reduce((sum, s) => sum + (s.totalCharacters || 0), 0);
    return Math.max(serverChars, localChars);
  }, [dashboardData?.totalCharactersTyped, allUserSessions]);

  // Real decaying recall archetypes to display in the queue (accurately synced with Revision)
  const displayDueCards = useMemo(() => {
    return (dueSrsCards || []).slice(0, 3);
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
            <span>
              {dueSrsCards.length > 0
                ? `Start Full Review Session (${dueSrsCards.length})`
                : `Browse Revision Deck (${totalSrsCards})`}
            </span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Real Recall Queue Cards or Synchronized Empty State */}
        <div className="srs-recall-grid">
          {displayDueCards.length === 0 ? (
            <div className="srs-empty-recall-state">
              <div className="srs-empty-icon-box">
                <CheckCircle2 size={24} className="text-emerald" />
              </div>
              <div className="srs-empty-content">
                <h3 className="srs-empty-title">All Recall Archetypes Synchronized</h3>
                <p className="srs-empty-desc">
                  No syntax cards are currently due for SM-2 review. All scheduled patterns are up to date!
                </p>
              </div>
              <button
                onClick={() => navigate('/revision')}
                className="btn btn-secondary btn-sm"
                id="btn-srs-browse-deck"
              >
                <BookOpen size={14} />
                <span>Browse Full Deck ({totalSrsCards})</span>
              </button>
            </div>
          ) : (
            displayDueCards.map((card, idx) => {
              const lang = (card.language || 'Code').toUpperCase();
              const retentionPct = computeCardRetention(card);
              const isDueNow = !card.dueDate || new Date(card.dueDate) <= new Date();
              const retentionClass =
                retentionPct >= 80 ? 'retention-good' : retentionPct >= 70 ? 'retention-warn' : 'retention-danger';
              const snippetKey = card.snippetId || card.id;

              return (
                <div
                  key={snippetKey || idx}
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
                      {card.title || card.snippetTitle || snippetKey}
                    </h3>

                    <p className="srs-card-desc">
                      {card.category || card.desc || 'Algorithmic logic review to reinforce syntactical muscle memory.'}
                    </p>
                  </div>

                  <div className="srs-card-footer">
                    <span className="srs-due-label">
                      {isDueNow ? 'Due Today' : 'Scheduled'}
                    </span>
                    <div className="srs-card-actions">
                      <button
                        onClick={() => navigate(`/practice?snippet=${snippetKey}&lang=${encodeURIComponent(card.language || '')}&mode=cloze`)}
                        className="btn-srs-cloze"
                        title="Cloze masked recall drill"
                      >
                        Cloze
                      </button>
                      <button
                        onClick={() => navigate(`/practice?snippet=${snippetKey}&lang=${encodeURIComponent(card.language || '')}&mode=standard`)}
                        className="btn-srs-drill"
                        title="Full syntax speed drill"
                      >
                        Drill
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ── 2. Practice Activity & Current Practice Section ── */}
      <div className="two-col">
        <PracticeCard
          p={currentPractice || DEFAULT_PRACTICE}
          onSelectLang={handleLanguageChange}
          currentLang={preferredLang}
          onStart={() => {
            const templateToUse = currentPractice?.template;
            const langToUse = currentPractice?.language || preferredLang;
            if (templateToUse) {
              const targetSlug = templateToUse.slug || templateToUse.id;
              navigate(`/practice?snippet=${targetSlug}&lang=${encodeURIComponent(langToUse)}&lockLang=true`, {
                state: { snippet: templateToUse },
              });
            } else {
              navigate(`/practice?snippet=binary-search&lang=${encodeURIComponent(langToUse)}&lockLang=true`);
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
