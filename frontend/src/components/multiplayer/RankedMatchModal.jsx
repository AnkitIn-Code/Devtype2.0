import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Trophy, Swords, Zap, ArrowRight, Clock, Users, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

function normalizeLang(raw) {
  if (!raw) return '';
  const s = raw.trim().toLowerCase();
  if (s === 'c++' || s === 'cpp') return 'C++';
  if (s === 'c') return 'C';
  if (s === 'javascript' || s === 'js') return 'JavaScript';
  if (s === 'typescript' || s === 'ts') return 'TypeScript';
  if (s === 'python' || s === 'py') return 'Python';
  if (s === 'java') return 'Java';
  if (s === 'go' || s === 'golang') return 'Go';
  if (s === 'rust' || s === 'rs') return 'Rust';
  if (s === 'sql') return 'SQL';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export default function RankedMatchModal({
  isOpen,
  onClose,
  mode, // 'classic' or 'duel'
  templates,
  onStartMatchmaking,
  onTimeout,
  errorMessage,
}) {
  const [step, setStep] = useState('select-lang'); // 'select-lang' | 'searching' | 'timed-out'
  const [selectedLang, setSelectedLang] = useState('C++');
  const [searchSeconds, setSearchSeconds] = useState(0);
  const [isExtendedTime, setIsExtendedTime] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const origBody = document.body.style.overflow;
    const origHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = origBody;
      document.documentElement.style.overflow = origHtml;
    };
  }, []);

  const STANDARD_LANGUAGES = ['C++', 'Java', 'Python', 'JavaScript', 'TypeScript', 'C', 'Go', 'Rust', 'SQL'];

  // Derive unique normalized languages (no duplicates like "c" & "C", or "cpp" & "C++")
  const availableLanguages = Array.from(
    new Set([
      ...STANDARD_LANGUAGES,
      ...(templates || [])
        .filter((t) => !t.bugFix && t.language)
        .map((t) => normalizeLang(t.language))
    ])
  ).sort((a, b) => a.localeCompare(b));

  // Matchmaking timer logic:
  // Phase 1 (0-60s): 1-minute initial search limit
  // Phase 2 (60-120s): Expands to 2-minute extended search limit
  // Phase 3 (120s): Search stops automatically and displays timeout prompt
  useEffect(() => {
    if (step === 'searching') {
      timerRef.current = setInterval(() => {
        setSearchSeconds((prev) => {
          const next = prev + 1;
          if (next >= 60) {
            setIsExtendedTime(true);
          }
          if (next >= 120) {
            clearInterval(timerRef.current);
            setStep('timed-out');
            onTimeout?.();
            return 120;
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, onTimeout]);

  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!isOpen) return null;

  const isDuel = mode === 'duel';
  const modeTitle = isDuel ? '1v1 Duel' : 'Classic Race';
  const modeSubtitle = isDuel
    ? 'Direct 2-Player Head-to-Head Battle'
    : 'Simultaneous 4-Player Ranked Race';
  const requiredPlayers = isDuel ? 2 : 4;

  const handleConfirmLanguage = () => {
    setSearchSeconds(0);
    setIsExtendedTime(false);
    setStep('searching');
    onStartMatchmaking(mode, selectedLang || availableLanguages[0] || 'JavaScript');
  };

  const handleCancelSearch = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSearchSeconds(0);
    setIsExtendedTime(false);
    setStep('select-lang');
    onClose();
  };

  const modalMarkup = (
    <div className="mp-modal-backdrop" onClick={handleCancelSearch}>
      <div className="mp-matchmaking-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Bar */}
        <div className="mp-modal-header">
          <div className="mp-modal-title-group">
            <div className={`mp-modal-mode-icon ${isDuel ? 'is-duel' : 'is-classic'}`}>
              {isDuel ? <Swords size={20} /> : <Trophy size={20} />}
            </div>
            <div>
              <h3 className="mp-modal-title">{modeTitle}</h3>
              <p className="mp-modal-subtitle">{modeSubtitle}</p>
            </div>
          </div>
          <button
            type="button"
            className="mp-modal-close-btn"
            onClick={handleCancelSearch}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {errorMessage && (
          <div className="error-banner" style={{ margin: '16px 24px 0 24px' }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Select Language */}
        {step === 'select-lang' && (
          <div className="mp-modal-body">
            <div className="mp-step-instruction">
              <span className="mp-step-badge">Step 1</span>
              <h4>Select Match Language Field</h4>
              <p>
                Choose the programming language for the match. A random coding template will be
                automatically selected by the system for all competitors to ensure fair play.
              </p>
            </div>

            <div className="mp-lang-cards-grid">
              {availableLanguages.map((lang) => {
                const count = (templates || []).filter(
                  (t) => !t.bugFix && normalizeLang(t.language) === lang
                ).length;
                const isSelected = normalizeLang(selectedLang) === lang;

                return (
                  <div
                    key={lang}
                    className={`mp-lang-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedLang(lang)}
                  >
                    <div className="mp-lang-card-top">
                      <span className="mp-lang-name">{lang}</span>
                      {isSelected && (
                        <span className="mp-lang-checked">
                          <CheckCircle2 size={16} />
                        </span>
                      )}
                    </div>
                    <span className="mp-lang-count">{count} templates available</span>
                  </div>
                );
              })}
            </div>

            <div className="mp-random-notice">
              <Zap size={14} style={{ color: '#F59E0B' }} />
              <span>
                <strong>System Rule:</strong> No player can pick a specific template. Once {selectedLang} is selected, an unpredictable random template is assigned.
              </span>
            </div>

            <div className="mp-modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmLanguage}
                disabled={!selectedLang}
              >
                Start Matchmaking ({selectedLang}) <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Matchmaking Radar & Dynamic Countdown */}
        {step === 'searching' && (
          <div className="mp-modal-body text-center">
            {/* Radar Animation Graphic */}
            <div className="mp-radar-container">
              <div className="mp-radar-circle circle-1" />
              <div className="mp-radar-circle circle-2" />
              <div className="mp-radar-circle circle-3" />
              <div className="mp-radar-sweep" />
              <div className="mp-radar-core">
                <Users size={24} style={{ color: '#2563EB' }} />
              </div>
            </div>

            <h3 className="mp-search-status-title">Searching for Players...</h3>
            <p className="mp-search-meta">
              Matching for <strong>{modeTitle}</strong> in <strong>{selectedLang}</strong> · {requiredPlayers} Players Needed
            </p>

            {/* Timer Banner (60s initial, 120s extended max) */}
            <div className="mp-search-timer-box">
              <Clock size={16} className="text-amber-500 animate-spin" />
              <span>
                Search Time: <strong>{formatTime(searchSeconds)}</strong> ({searchSeconds}s) / {isExtendedTime ? '2:00 (2m max)' : '1:00 (1m)'}
              </span>
            </div>

            {/* Dynamic Notice when > 60s */}
            {isExtendedTime ? (
              <div className="mp-extended-time-banner">
                <div className="banner-icon-dot" />
                <span>
                  Expanding matchmaking pool to find opponents across wider skill ranges (up to 2 minutes max)...
                </span>
              </div>
            ) : (
              <p className="mp-quick-search-hint">
                Scanning active queues for closely rated opponents (1-minute initial search)...
              </p>
            )}

            <div className="mp-modal-actions justify-center">
              <button
                type="button"
                className="btn btn-ghost text-red-500"
                onClick={handleCancelSearch}
              >
                Cancel Matchmaking
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Matchmaking Timed Out (> 2 minutes) */}
        {step === 'timed-out' && (
          <div className="mp-modal-body text-center">
            <div
              className="mp-timeout-icon-wrap"
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1.5px solid rgba(239, 68, 68, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                color: '#EF4444',
              }}
            >
              <AlertCircle size={32} />
            </div>

            <h3 className="mp-search-status-title" style={{ color: '#EF4444' }}>Matchmaking Timed Out</h3>
            <p className="mp-search-meta" style={{ maxWidth: 440, margin: '8px auto 20px auto', lineHeight: 1.6 }}>
              No compatible opponents were found for <strong>{modeTitle}</strong> in <strong>{selectedLang}</strong> within the 2-minute search limit.
            </p>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--r12)',
                padding: '12px 16px',
                fontSize: '0.86rem',
                color: 'var(--t3)',
                marginBottom: 20,
              }}
            >
              You can search again, switch to another programming language with more active players, or create a private room to challenge friends directly.
            </div>

            <div className="mp-modal-actions justify-center" style={{ gap: 12 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancelSearch}
              >
                Return to Lobby
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setSearchSeconds(0);
                  setIsExtendedTime(false);
                  setStep('select-lang');
                }}
              >
                Change Language
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmLanguage}
              >
                <RefreshCw size={15} /> Search Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalMarkup, document.body)
    : modalMarkup;
}
