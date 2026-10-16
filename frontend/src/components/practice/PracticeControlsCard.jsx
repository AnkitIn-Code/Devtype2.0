// src/components/practice/PracticeControlsCard.jsx
import { Volume2, VolumeX, ArrowLeft } from 'lucide-react';
import { LANGUAGES } from '../../data/snippets';

export default function PracticeControlsCard({
  snippets,
  selectedSnippet,
  onSelectSnippet,
  selectedLang,
  onSelectLang,
  mode,
  onSelectMode,
  keymap,
  onSelectKeymap,
  soundEnabled,
  onToggleSound,
  theme,
  onToggleTheme,
  onFetchRandomSnippet,
  onReset,
  onBackToDashboard,
}) {
  return (
    <div className="practice-controls-card-modern">
      {/* ── Top Header ── */}
      <div className="pc-header-row">
        <div className="pc-settings-lbl">
          <span>Settings</span>
          <span className="pc-caret">▾</span>
        </div>

        <div className="pc-toggles-row">
          <button
            className={`pc-toggle-btn ${soundEnabled ? 'active' : ''}`}
            onClick={onToggleSound}
            title="Toggle mechanical typing sound"
            id="btn-toggle-sound"
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            <span>Sound: {soundEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            className="pc-toggle-btn"
            onClick={onToggleTheme}
            title="Toggle Theme mode"
            id="btn-toggle-theme"
          >
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </div>

      <div className="pc-divider" />

      {/* ── Settings Form Rows ── */}
      <div className="pc-form-body">
        {/* LANG ROW */}
        <div className="pc-form-row">
          <label className="pc-field-lbl" htmlFor="pc-lang-select">LANG</label>
          <div className="pc-field-content">
            <select
              id="pc-lang-select"
              className="pc-select"
              value={selectedLang}
              onChange={(e) => onSelectLang(e.target.value)}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
            <button
              className="pc-action-pill-btn"
              onClick={onFetchRandomSnippet}
              title="Load another random snippet in this language"
              id="btn-fetch-snippet"
            >
              Fetch
            </button>
          </div>
        </div>

        {/* MODE ROW */}
        <div className="pc-form-row">
          <label className="pc-field-lbl" htmlFor="pc-mode-select">MODE</label>
          <div className="pc-field-content">
            <select
              id="pc-mode-select"
              className="pc-select"
              value={mode}
              onChange={(e) => onSelectMode(e.target.value)}
            >
              <option value="Free">Free</option>
              <option value="Strict">Strict (No Errors Skipped)</option>
              <option value="Timed">Timed (60 Seconds)</option>
            </select>
          </div>
        </div>

        {/* PRACTICE ROW */}
        <div className="pc-form-row">
          <label className="pc-field-lbl" htmlFor="pc-practice-select">PRACTICE</label>
          <div className="pc-field-content">
            <select
              id="pc-practice-select"
              className="pc-select"
              value={selectedSnippet?.id || ''}
              onChange={(e) => {
                const found = snippets.find((s) => s.id === e.target.value);
                if (found) onSelectSnippet(found);
              }}
            >
              <option value="" disabled>-- Code --</option>
              {snippets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.language})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* KEYMAP ROW */}
        <div className="pc-form-row">
          <label className="pc-field-lbl" htmlFor="pc-keymap-select">KEYMAP</label>
          <div className="pc-field-content">
            <select
              id="pc-keymap-select"
              className="pc-select"
              value={keymap}
              onChange={(e) => onSelectKeymap(e.target.value)}
            >
              <option value="QWERTY">Standard QWERTY</option>
              <option value="Dvorak">Dvorak</option>
              <option value="Colemak">Colemak</option>
            </select>
            <button
              className="pc-action-pill-btn"
              onClick={onReset}
              title="Reset current practice session"
              id="btn-reset-session"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="pc-divider" />

      {/* ── Footer Exit Action ── */}
      <div className="pc-footer-row">
        <button
          className="btn btn-ghost btn-sm"
          onClick={onBackToDashboard}
          id="btn-back-to-dash"
        >
          <ArrowLeft size={14} />
          <span>Exit to Dashboard</span>
        </button>
      </div>
    </div>
  );
}
