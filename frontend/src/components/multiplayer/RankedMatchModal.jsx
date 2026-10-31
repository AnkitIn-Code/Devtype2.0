import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Trophy, Swords, Zap, ArrowRight, Clock, Users, CheckCircle2, AlertCircle } from 'lucide-react';

export default function RankedMatchModal({
  isOpen,
  onClose,
  mode, // 'classic' or 'duel'
  templates,
  onStartMatchmaking,
  errorMessage,
}) {
  const [step, setStep] = useState('select-lang'); // 'select-lang' | 'searching' | 'found'
  const [selectedLang, setSelectedLang] = useState('JavaScript');
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

  const STANDARD_LANGUAGES = ['JavaScript', 'Python', 'C++', 'TypeScript', 'Java', 'Go', 'Rust', 'C', 'SQL'];

  // Derive unique languages available from typing templates + standard catalog
  const availableLanguages = Array.from(
    new Set([
      ...STANDARD_LANGUAGES,
      ...templates
        .filter((t) => !t.bugFix && t.language)
        .map((t) => t.language)
    ])
  ).sort();

  // Matchmaking timer logic: 10s initially, expands to 30s
  useEffect(() => {
    if (step === 'searching') {
      timerRef.current = setInterval(() => {
        setSearchSeconds((prev) => {
          const next = prev + 1;
          if (next >= 10) {
            setIsExtendedTime(true);
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
  }, [step]);

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
                const count = templates.filter(
                  (t) => !t.bugFix && t.language?.toLowerCase() === lang.toLowerCase()
                ).length;
                const isSelected = selectedLang.toLowerCase() === lang.toLowerCase();

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

            {/* Timer Banner */}
            <div className="mp-search-timer-box">
              <Clock size={16} className="text-amber-500 animate-spin" />
              <span>
                Search Time: <strong>{searchSeconds}s</strong> / {isExtendedTime ? '30s' : '10s'}
              </span>
            </div>

            {/* Dynamic Notice when > 10s */}
            {isExtendedTime ? (
              <div className="mp-extended-time-banner">
                <div className="banner-icon-dot" />
                <span>
                  It will take some time as not many users are currently present online. Expanding matchmaking pool to find opponents...
                </span>
              </div>
            ) : (
              <p className="mp-quick-search-hint">
                Scanning active queues for closely rated opponents...
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
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalMarkup, document.body)
    : modalMarkup;
}
