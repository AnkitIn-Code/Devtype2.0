// src/components/common/ActivityHeatmap.jsx
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { BarChart2, ChevronLeft, ChevronRight, Calendar, Flame, Zap } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Deterministic pseudo-random activity generator based on date string
 */
function getDayActivity(year, monthIdx, dayNum) {
  // Deterministic seed
  const dayOfYear = (monthIdx * 30.5 + dayNum);
  const hotRanges = [
    [10, 16], [18, 26], [38, 45],
    [65, 74], [82, 91], [130, 140],
    [184, 212], [215, 228], [244, 266], [274, 292],
  ];

  let level = 0;
  for (const [start, end] of hotRanges) {
    if (dayOfYear >= start && dayOfYear <= end) {
      const hash = ((dayOfYear * 9301 + 49297) % 233280) / 233280;
      level = hash < 0.15 ? 1 : hash < 0.40 ? 2 : hash < 0.70 ? 3 : hash < 0.90 ? 4 : 5;
      break;
    }
  }

  // Fallback occasional light practice
  if (level === 0) {
    const hash = ((dayOfYear * 7919) % 100);
    if (hash > 82) level = 1;
    else if (hash > 94) level = 2;
  }

  const sessions = level === 0 ? 0 : level === 1 ? 1 : level === 2 ? 3 : level === 3 ? 5 : level === 4 ? 8 : 12;
  return { level, sessions };
}

/**
 * Build month calendar matrix:
 * weeks array where each week has 7 day objects (or null if outside month)
 */
