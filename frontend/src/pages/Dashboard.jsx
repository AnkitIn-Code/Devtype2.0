// src/pages/Dashboard.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Target, BookOpen, Flame, Play,
  ChevronLeft, ChevronRight, Clock, Star,
  BarChart2, ArrowRight, Code2, Cpu, TrendingUp,
  Calendar, MoreHorizontal
} from 'lucide-react';
import ActivityHeatmap from '../components/common/ActivityHeatmap';

/* ================================================================
   SAMPLE DATA
   ================================================================ */
const STATS = {
  wpm:      null,
  accuracy: null,
  sessions: 0,
  streak:   0,
};

const PRACTICE = {
  title:      'Current Practice',
  language:   'C++',
  difficulty: 'Intermediate',
  sub:        'Pick up where you left off or start a new session.',
  code: [
    { ln: 1, parts: [
      { k: 't-kw', v: 'for' },
      { k: 't-pu', v: ' (' },
      { k: 't-ty', v: 'int' },
      { k: 't-va', v: ' i' },
      { k: 't-op', v: ' = ' },
      { k: 't-nu', v: '0' },
      { k: 't-pu', v: '; i' },
      { k: 't-op', v: ' < ' },
      { k: 't-va', v: 'n' },
      { k: 't-pu', v: '; i' },
      { k: 't-op', v: '++' },
      { k: 't-pu', v: ') {' },
    ]},
    { ln: 2, parts: [
      { k: '',     v: '    ' },
      { k: 't-va', v: 'cout' },
      { k: 't-op', v: ' << ' },
      { k: 't-st', v: '"Keep practicing!"' },
      { k: 't-pu', v: ';' },
    ]},
    { ln: 3, parts: [{ k: 't-pu', v: '}' }]},
  ],
};

const CHALLENGE = {
  name:       'Least Recently Used (LRU) Cache',
  language:   'C++',
  difficulty: 'Intermediate',
  xp:         50,
  desc:       'Implement O(1) get and put operations using a hash map and doubly linked list.',
};

const SESSIONS = []; // empty = show empty state

/* ================================================================
   HEATMAP DATA GENERATOR
   ================================================================ */
