// src/components/reports/SessionReportModal.jsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Flame, Code2, Zap, Target, Clock, ShieldCheck,
  RotateCcw, Calendar, AlertCircle, Award, CheckCircle
} from 'lucide-react';
import KeyHeatmap from './KeyHeatmap';
import TemplateErrorLocations from './TemplateErrorLocations';

export default function SessionReportModal({
  isOpen,
  onClose,
  session,
  onPracticeAgain,
}) {
  const [activeTab, setActiveTab] = useState('heatmap'); // 'heatmap' | 'template'

  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  if (!isOpen || !session) return null;

  const dateObj = new Date(session.date || session.completedAt || session.startedAt);
  const formattedDate = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recent Session';

  const durationSec = session.durationSeconds || Math.round((session.durationMs || 0) / 1000) || 60;
  const durM = Math.floor(durationSec / 60);
  const durS = durationSec % 60;
  const formattedDuration = `${durM}m ${durS < 10 ? '0' : ''}${durS}s`;

  const totalErrors = session.errors ?? session.errorCount ?? 0;
  const netWpm = session.wpm ?? session.netWpm ?? 0;
  const grossWpm = session.grossWpm ?? netWpm;
  const accuracy = session.accuracy ?? session.accuracyPercent ?? 100;

  return createPortal(
    <div className="modal-backdrop reports-modal-backdrop" role="dialog" aria-modal="true" style={{ zIndex: 99999 }}>
      <div className="session-report-modal-panel">
        {/* ── Modal Header ── */}
        <div className="session-modal-hd">
          <div className="session-modal-hd-info">
            <div className="session-modal-pills">
              <span className="badge badge-teal">{session.language || 'Code'}</span>
              <span className="badge badge-indigo">{session.difficulty || 'Intermediate'}</span>
              {session.isServerVerified && (
                <span className="badge badge-emerald-light">
                  <ShieldCheck size={12} strokeWidth={2.4} /> Server Verified
                </span>
              )}
            </div>

            <h3 className="session-modal-title">
              {session.snippetTitle || session.title || 'Practice Template Report'}
            </h3>

            <div className="session-modal-date">
              <Calendar size={13} />
              <span>{formattedDate}</span>
            </div>
          </div>

          <button
            type="button"
            className="session-modal-close-btn"
            onClick={onClose}
            aria-label="Close report modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Top Summary Stats Ribbon ── */}
        <div className="session-modal-stats-ribbon">
          <div className="modal-stat-box cobalt">
            <div className="stat-box-lbl">
              <Zap size={14} /> Net Speed
            </div>
            <div className="stat-box-val">
              {netWpm} <span className="stat-box-unit">WPM</span>
            </div>
            <div className="stat-box-sub">{grossWpm} Gross WPM</div>
          </div>

          <div className="modal-stat-box emerald">
            <div className="stat-box-lbl">
              <Target size={14} /> Accuracy
            </div>
            <div className="stat-box-val">
              {accuracy}<span className="stat-box-unit">%</span>
            </div>
            <div className="stat-box-sub">
              {totalErrors === 0 ? 'Flawless execution' : `${totalErrors} mistyped key${totalErrors > 1 ? 's' : ''}`}
            </div>
          </div>

          <div className="modal-stat-box amber">
            <div className="stat-box-lbl">
              <Clock size={14} /> Duration
            </div>
            <div className="stat-box-val">{formattedDuration}</div>
            <div className="stat-box-sub">{durationSec}s active typing</div>
          </div>

          <div className="modal-stat-box rose">
            <div className="stat-box-lbl">
              <AlertCircle size={14} /> Total Errors
            </div>
            <div className="stat-box-val">{totalErrors}</div>
            <div className="stat-box-sub">Keystroke misses</div>
          </div>
        </div>

        {/* ── Sub-Navigation Tabs ── */}
        <div className="session-modal-tabs">
          <button
            type="button"
            className={`session-modal-tab ${activeTab === 'heatmap' ? 'active' : ''}`}
            onClick={() => setActiveTab('heatmap')}
          >
            <Flame size={15} />
            <span>Key Error Heatmap</span>
            {totalErrors > 0 && <span className="tab-count-pill">{totalErrors}</span>}
          </button>

          <button
            type="button"
            className={`session-modal-tab ${activeTab === 'template' ? 'active' : ''}`}
            onClick={() => setActiveTab('template')}
          >
            <Code2 size={15} />
            <span>Template Error Locations</span>
            {session.errorLocations && session.errorLocations.length > 0 && (
              <span className="tab-count-pill">{session.errorLocations.length}</span>
            )}
          </button>
        </div>

        {/* ── Tab Content ── */}
        <div className="session-modal-content-area">
          {activeTab === 'heatmap' && (
            <KeyHeatmap
              keyErrorMap={session.keyErrorMap || {}}
              totalErrors={totalErrors}
            />
          )}

          {activeTab === 'template' && (
            <TemplateErrorLocations
              code={session.code || session.sourceContent || ''}
              language={session.language || 'javascript'}
              errorLocations={session.errorLocations || []}
              syntaxErrors={session.syntaxErrors || null}
            />
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="session-modal-footer">
          <button
            type="button"
            className="btn btn-secondary-glass btn-sm"
            onClick={onClose}
          >
            <span>Close Report</span>
          </button>

          {onPracticeAgain && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                onClose();
                onPracticeAgain(session);
              }}
            >
              <RotateCcw size={14} />
              <span>Practice This Snippet</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
