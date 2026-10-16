// src/pages/Reports.jsx
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Calendar, RotateCcw, Download,
  Zap, Target, Clock, TrendingUp,
  Search, Play, Sparkles, Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

import {
  getSessions,
  getSavedSessions,
  filterSessionsByRange,
  computeReportMetrics,
  computeLanguageProficiency,
  computeDayDistribution,
  computeProgressionTimeline,
  exportSessionsToCsv,
} from '../utils/reportStore';

/* ================================================================
   DATE FILTER OPTIONS
   ================================================================ */
const DATE_RANGES = [
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '90 Days' },
  { id: 'all', label: 'All Time' },
];

/* ================================================================
   LANGUAGE ACCENT PALETTE
   ================================================================ */
const LANG_COLORS = {
  'C++': '#2563EB',
  Python: '#4F46E5',
  JavaScript: '#D97706',
  TypeScript: '#0284C7',
  Go: '#0D9488',
  Java: '#EA580C',
  Rust: '#DC2626',
  SQL: '#7C3AED',
};

/* ================================================================
   CUSTOM GLASS CHART TOOLTIP
   ================================================================ */
function CustomLineChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="reports-chart-tooltip">
      <div className="tooltip-header">
        <span className="tooltip-title">{data.title || 'Practice Session'}</span>
        <span className="tooltip-date">{data.fullDate || label}</span>
      </div>
      <div className="tooltip-body">
        <div className="tooltip-row">
          <span className="tooltip-metric-label">
            <span className="tooltip-dot blue" /> Net Speed:
          </span>
          <span className="tooltip-metric-value">{data.wpm} WPM</span>
        </div>
        {data.grossWpm && data.grossWpm !== data.wpm && (
          <div className="tooltip-row">
            <span className="tooltip-metric-label">Gross Speed:</span>
            <span className="tooltip-metric-value muted">{data.grossWpm} WPM</span>
          </div>
        )}
        <div className="tooltip-row">
          <span className="tooltip-metric-label">
            <span className="tooltip-dot green" /> Accuracy:
          </span>
          <span className="tooltip-metric-value">{data.accuracy}%</span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-metric-label">Language:</span>
          <span className="tooltip-badge">{data.language}</span>
        </div>
      </div>
    </div>
  );
}