function buildMonthCalendar(year, monthIdx, activityMap) {
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const firstDay = new Date(year, monthIdx, 1);
  // getDay() gives 0 for Sun, 1 for Mon... Convert to Mon=0, Sun=6
  const startDayOfWeek = (firstDay.getDay() + 6) % 7;

  const weeks = [];
  let currentWeek = [];

  // Pad days before 1st of month
  for (let i = 0; i < startDayOfWeek; i++) {
    currentWeek.push(null);
  }

  // Populate days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    let level = 0;
    let sessions = 0;

    if (activityMap) {
      const act = activityMap[dateStr];
      if (act) {
        sessions = act.sessionCount || 0;
        level = act.level ?? (sessions === 0 ? 0 : sessions <= 2 ? 1 : sessions <= 4 ? 2 : sessions <= 7 ? 3 : 4);
      }
    } else {
      const demo = getDayActivity(year, monthIdx, day);
      level = demo.level;
      sessions = demo.sessions;
    }

    currentWeek.push({
      dayNum: day,
      date: dateStr,
      level,
      sessions,
      inMonth: true,
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Pad remaining days of last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return {
    monthIdx,
    name: MONTH_NAMES[monthIdx],
    shortName: MONTH_SHORT[monthIdx],
    daysInMonth,
    weeks,
    totalSessions: weeks.reduce(
      (sum, w) => sum + w.reduce((s, d) => s + (d ? d.sessions : 0), 0),
      0
    ),
    activeDays: weeks.reduce(
      (sum, w) => sum + w.reduce((s, d) => s + (d && d.level > 0 ? 1 : 0), 0),
      0
    ),
  };
}

export default function ActivityHeatmap({
  title = 'Practice Activity',
  subtitle = 'Daily keyboard activity and practice telemetry',
  activityData = null,
}) {
  const CUR_DATE = new Date();
  const CUR_YEAR = CUR_DATE.getFullYear();
  const CUR_MONTH_IDX = CUR_DATE.getMonth();
  const TODAY_STR = `${CUR_YEAR}-${String(CUR_MONTH_IDX + 1).padStart(2, '0')}-${String(CUR_DATE.getDate()).padStart(2, '0')}`;

  const [year, setYear] = useState(CUR_YEAR);
  const [activeMonthFilter, setActiveMonthFilter] = useState('all'); // 'all' or 0..11

  const scrollTrackRef = useRef(null);
  const monthRefs = useRef({});

  const activityMap = useMemo(() => {
    if (!Array.isArray(activityData)) return null;
    const map = {};
    for (const item of activityData) {
      if (item?.date) {
        map[item.date] = item;
      }
    }
    return map;
  }, [activityData]);

  // Generate 12 distinct months
  const allMonthsData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => buildMonthCalendar(year, i, activityMap));
  }, [year, activityMap]);

  // Aggregate year totals
  const yearStats = useMemo(() => {
    const totalSessions = allMonthsData.reduce((sum, m) => sum + m.totalSessions, 0);
    const totalActiveDays = allMonthsData.reduce((sum, m) => sum + m.activeDays, 0);
    return { totalSessions, totalActiveDays };
  }, [allMonthsData]);

  const activeMonthData = activeMonthFilter === 'all' ? null : allMonthsData[activeMonthFilter];

  const scrollToTargetMonth = useCallback((monthIdx, behavior = 'smooth') => {
    const track = scrollTrackRef.current;
    const targetEl = monthRefs.current[monthIdx];
    if (!track || !targetEl) return;

    const trackWidth = track.clientWidth;
    const elLeft = targetEl.offsetLeft;
    const elWidth = targetEl.offsetWidth;
    const targetScroll = Math.max(0, elLeft - (trackWidth / 2) + (elWidth / 2));

    track.scrollTo({
      left: targetScroll,
      behavior,
    });
  }, []);

  // Automatically scroll to current month on initial mount and when year/view changes
  useEffect(() => {
    if (activeMonthFilter !== 'all') return;
    const targetIdx = year === CUR_YEAR ? CUR_MONTH_IDX : 0;
    const timer = setTimeout(() => {
      scrollToTargetMonth(targetIdx, 'smooth');
    }, 120);

    return () => clearTimeout(timer);
  }, [year, activeMonthFilter, CUR_YEAR, CUR_MONTH_IDX, scrollToTargetMonth]);

  return (
    <div className="card heatmap-card month-heatmap-card">
      {/* ── CARD HEADER ── */}
      <div className="card-hd">
        <div className="card-hd-left">
          <div className="card-title">
            <BarChart2 size={18} color="var(--brand)" />
            <span>{title}</span>
          </div>
          <div className="card-sub">
            {subtitle} in {year} • <strong>{yearStats.totalSessions} sessions</strong> across {yearStats.totalActiveDays} active days
          </div>
        </div>

        {/* Year Navigator */}
        <div className="hm-nav">
          <button
            type="button"
            className="hm-nav-btn"
            onClick={() => setYear((y) => y - 1)}
            disabled={year <= 2023}
            title="Previous year"
          >
            <ChevronLeft size={15} strokeWidth={2.2} />
          </button>
          <span className="hm-year">{year}</span>
          <button
            type="button"
            className="hm-nav-btn"
            onClick={() => setYear((y) => Math.min(y + 1, CUR_YEAR))}
            disabled={year >= CUR_YEAR}
            title="Next year"
          >
            <ChevronRight size={15} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <div className="card-bd hm-month-container">
        {/* ── MONTH QUICK-JUMP FILTER PILLS ── */}
        <div className="hm-month-pills-row">
          <button
            type="button"
            className={`hm-month-pill ${activeMonthFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveMonthFilter('all')}
          >
            All Months ({year})
          </button>
          {year === CUR_YEAR && (
            <button
              type="button"
              className="hm-month-pill hm-jump-current-pill"
              onClick={() => {
                if (activeMonthFilter !== 'all') {
                  setActiveMonthFilter('all');
                }
                scrollToTargetMonth(CUR_MONTH_IDX, 'smooth');
              }}
              title="Automatically center current month"
            >
              <Flame size={12} color="var(--brand)" />
              <span>Current Month</span>
            </button>
          )}
          {MONTH_SHORT.map((mShort, idx) => (
            <button
              key={mShort}
              type="button"
              className={`hm-month-pill ${activeMonthFilter === idx ? 'active' : ''}`}
              onClick={() => setActiveMonthFilter(idx)}
            >
              {mShort}
            </button>
          ))}
        </div>

        {/* ── VIEW 1: ALL 12 MONTHS (INDIVIDUAL MONTH BLOCKS WITH REAL GAPS) ── */}
        {activeMonthFilter === 'all' ? (
          <div className="hm-months-scroll-track" ref={scrollTrackRef}>
            <div className="hm-all-months-grid">
              {allMonthsData.map((month) => {
                const isCurrentMonth = year === CUR_YEAR && month.monthIdx === CUR_MONTH_IDX;
                return (
                  <div
                    key={month.shortName}
                    ref={(el) => {
                      if (el) monthRefs.current[month.monthIdx] = el;
                    }}
                    className={`hm-single-month-block ${isCurrentMonth ? 'is-current-month' : ''}`}
                    onClick={() => setActiveMonthFilter(month.monthIdx)}
                    title={`Click to inspect ${month.name} (${month.totalSessions} sessions)`}
                  >
                    <div className="hm-month-block-header">
                      <span className="hm-month-block-title">{month.shortName}</span>
                      {isCurrentMonth ? (
                        <span className="hm-current-month-indicator">Current</span>
                      ) : (
                        <span className="hm-month-block-badge">
                          {month.totalSessions > 0 ? `${month.totalSessions} runs` : '0 runs'}
                        </span>
                      )}
                    </div>

                    {/* Month Weekday Legend Header */}
                    <div className="hm-month-mini-weekdays">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayChar, i) => (
                        <span key={i} className="mini-day-header">{dayChar}</span>
                      ))}
                    </div>

                    {/* 7-column calendar matrix for this specific month */}
                    <div className="hm-month-calendar-grid">
                      {month.weeks.map((week, wIdx) => (
                        <div key={wIdx} className="hm-month-week-row">
                          {week.map((day, dIdx) => {
                            const isToday = day && day.date === TODAY_STR;
                            return (
                              <div
                                key={dIdx}
                                className={`hm-cell-month ${day ? `data-l-${day.level}` : 'cell-empty'} ${isToday ? 'is-today' : ''}`}
                                title={
                                  day
                                    ? `${day.date}${isToday ? ' (Today)' : ''}: ${day.sessions > 0 ? `${day.sessions} sessions` : 'No activity'}`
                                    : ''
                                }
                              >
                                {day && <span className="hm-day-num">{day.dayNum}</span>}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ── VIEW 2: FOCUSED SINGLE MONTH VIEW ── */
          <div className="hm-focused-month-view">
            <div className="focused-month-header">
              <div className="focused-title-wrap">
                <Calendar size={18} color="var(--brand)" />
                <h3 className="focused-month-title">
                  {activeMonthData.name} {year}
                </h3>
              </div>
              <div className="focused-stats-pills">
                <span className="badge badge-teal">
                  <Flame size={12} />
                  {activeMonthData.activeDays} Active Days
                </span>
                <span className="badge badge-indigo">
                  <Zap size={12} />
                  {activeMonthData.totalSessions} Total Sessions
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setActiveMonthFilter('all')}
                  style={{ marginLeft: 8 }}
                >
                  View All Months
                </button>
              </div>
            </div>

            {/* Large Calendar Table for the active month */}
            <div className="focused-calendar-table">
              <div className="focused-table-header">
                {WEEKDAY_SHORT.map((wd) => (
                  <div key={wd} className="focused-header-cell">{wd}</div>
                ))}
              </div>

              <div className="focused-table-body">
                {activeMonthData.weeks.map((week, wIdx) => (
                  <div key={wIdx} className="focused-table-row">
                    {week.map((day, dIdx) => (
                      <div
                        key={dIdx}
                        className={`focused-day-cell ${
                          day ? `active-day data-l-${day.level}` : 'inactive-day'
                        }`}
                        title={
                          day
                            ? `${day.date}: ${day.sessions > 0 ? `${day.sessions} sessions completed` : 'Rest day'}`
                            : ''
                        }
                      >
                        {day ? (
                          <>
                            <div className="focused-day-top">
                              <span className="day-number">{day.dayNum}</span>
                              {day.level >= 4 && (
                                <span className="hot-day-pip" title="Peak activity" />
                              )}
                            </div>
                            <div className="focused-day-bottom">
                              {day.sessions > 0 ? (
                                <span className="day-session-count">{day.sessions} runs</span>
                              ) : (
                                <span className="day-empty-dash">—</span>
                              )}
                            </div>
                          </>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── HEATMAP FOOTER & LEGEND ── */}
        <div className="hm-footer-row">
          <div className="hm-legend-wrap">
            <span className="hm-legend-lbl">Less Activity</span>
            <div className="hm-legend-cells">
              {[0, 1, 2, 3, 4, 5].map((lvl) => (
                <div key={lvl} className={`hm-legend-box data-l-${lvl}`} title={`Intensity ${lvl}`} />
              ))}
            </div>
            <span className="hm-legend-lbl">More Activity</span>
          </div>

          <div className="hm-helper-tip">
            {activeMonthFilter === 'all'
              ? 'Click any month card to view its full calendar breakdown'
              : `Showing full calendar breakdown for ${activeMonthData?.name} ${year}`}
          </div>
        </div>
      </div>
    </div>
  );
}