function makeHeatmapData(year) {
  const today = new Date(2026, 9, 28);
  const data  = {};

  const hot = [
    [10, 16], [18, 26], [38, 45],
    [65, 74], [82, 91], [130, 140],
    [184, 212], [215, 228], [244, 266], [274, 289],
  ];

  let cur = new Date(year, 0, 1);
  let idx = 0;
  while (cur.getFullYear() === year && cur <= today) {
    const key  = cur.toISOString().slice(0, 10);
    let   lvl  = 0;
    for (const [s, e] of hot) {
      if (idx >= s && idx <= e) {
        const r = Math.random();
        lvl = r < 0.12 ? 0 : r < 0.28 ? 1 : r < 0.50 ? 2 : r < 0.72 ? 3 : r < 0.88 ? 4 : 5;
        break;
      }
    }
    data[key] = lvl;
    cur = new Date(cur.getTime() + 86400000);
    idx++;
  }
  return data;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS = ['Mon','','Wed','','Fri','',''];
const LANG_COLORS = { 'C++': '#2563EB', Python: '#4F46E5', Java: '#0D9488', JS: '#EAB308', Rust: '#EA580C', Go: '#0284C7' };

function buildWeeks(year, data) {
  const start = new Date(year, 0, 1);
  const dayOfWeek = (start.getDay() + 6) % 7;
  const cur = new Date(start.getTime() - dayOfWeek * 86400000);
  const weeks = [];
  let w = [];

  while (true) {
    const key = cur.toISOString().slice(0, 10);
    const inYear = cur.getFullYear() === year;
    w.push({ date: key, inYear, level: inYear ? (data[key] ?? 0) : -1 });

    if (w.length === 7) {
      weeks.push(w);
      w = [];
      if (cur.getFullYear() > year) break;
    }
    cur.setDate(cur.getDate() + 1);
    if (cur.getFullYear() > year && w.length === 0) break;
  }
  return weeks;
}

/* ================================================================
   LIQUID GLASS STAT CARD (Modern Apple Silicon Cupertino Style)
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

function CodeLine({ ln, parts }) {
  return (
    <div className="code-row">
      <span className="code-ln">{ln}</span>
      <span className="code-tokens">
        {parts.map((p, i) => (
          <span key={i} className={p.k}>{p.v}</span>
        ))}
      </span>
    </div>
  );
}

/* ================================================================
   PRACTICE CARD
   ================================================================ */
function PracticeCard({ p, onStart }) {
  return (
    <div className="card practice-card">
      <div className="practice-hd">
        <div className="practice-hd-left">
          <div className="practice-title-row">
            <div className="practice-icon-box">
              <Cpu size={18} strokeWidth={2} />
            </div>
            <h4>{p.title}</h4>
          </div>
          <p>{p.sub}</p>
        </div>
        <div className="practice-meta">
          <span className="badge badge-teal">
            <Code2 size={13} />
            {p.language}
          </span>
          <span className="badge badge-indigo">{p.difficulty}</span>
        </div>
      </div>

      <div className="practice-body">
        <div className="code-block">
          {p.code.map(line => <CodeLine key={line.ln} {...line} />)}
          <div className="code-status-row">
            <div className="status-dot" />
            <span className="status-text">Ready to begin</span>
            <span className="status-hint">Start typing to improve your speed and accuracy.</span>
          </div>
        </div>
      </div>

      <div className="practice-actions">
        <div className="practice-status-chip">
          <span className="chip-dot" />
          <span>Ready to practice</span>
        </div>
        <button className="btn btn-primary btn-sm" id="btn-start-typing" onClick={onStart}>
          <Play size={12} fill="currentColor" strokeWidth={0} />
          <span>Start Typing</span>
        </button>
      </div>
    </div>
  );
}

/* ================================================================
   CHALLENGE CARD
   ================================================================ */
function ChallengeCard({ c, onStart, onAll }) {
  return (
    <div className="card challenge-card">
      <div className="challenge-inner">
        {/* Top row */}
        <div className="challenge-top">
          <div className="challenge-title-icon">
            <div className="challenge-icon-box">
              <Zap size={16} color="#fff" fill="#fff" strokeWidth={0} />
            </div>
            <span className="challenge-heading">
              Today's Challenge
            </span>
          </div>
          <div className="xp-pill">
            <Star size={12} fill="currentColor" />
            +{c.xp} XP
          </div>
        </div>

        {/* Content row */}
        <div className="challenge-middle">
          <div className="challenge-details">
            <div className="challenge-name">{c.name}</div>
            <div className="challenge-badges">
              <span className="badge badge-teal"><Code2 size={13} />{c.language}</span>
              <span className="badge badge-indigo">{c.difficulty}</span>
            </div>
            <p className="challenge-desc">{c.desc}</p>
          </div>

          {/* Modern Apple Silicon Royal Blue / Ice Code Symbol */}
          <div className="challenge-code-preview" aria-hidden="true">
            <svg width="26" height="20" viewBox="0 0 22 16" fill="none">
              <path d="M6 1.5L1.5 8L6 14.5" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 1.5L20.5 8L16 14.5" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.5 0.5L8.5 15.5" stroke="#60A5FA" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      </div>

      <div className="challenge-actions">
        <button className="btn btn-primary btn-sm" id="btn-start-challenge" onClick={onStart}>
          <Play size={12} fill="currentColor" strokeWidth={0} />
          <span>Start Challenge</span>
        </button>
        <button className="btn btn-ghost btn-sm" id="btn-view-challenges" onClick={onAll}>
          <span>View all challenges</span>
          <ArrowRight size={13} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

/* ================================================================
   ACTIVITY HEATMAP
   ================================================================ */
function Heatmap() {
  const CUR_YEAR = 2026;
  const [year, setYear] = useState(CUR_YEAR);
  const data  = makeHeatmapData(year);
  const weeks = buildWeeks(year, data);
  const nw    = weeks.length;
  const colW  = 14;

  return (
    <div className="card heatmap-card">
      <div className="card-hd">
        <div className="card-hd-left">
          <div className="card-title">
            <BarChart2 size={18} color="var(--brand)" />
            <span>Practice Activity</span>
          </div>
          <div className="card-sub">Your practice activity in {year}</div>
        </div>
        <div className="hm-nav">
          <button
            className="hm-nav-btn"
            id="btn-heatmap-prev"
            onClick={() => setYear(y => y - 1)}
            disabled={year <= 2023}
          >
            <ChevronLeft size={15} strokeWidth={2.2} />
          </button>
          <span className="hm-year">{year}</span>
          <button
            className="hm-nav-btn"
            id="btn-heatmap-next"
            onClick={() => setYear(y => Math.min(y + 1, CUR_YEAR))}
            disabled={year >= CUR_YEAR}
          >
            <ChevronRight size={15} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <div className="card-bd">
        <div className="heatmap-scroll">
          <div className="heatmap-inner">
            {/* Month labels */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `28px repeat(${nw}, ${colW}px)`,
              gap: '0 0',
              marginBottom: 5,
            }}>
              <div />
              {weeks.map((_, wi) => {
                const date = new Date(year, 0, 1 + wi * 7);
                const isFirstWeek = date.getDate() <= 7;
                return (
                  <div key={wi} className="hm-month-lbl">
                    {isFirstWeek ? MONTHS[date.getMonth()] : ''}
                  </div>
                );
              })}
            </div>

            {/* Grid */}
            <div className="hm-body">
              <div className="hm-days-col">
                {DAY_LABELS.map((l, i) => (
                  <div key={i} className="hm-day-lbl">{l}</div>
                ))}
              </div>
              <div className="hm-weeks">
                {weeks.map((w, wi) => (
                  <div key={wi} className="hm-week">
                    {w.map((d, di) => (
                      <div
                        key={di}
                        className="hm-cell"
                        data-l={d.inYear ? d.level : 0}
                        title={d.inYear ? `${d.date}: Level ${d.level}` : ''}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="hm-legend">
              <span className="hm-legend-lbl">Less</span>
              <div className="hm-legend-cells">
                {[0, 1, 2, 3, 4, 5].map(l => (
                  <div key={l} className="hm-cell" data-l={l} />
                ))}
              </div>
              <span className="hm-legend-lbl">More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   PROGRESS CARD
   ================================================================ */
function ProgressCard() {
  return (
    <div className="card progress-card">
      <div className="card-hd">
        <div className="card-hd-left">
          <div className="card-title">
            <Target size={18} color="var(--brand)" />
            <span>Usage &amp; Progress</span>
          </div>
          <div className="card-sub">Your overall progress and experience</div>
        </div>
        <div className="level-pill">
          Level 1
        </div>
      </div>

      <div className="card-bd">
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 600 }}>
          <span style={{ color: 'var(--t1)' }}>Current XP</span>
          <span style={{ color: 'var(--t3)' }}>Your next level</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--t1)' }}>0 / 100 XP</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Star size={13} fill="currentColor" />
            100 XP
          </span>
        </div>

        <div className="prog-bar">
          <div className="prog-bar-fill" style={{ width: '0%' }} />
        </div>

        <div className="prog-stats">
          <div className="prog-stat">
            <div className="prog-stat-icon"><Clock size={16} strokeWidth={2} /></div>
            <div className="prog-stat-val">0s</div>
            <div className="prog-stat-lbl">Total Practice Time</div>
          </div>
          <div className="prog-stat">
            <div className="prog-stat-icon"><Star size={16} strokeWidth={2} /></div>
            <div className="prog-stat-val">0</div>
            <div className="prog-stat-lbl">XP Earned</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   RECENT SESSIONS
   ================================================================ */
function RecentSessions({ sessions }) {
  return (
    <div className="card sessions-card">
      <div className="card-hd">
        <div className="card-hd-left">
          <div className="card-title">
            <Clock size={18} color="var(--t3)" />
            <span>Recent Sessions</span>
          </div>
          <div className="card-sub">Your latest practice sessions</div>
        </div>
        {sessions.length > 0 && (
          <button className="btn btn-ghost btn-sm" id="btn-sessions-all">
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
            <div className="sessions-col-hd">Challenge</div>
            <div className="sessions-col-hd">WPM</div>
            <div className="sessions-col-hd">Accuracy</div>
            <div className="sessions-col-hd">Date</div>
          </div>
          {sessions.map((s, i) => (
            <div key={i} className="session-row">
              <div className="session-lang">
                <div className="lang-dot" style={{ background: LANG_COLORS[s.language] ?? '#9ca3af' }} />
                {s.language}
              </div>
              <div className="session-title">{s.title}</div>
              <div className="session-wpm">{s.wpm}</div>
              <div className="session-acc">{s.accuracy}%</div>
              <div className="session-date">{s.date}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/* ================================================================
   DASHBOARD PAGE
   ================================================================ */
const CURRENT_HOUR = new Date().getHours();
const GREETING = CURRENT_HOUR < 12 ? 'Good morning' : CURRENT_HOUR < 17 ? 'Good afternoon' : 'Good evening';
const DATE_STR = 'Mon, Oct 28, 2026';

export default function Dashboard() {
  const navigate = useNavigate();
  const go = (p) => navigate(p);

  return (
    <div className="dash">
      {/* ── Welcome Header ── */}
      <div className="dash-welcome">
        <div className="welcome-left">
          <div className="welcome-sup">Welcome back.</div>
          <h1 className="welcome-title">{GREETING}, Developer 👋</h1>
          <p className="welcome-sub">Stay consistent. Small progress leads to big results.</p>
        </div>

        {/* Modern Ice Glass Date & Streak Widget */}
        <div className="welcome-widget">
          <div className="welcome-widget-top">
            <span>{DATE_STR}</span>
            <Calendar size={15} className="welcome-cal-icon" />
          </div>
          <div className="welcome-widget-sub">
            <Flame size={14} fill="currentColor" strokeWidth={0} />
            <span>{STATS.streak > 0 ? `${STATS.streak} day streak` : '0 day streak'}</span>
          </div>
        </div>
      </div>

      {/* ── Stat cards with Unified Modern Tones ── */}
      <div className="stat-grid">
        <StatCard
          icon={Zap}
          tone="rose"
          label="Best WPM"
          value={STATS.wpm}
          sub="All-time record"
        />
        <StatCard
          icon={Target}
          tone="emerald"
          label="Accuracy"
          value={STATS.accuracy != null ? `${STATS.accuracy}%` : null}
          sub="All-time average"
        />
        <StatCard
          icon={BookOpen}
          tone="cobalt"
          label="Practice Sessions"
          value={STATS.sessions}
          sub="Completed sessions"
        />
        <StatCard
          icon={Flame}
          tone="amber"
          label="Current Streak"
          value={STATS.streak > 0 ? `${STATS.streak} days` : '0 days'}
          sub="Best: 0 days"
        />
      </div>

      {/* ── Practice + Challenge ── */}
      <div className="two-col">
        <PracticeCard p={PRACTICE} onStart={() => go('/practice?lang=C%2B%2B')} />
        <ChallengeCard c={CHALLENGE} onStart={() => go('/practice?snippet=cpp-lru-cache')} onAll={() => go('/practice')} />
      </div>

      {/* ── Activity + Progress ── */}
      <div className="two-col-wide">
        <ActivityHeatmap />
        <ProgressCard />
      </div>

      {/* ── Recent Sessions ── */}
      <RecentSessions sessions={SESSIONS} />
    </div>
  );
}