function CustomBarTooltip({ active, payload, label, unit = 'WPM' }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="reports-chart-tooltip">
      <div className="tooltip-header">
        <span className="tooltip-title">{label || data.language || data.day}</span>
      </div>
      <div className="tooltip-body">
        {payload.map((entry, idx) => (
          <div key={idx} className="tooltip-row">
            <span className="tooltip-metric-label">{entry.name}:</span>
            <span className="tooltip-metric-value">
              {entry.value} {unit}
            </span>
          </div>
        ))}
        {data.sessions !== undefined && (
          <div className="tooltip-row">
            <span className="tooltip-metric-label">Sessions:</span>
            <span className="tooltip-metric-value">{data.sessions} drills</span>
          </div>
        )}
        {data.minutes !== undefined && (
          <div className="tooltip-row">
            <span className="tooltip-metric-label">Practice Time:</span>
            <span className="tooltip-metric-value">{data.minutes}m</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   SUMMARY STAT CARD COMPONENT
   ================================================================ */
function AnalyticsStatCard({ icon: Icon, tone, label, value, sub, tag }) {
  return (
    <div className="stat-card reports-stat-card">
      <div className="stat-card-content">
        <div className="stat-top">
          <div className={`stat-icon-wrap ${tone}`}>
            <Icon size={18} strokeWidth={2.2} />
          </div>
          {tag && <span className="stat-pill-tag">{tag}</span>}
        </div>
        <div className="stat-num">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && (
          <div className="stat-sub">
            <TrendingUp size={12} strokeWidth={2.2} />
            <span>{sub}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   EMPTY STATE COMPONENT
   ================================================================ */
function ReportsEmptyState({ onStartPractice, onResetDemo }) {
  return (
    <div className="reports-empty-card">
      <div className="reports-empty-icon-wrap">
        <Activity size={32} strokeWidth={1.8} />
      </div>
      <h3 className="reports-empty-title">No Practice Sessions Recorded</h3>
      <p className="reports-empty-desc">
        Complete typing drills in the Practice workspace to generate your personalized speed velocity curves,
        character accuracy diagnostics, and language mastery benchmarks.
      </p>
      <div className="reports-empty-actions">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onStartPractice}
          id="btn-empty-start-practice"
        >
          <Play size={13} fill="currentColor" strokeWidth={0} />
          <span>Start First Session</span>
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onResetDemo}
          id="btn-empty-load-demo"
        >
          <Sparkles size={13} />
          <span>Load Benchmark Dataset</span>
        </button>
      </div>
    </div>
  );
}

/* ================================================================
   MAIN REPORTS PAGE COMPONENT
   ================================================================ */
export default function Reports() {
  const navigate = useNavigate();

  // ── Dataset Selection State ──
  // Check if real sessions exist in localStorage
  const savedSessions = useMemo(() => getSavedSessions(), []);
  const hasRealSessions = savedSessions.length > 0;

  // If user has real sessions, default to real; otherwise default to demo
  const [useDemoData, setUseDemoData] = useState(() => !hasRealSessions);
  const [selectedRange, setSelectedRange] = useState('30d');
  const [chartSeriesMode, setChartSeriesMode] = useState('both'); // 'both' | 'wpm' | 'acc'
  const [tableSearch, setTableSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Base Raw Sessions ──
  const rawSessions = useMemo(() => {
    return getSessions({ forceDemo: useDemoData });
  }, [useDemoData]);

  // ── Filtered Sessions by Active Date Range ──
  const filteredSessions = useMemo(() => {
    return filterSessionsByRange(rawSessions, selectedRange);
  }, [rawSessions, selectedRange]);

  // ── Derived Metrics ──
  const metrics = useMemo(() => {
    return computeReportMetrics(filteredSessions);
  }, [filteredSessions]);

  // ── Chart Datasets ──
  const progressionData = useMemo(() => {
    return computeProgressionTimeline(filteredSessions);
  }, [filteredSessions]);

  const languageProficiency = useMemo(() => {
    return computeLanguageProficiency(filteredSessions);
  }, [filteredSessions]);

  const dayDistribution = useMemo(() => {
    return computeDayDistribution(filteredSessions);
  }, [filteredSessions]);

  // ── Table Filtered Sessions ──
  const displayTableSessions = useMemo(() => {
    if (!tableSearch.trim()) return filteredSessions;
    const q = tableSearch.toLowerCase().trim();
    return filteredSessions.filter((s) => {
      const title = (s.snippetTitle || s.title || '').toLowerCase();
      const lang = (s.language || '').toLowerCase();
      const diff = (s.difficulty || '').toLowerCase();
      return title.includes(q) || lang.includes(q) || diff.includes(q);
    });
  }, [filteredSessions, tableSearch]);

  // ── Actions ──
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 350);
  }, []);

  const handleExportCsv = useCallback(() => {
    const filename = `codetype-analytics-${selectedRange}-${Date.now()}.csv`;
    exportSessionsToCsv(filteredSessions, filename);
  }, [filteredSessions, selectedRange]);

  const handleStartPractice = useCallback(
    (snippet) => {
      if (snippet && snippet.snippetId) {
        navigate(`/practice?snippet=${snippet.snippetId}&lang=${encodeURIComponent(snippet.language || 'C++')}`);
      } else {
        navigate('/templates');
      }
    },
    [navigate]
  );

  // WPM Bounds for Chart Y-Axis
  const [wpmMin, wpmMax] = useMemo(() => {
    if (!progressionData.length) return [40, 80];
    const wpms = progressionData.map((d) => d.wpm);
    const min = Math.max(0, Math.floor(Math.min(...wpms) / 10) * 10 - 10);
    const max = Math.ceil(Math.max(...wpms) / 10) * 10 + 10;
    return [min, max];
  }, [progressionData]);

  // Most Active Day in Distribution
  const mostActiveDay = useMemo(() => {
    if (!dayDistribution.length) return null;
    return [...dayDistribution].sort((a, b) => b.sessions - a.sessions)[0];
  }, [dayDistribution]);

  const isEmpty = filteredSessions.length === 0;

  return (
    <div className="reports-page-root">
      {/* ── Page Header (Cupertino Humanized Form) ── */}
      <header className="tpl-header reports-header">
        <div className="tpl-header-left">
          <div className="tpl-header-badge">
            <Activity size={13} className="tpl-badge-icon" />
            <span>Performance & Analytics</span>
          </div>
          <h1 className="tpl-title">Performance & Analytics</h1>
          <p className="tpl-subtitle">
            Comprehensive typing velocity, precision metrics, and language proficiency over time.
          </p>
        </div>

        {/* Header Action Tools */}
        <div className="tpl-header-actions reports-header-actions">
          {/* Dataset Source Toggle */}
          <div className="reports-dataset-pill">
            <button
              type="button"
              className={`reports-dataset-btn ${!useDemoData ? 'active' : ''}`}
              onClick={() => setUseDemoData(false)}
              title="View your saved practice sessions"
              id="btn-source-my-data"
            >
              <span>My History</span>
              {hasRealSessions && (
                <span className="reports-pill-count">{savedSessions.length}</span>
              )}
            </button>
            <button
              type="button"
              className={`reports-dataset-btn ${useDemoData ? 'active' : ''}`}
              onClick={() => setUseDemoData(true)}
              title="Deterministic reference dataset"
              id="btn-source-demo-data"
            >
              <Sparkles size={12} className="reports-spark-icon" />
              <span>Demo Dataset</span>
            </button>
          </div>

          {/* Refresh Action */}
          <button
            type="button"
            className={`tpl-hdr-btn tpl-hdr-secondary ${isRefreshing ? 'refreshing' : ''}`}
            onClick={handleRefresh}
            title="Refresh calculated analytics"
            id="btn-refresh-analytics"
          >
            <RotateCcw size={14} className={isRefreshing ? 'spin-anim' : ''} />
            <span>Refresh</span>
          </button>

          {/* Export CSV Action */}
          <button
            type="button"
            className="tpl-hdr-btn tpl-hdr-primary"
            onClick={handleExportCsv}
            disabled={isEmpty}
            title="Export filtered records to CSV"
            id="btn-export-csv"
          >
            <Download size={14} strokeWidth={2.2} />
            <span>Export CSV</span>
          </button>
        </div>
      </header>

      {/* ── Controls Bar: Date Range Filter & Dataset Status ── */}
      <div className="reports-controls-bar">
        <div className="reports-date-filters" role="tablist" aria-label="Date range filter">
          <span className="reports-filter-label">
            <Calendar size={13} />
            <span>Time Range:</span>
          </span>
          {DATE_RANGES.map((rng) => (
            <button
              key={rng.id}
              type="button"
              className={`reports-range-pill ${selectedRange === rng.id ? 'active' : ''}`}
              onClick={() => setSelectedRange(rng.id)}
              id={`btn-range-${rng.id}`}
            >
              {rng.label}
            </button>
          ))}
        </div>

        <div className="reports-meta-status">
          {useDemoData ? (
            <div className="reports-status-indicator demo">
              <span className="status-ping" />
              <span>Showing deterministic reference baseline (24 sessions)</span>
            </div>
          ) : (
            <div className="reports-status-indicator live">
              <span className="status-ping live" />
              <span>
                Live local storage ({filteredSessions.length} of {savedSessions.length} sessions in range)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Empty State Handling ── */}
      {isEmpty ? (
        <ReportsEmptyState
          onStartPractice={() => navigate('/templates')}
          onResetDemo={() => setUseDemoData(true)}
        />
      ) : (
        <>
          {/* ── 5 Core Summary Metric Cards ── */}
          <div className="reports-stat-grid">
            <AnalyticsStatCard
              icon={Zap}
              tone="rose"
              label="Personal Best WPM"
              value={metrics.personalBestWpm > 0 ? `${metrics.personalBestWpm} WPM` : '—'}
              sub="Peak speed logged"
              tag="Top Record"
            />
            <AnalyticsStatCard
              icon={TrendingUp}
              tone="cobalt"
              label="Average WPM"
              value={metrics.averageWpm > 0 ? `${metrics.averageWpm} WPM` : '—'}
              sub="Mean typing velocity"
              tag="Filtered"
            />
            <AnalyticsStatCard
              icon={Target}
              tone="emerald"
              label="Average Accuracy"
              value={metrics.averageAccuracy > 0 ? `${metrics.averageAccuracy}%` : '—'}
              sub="Precision rate"
              tag="Keystrokes"
            />
            <AnalyticsStatCard
              icon={Clock}
              tone="amber"
              label="Total Practice Time"
              value={metrics.totalPracticeFormatted}
              sub="Focused exercise duration"
              tag="Active"
            />
            <AnalyticsStatCard
              icon={Award}
              tone="purple"
              label="Completed Sessions"
              value={`${metrics.completedSessions}`}
              sub="Finished code drills"
              tag="Logged"
            />
          </div>

          {/* ── Large WPM & Accuracy Progression Chart ── */}
          <div className="card reports-chart-card">
            <div className="card-hd reports-chart-hd">
              <div className="reports-chart-hd-left">
                <div className="reports-chart-title-row">
                  <div className="stat-icon-wrap cobalt mini">
                    <Activity size={15} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="card-title">Velocity & Accuracy Progression</h3>
                    <p className="card-sub">
                      Session-by-session typing velocity (WPM) and keystroke precision (%)
                    </p>
                  </div>
                </div>
              </div>

              {/* Chart Series Toggle */}
              <div className="reports-series-toggle">
                <button
                  type="button"
                  className={`reports-toggle-pill ${chartSeriesMode === 'both' ? 'active' : ''}`}
                  onClick={() => setChartSeriesMode('both')}
                  id="btn-series-both"
                >
                  Both Series
                </button>
                <button
                  type="button"
                  className={`reports-toggle-pill ${chartSeriesMode === 'wpm' ? 'active' : ''}`}
                  onClick={() => setChartSeriesMode('wpm')}
                  id="btn-series-wpm"
                >
                  <span className="dot-indicator blue" />
                  WPM Only
                </button>
                <button
                  type="button"
                  className={`reports-toggle-pill ${chartSeriesMode === 'acc' ? 'active' : ''}`}
                  onClick={() => setChartSeriesMode('acc')}
                  id="btn-series-acc"
                >
                  <span className="dot-indicator green" />
                  Accuracy Only
                </button>
              </div>
            </div>

            <div className="card-bd reports-chart-body">
              <div className="reports-chart-container" style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={progressionData}
                    margin={{ top: 12, right: 20, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(255, 255, 255, 0.06)"
                    />
                    <XAxis
                      dataKey="label"
                      stroke="#64748B"
                      tick={{ fill: '#64748B', fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
                    />
                    {(chartSeriesMode === 'both' || chartSeriesMode === 'wpm') && (
                      <YAxis
                        yAxisId="wpm"
                        domain={[wpmMin, wpmMax]}
                        stroke="#64748B"
                        tick={{ fill: '#64748B', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        unit=" wpm"
                      />
                    )}
                    {(chartSeriesMode === 'both' || chartSeriesMode === 'acc') && (
                      <YAxis
                        yAxisId="acc"
                        orientation="right"
                        domain={[80, 100]}
                        stroke="#64748B"
                        tick={{ fill: '#64748B', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        unit="%"
                      />
                    )}
                    <Tooltip content={<CustomLineChartTooltip />} />

                    {(chartSeriesMode === 'both' || chartSeriesMode === 'wpm') && (
                      <Line
                        yAxisId="wpm"
                        type="monotone"
                        dataKey="wpm"
                        name="Net WPM"
                        stroke="#2563EB"
                        strokeWidth={2.4}
                        dot={{ r: 3, fill: '#2563EB', strokeWidth: 1.5, stroke: '#FFFFFF' }}
                        activeDot={{ r: 5, fill: '#2563EB', stroke: '#FFFFFF', strokeWidth: 2 }}
                      />
                    )}

                    {(chartSeriesMode === 'both' || chartSeriesMode === 'acc') && (
                      <Line
                        yAxisId="acc"
                        type="monotone"
                        dataKey="accuracy"
                        name="Accuracy (%)"
                        stroke="#059669"
                        strokeWidth={2}
                        strokeDasharray={chartSeriesMode === 'both' ? '4 4' : '0'}
                        dot={{ r: 2.5, fill: '#059669', strokeWidth: 1, stroke: '#FFFFFF' }}
                        activeDot={{ r: 5, fill: '#059669', stroke: '#FFFFFF', strokeWidth: 2 }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Chart Legend Footer */}
              <div className="reports-chart-footer">
                <div className="chart-legend-item">
                  <span className="legend-indicator-line blue" />
                  <span className="legend-label">Net Typing Speed (WPM)</span>
                </div>
                <div className="chart-legend-item">
                  <span className="legend-indicator-line green dashed" />
                  <span className="legend-label">Accuracy Precision (%)</span>
                </div>
                <div className="chart-legend-note">
                  <span>{filteredSessions.length} total sessions tracked</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Two-Column Insights Grid: Language Proficiency & Practice Rhythm ── */}
          <div className="reports-two-col-grid">
            {/* 1. Language Proficiency Comparison */}
            <div className="card reports-sub-card">
              <div className="card-hd">
                <div>
                  <h3 className="card-title">Language Proficiency</h3>
                  <p className="card-sub">
                    Average speed, accuracy, and practice volume by programming language
                  </p>
                </div>
              </div>

              <div className="card-bd">
                {/* Mini Bar Chart */}
                <div style={{ width: '100%', height: 180, marginBottom: 16 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={languageProficiency}
                      margin={{ top: 8, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="rgba(255, 255, 255, 0.06)"
                      />
                      <XAxis
                        dataKey="language"
                        stroke="#64748B"
                        tick={{ fill: '#64748B', fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
                      />
                      <YAxis
                        stroke="#64748B"
                        tick={{ fill: '#64748B', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        unit=" wpm"
                      />
                      <Tooltip content={<CustomBarTooltip unit="WPM" />} />
                      <Bar dataKey="avgWpm" radius={[5, 5, 0, 0]} maxBarSize={38}>
                        {languageProficiency.map((entry, idx) => (
                          <Cell
                            key={`cell-${idx}`}
                            fill={LANG_COLORS[entry.language] || '#2563EB'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Detailed Language Metrics Rows */}
                <div className="reports-lang-rows">
                  {languageProficiency.map((item) => (
                    <div key={item.language} className="reports-lang-row">
                      <div className="lang-row-left">
                        <span
                          className="lang-color-dot"
                          style={{ background: LANG_COLORS[item.language] || '#2563EB' }}
                        />
                        <span className="lang-name">{item.language}</span>
                      </div>
                      <div className="lang-row-middle">
                        <div className="lang-bar-track">
                          <div
                            className="lang-bar-fill"
                            style={{
                              width: `${Math.min(100, Math.round((item.avgWpm / 80) * 100))}%`,
                              background: LANG_COLORS[item.language] || '#2563EB',
                            }}
                          />
                        </div>
                      </div>
                      <div className="lang-row-right">
                        <span className="lang-metric-wpm">{item.avgWpm} WPM</span>
                        <span className="lang-metric-acc">{item.avgAccuracy}%</span>
                        <span className="lang-metric-count">{item.sessions} drills</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Practice Rhythm & Daily Distribution */}
            <div className="card reports-sub-card">
              <div className="card-hd">
                <div>
                  <h3 className="card-title">Practice Distribution</h3>
                  <p className="card-sub">
                    Weekly practice rhythm and session volume by day of the week
                  </p>
                </div>
              </div>

              <div className="card-bd">
                {/* Day of Week Bar Chart */}
                <div style={{ width: '100%', height: 180, marginBottom: 16 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dayDistribution}
                      margin={{ top: 8, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="rgba(255, 255, 255, 0.06)"
                      />
                      <XAxis
                        dataKey="day"
                        stroke="#64748B"
                        tick={{ fill: '#64748B', fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
                      />
                      <YAxis
                        stroke="#64748B"
                        tick={{ fill: '#64748B', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomBarTooltip unit="sessions" />} />
                      <Bar
                        dataKey="sessions"
                        fill="#0284C7"
                        radius={[5, 5, 0, 0]}
                        maxBarSize={38}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Practice Cadence Highlights */}
                <div className="reports-cadence-grid">
                  <div className="cadence-box">
                    <span className="cadence-lbl">Most Active Day</span>
                    <span className="cadence-val">
                      {mostActiveDay ? mostActiveDay.fullName : '—'}
                    </span>
                    <span className="cadence-sub">
                      {mostActiveDay ? `${mostActiveDay.sessions} sessions (${mostActiveDay.minutes}m)` : '0m'}
                    </span>
                  </div>
                  <div className="cadence-box">
                    <span className="cadence-lbl">Average Per Day</span>
                    <span className="cadence-val">
                      {(filteredSessions.length / 7).toFixed(1)}
                    </span>
                    <span className="cadence-sub">Sessions / day rate</span>
                  </div>
                  <div className="cadence-box">
                    <span className="cadence-lbl">Total Logged Time</span>
                    <span className="cadence-val">{metrics.totalPracticeFormatted}</span>
                    <span className="cadence-sub">Focused typing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Recent Practice History Table ── */}
          <div className="card reports-table-card">
            <div className="card-hd reports-table-hd">
              <div className="reports-table-hd-left">
                <h3 className="card-title">Recent Practice Sessions</h3>
                <span className="reports-table-count">
                  {displayTableSessions.length} sessions
                </span>
              </div>

              {/* Table Search */}
              <div className="reports-table-search">
                <Search size={14} className="reports-search-icon" />
                <input
                  type="text"
                  placeholder="Filter by snippet or language..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="reports-search-input"
                  id="input-reports-search"
                />
              </div>
            </div>

            <div className="reports-table-responsive">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Exercise Snippet</th>
                    <th>Language</th>
                    <th>Difficulty</th>
                    <th className="text-right">Net WPM</th>
                    <th className="text-right">Accuracy</th>
                    <th className="text-right">Duration</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayTableSessions.map((session, idx) => {
                    const d = new Date(session.date);
                    const dateFormatted = !isNaN(d.getTime())
                      ? d.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : session.date;

                    const timeFormatted = !isNaN(d.getTime())
                      ? d.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '';

                    const durationSec = session.durationSeconds || 60;
                    const durM = Math.floor(durationSec / 60);
                    const durS = durationSec % 60;
                    const durFormatted = `${durM}m ${durS < 10 ? '0' : ''}${durS}s`;

                    return (
                      <tr key={session.id || idx} className="reports-table-row">
                        <td className="cell-date">
                          <div className="cell-date-main">{dateFormatted}</div>
                          {timeFormatted && <div className="cell-date-sub">{timeFormatted}</div>}
                        </td>
                        <td className="cell-snippet">
                          <div className="cell-snippet-title">
                            {session.snippetTitle || session.title || 'Code Snippet'}
                          </div>
                        </td>
                        <td className="cell-lang">
                          <span className="badge badge-teal">
                            <span
                              className="lang-dot-inline"
                              style={{
                                background: LANG_COLORS[session.language] || '#2563EB',
                              }}
                            />
                            {session.language}
                          </span>
                        </td>
                        <td className="cell-diff">
                          <span
                            className={`badge ${
                              session.difficulty === 'Beginner'
                                ? 'badge-emerald'
                                : session.difficulty === 'Intermediate'
                                ? 'badge-indigo'
                                : 'badge-amber'
                            }`}
                          >
                            {session.difficulty || 'Intermediate'}
                          </span>
                        </td>
                        <td className="cell-wpm text-right">
                          <span className="wpm-highlight">{session.wpm}</span>
                          <span className="wpm-unit"> WPM</span>
                        </td>
                        <td className="cell-acc text-right">
                          <span className="acc-highlight">{session.accuracy}%</span>
                        </td>
                        <td className="cell-duration text-right">
                          <span className="duration-text">{durFormatted}</span>
                        </td>
                        <td className="cell-action text-right">
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs btn-table-practice"
                            onClick={() => handleStartPractice(session)}
                            title="Practice this snippet again"
                            id={`btn-table-practice-${idx}`}
                          >
                            <Play size={11} fill="currentColor" strokeWidth={0} />
                            <span>Practice</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
