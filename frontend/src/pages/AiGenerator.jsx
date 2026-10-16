// src/pages/AiGenerator.jsx
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Play, Bookmark, Copy, Check,
  BookOpen, RefreshCw, Code2, Cpu,
  CheckCircle2, ArrowRight, Zap, History,
  Terminal, ShieldCheck
} from 'lucide-react';

import {
  generatePracticeSnippet,
  getAiHistory,
  PROMPT_PRESETS,
  AI_KNOWLEDGE_BASE,
} from '../utils/aiGeneratorStore';
import { saveCustomTemplate, estimateTypingTime } from '../utils/templateStore';
import { LANGUAGES, DIFFICULTIES } from '../data/snippets';

/* ================================================================
   LANGUAGE ACCENT COLORS
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

export default function AiGenerator() {
  const navigate = useNavigate();

  // ── Generator Configuration State ──
  const [prompt, setPrompt] = useState(
    'Implement a thread-safe LRU cache with O(1) get and put operations'
  );
  const [language, setLanguage] = useState('C++');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [lengthMode, setLengthMode] = useState('balanced'); // 'compact' | 'balanced' | 'deep'
  const [includeComments, setIncludeComments] = useState(true);

  // ── Generation Engine State ──
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSnippet, setGeneratedSnippet] = useState(() => {
    // Default to the first curated template from knowledge base
    const initial = AI_KNOWLEDGE_BASE[0];
    return {
      id: 'ai-init-1',
      title: initial.title,
      description: initial.description,
      language: 'C++',
      difficulty: 'Intermediate',
      code: initial.code,
      tags: initial.tags,
    };
  });

  // ── Interaction State ──
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [historyItems, setHistoryItems] = useState(() => getAiHistory());

  // ── Computed Metrics for Generated Snippet ──
  const snippetStats = useMemo(() => {
    if (!generatedSnippet?.code) return { chars: 0, lines: 0, estTime: '~0s' };
    const code = generatedSnippet.code;
    const lines = code.split('\n').length;
    const chars = code.length;
    const estTime = estimateTypingTime(code);
    return { chars, lines, estTime };
  }, [generatedSnippet]);

  // ── Generate Snippet Handler ──
  const handleGenerate = useCallback(
    async (overridePrompt = null) => {
      const activePrompt = overridePrompt || prompt;
      setIsGenerating(true);
      setIsSaved(false);

      try {
        const result = await generatePracticeSnippet({
          prompt: activePrompt,
          language,
          difficulty,
          lengthMode,
          includeComments,
        });
        setGeneratedSnippet(result);
        setHistoryItems(getAiHistory());
      } catch (err) {
        console.error('Generation error:', err);
      } finally {
        setIsGenerating(false);
      }
    },
    [prompt, language, difficulty, lengthMode, includeComments]
  );

  // ── Apply Prompt Preset ──
  const handleSelectPreset = useCallback((preset) => {
    setPrompt(preset.prompt);
    setLanguage(preset.language);
    setDifficulty(preset.difficulty);
    handleGenerate(preset.prompt);
  }, [handleGenerate]);

  // ── Save to Custom Templates ──
  const handleSaveToTemplates = useCallback(() => {
    if (!generatedSnippet || isSaved) return;

    saveCustomTemplate({
      title: generatedSnippet.title,
      language: generatedSnippet.language,
      difficulty: generatedSnippet.difficulty,
      description: generatedSnippet.description,
      code: generatedSnippet.code,
      tags: generatedSnippet.tags || ['AI Generated'],
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  }, [generatedSnippet, isSaved]);

  // ── Start Practice Handler ──
  const handleStartPractice = useCallback(() => {
    if (!generatedSnippet) return;
    navigate(
      `/practice?snippet=${generatedSnippet.id}&lang=${encodeURIComponent(
        generatedSnippet.language
      )}`,
      { state: { snippet: generatedSnippet } }
    );
  }, [navigate, generatedSnippet]);

  // ── Copy Code Handler ──
  const handleCopyCode = useCallback(() => {
    if (!generatedSnippet?.code) return;
    navigator.clipboard.writeText(generatedSnippet.code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [generatedSnippet]);

  // ── Load from History ──
  const handleLoadHistory = useCallback((item) => {
    setGeneratedSnippet(item);
    setLanguage(item.language);
    setDifficulty(item.difficulty);
    setIsSaved(false);
  }, []);

  return (
    <div className="aigen-page-root">
      {/* ── Page Header (Cupertino Liquid Glass Humanized Form) ── */}
      <header className="tpl-header aigen-header">
        <div className="tpl-header-left">
          <div className="tpl-header-badge">
            <Sparkles size={13} className="tpl-badge-icon" />
            <span>AI Practice Studio</span>
          </div>
          <h1 className="tpl-title">AI Practice Generator</h1>
          <p className="tpl-subtitle">
            Synthesize clean, real-world code snippets tailored to your target languages, difficulty tiers, and practice requirements.
          </p>
        </div>

        <div className="tpl-header-actions">
          <button
            type="button"
            className="tpl-hdr-btn tpl-hdr-secondary"
            onClick={() => navigate('/templates')}
            title="Browse pre-built templates"
            id="btn-nav-templates"
          >
            <BookOpen size={14} />
            <span>Template Catalog</span>
          </button>
        </div>
      </header>

      {/* ── Studio Interactive Workspace Grid ── */}
      <div className="aigen-studio-grid">
        {/* ── LEFT PANEL: Prompt & Configuration Studio ── */}
        <div className="card aigen-config-card">
          <div className="card-hd aigen-config-hd">
            <div className="aigen-config-hd-title">
              <div className="stat-icon-wrap cobalt mini">
                <Cpu size={15} strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="card-title">Prompt & Settings</h3>
                <p className="card-sub">Define target topic, language, and coding style</p>
              </div>
            </div>
          </div>

          <div className="card-bd aigen-config-body">
            {/* Prompt Input Box */}
            <div className="aigen-form-group">
              <label htmlFor="ai-prompt-input" className="aigen-label">
                <span>Describe your practice scenario</span>
                <span className="aigen-hint">Natural language engineering prompt</span>
              </label>
              <div className="aigen-textarea-wrap">
                <textarea
                  id="ai-prompt-input"
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Implement a concurrent worker pool in Go with buffered channels, or a custom debounce hook in React..."
                  className="aigen-textarea"
                />
              </div>
            </div>

            {/* Quick Prompt Presets */}
            <div className="aigen-presets-section">
              <span className="aigen-presets-label">
                <Zap size={12} className="aigen-zap-icon" /> Popular Inspirations:
              </span>
              <div className="aigen-presets-chips">
                {PROMPT_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className="aigen-preset-chip"
                    onClick={() => handleSelectPreset(preset)}
                    title={preset.prompt}
                  >
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Language Selection */}
            <div className="aigen-form-group">
              <label className="aigen-label">
                <span>Target Language</span>
                <span className="aigen-hint">Select syntax environment</span>
              </label>
              <div className="aigen-lang-pills">
                {LANGUAGES.filter((l) => l !== 'All').map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={`aigen-lang-pill ${language === l ? 'active' : ''}`}
                    onClick={() => setLanguage(l)}
                  >
                    <span
                      className="aigen-pill-dot"
                      style={{ background: LANG_COLORS[l] || '#2563EB' }}
                    />
                    <span>{l}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Tier */}
            <div className="aigen-form-group">
              <label className="aigen-label">
                <span>Difficulty Tier</span>
                <span className="aigen-hint">Controls algorithmic complexity</span>
              </label>
              <div className="aigen-diff-toggle">
                {DIFFICULTIES.filter((d) => d !== 'All').map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`aigen-diff-btn ${difficulty === d ? 'active' : ''} ${d.toLowerCase()}`}
                    onClick={() => setDifficulty(d)}
                  >
                    <span>{d}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Length & Comments Preferences */}
            <div className="aigen-options-row">
              <div className="aigen-form-group half">
                <label className="aigen-label">
                  <span>Snippet Length</span>
                </label>
                <select
                  value={lengthMode}
                  onChange={(e) => setLengthMode(e.target.value)}
                  className="aigen-select"
                >
                  <option value="compact">Compact (6–10 lines)</option>
                  <option value="balanced">Balanced (12–20 lines)</option>
                  <option value="deep">Deep Drill (22+ lines)</option>
                </select>
              </div>

              <div className="aigen-form-group half">
                <label className="aigen-label">
                  <span>Inline Documentation</span>
                </label>
                <label className="aigen-checkbox-label">
                  <input
                    type="checkbox"
                    checked={includeComments}
                    onChange={(e) => setIncludeComments(e.target.checked)}
                    className="aigen-checkbox"
                  />
                  <span>Include comments & docs</span>
                </label>
              </div>
            </div>

            {/* Primary Generate Button */}
            <button
              type="button"
              className={`aigen-generate-btn ${isGenerating ? 'loading' : ''}`}
              onClick={() => handleGenerate()}
              disabled={isGenerating || !prompt.trim()}
              id="btn-generate-snippet"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={15} className="spin-anim" />
                  <span>Synthesizing Code Snippet...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} className="spark-icon" />
                  <span>Generate Practice Snippet</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── RIGHT PANEL: Live Generated Snippet Studio & Preview ── */}
        <div className="card aigen-preview-card">
          {/* Cupertino Window Chrome Header */}
          <div className="aigen-window-hd">
            <div className="aigen-traffic-lights">
              <span className="dot dot-close" />
              <span className="dot dot-min" />
              <span className="dot dot-max" />
            </div>

            <div className="aigen-window-title">
              <Terminal size={14} className="aigen-term-icon" />
              <span>{generatedSnippet?.title || 'Generated Code Snippet'}</span>
            </div>

            <div className="aigen-window-badges">
              <span className="badge badge-teal">
                <span
                  className="aigen-pill-dot inline"
                  style={{ background: LANG_COLORS[generatedSnippet?.language] || '#2563EB' }}
                />
                {generatedSnippet?.language}
              </span>
              <span
                className={`badge ${
                  generatedSnippet?.difficulty === 'Beginner'
                    ? 'badge-emerald'
                    : generatedSnippet?.difficulty === 'Intermediate'
                    ? 'badge-indigo'
                    : 'badge-amber'
                }`}
              >
                {generatedSnippet?.difficulty}
              </span>
            </div>
          </div>

          <div className="card-bd aigen-preview-body">
            {/* Snippet Description */}
            <div className="aigen-snippet-meta-row">
              <p className="aigen-snippet-desc">
                {generatedSnippet?.description || 'AI-synthesized typing exercise ready for practice.'}
              </p>
              <div className="aigen-snippet-stats">
                <span className="stat-pill">{snippetStats.lines} lines</span>
                <span className="stat-pill">{snippetStats.chars} chars</span>
                <span className="stat-pill">{snippetStats.estTime}</span>
              </div>
            </div>

            {/* Syntax-Highlighted Code Box with Line Numbers */}
            <div className="aigen-code-editor-box">
              <div className="aigen-editor-toolbar">
                <div className="aigen-editor-lang">
                  <Code2 size={13} />
                  <span>{generatedSnippet?.language}</span>
                </div>
                <button
                  type="button"
                  className="aigen-copy-btn"
                  onClick={handleCopyCode}
                  title="Copy code to clipboard"
                >
                  {isCopied ? (
                    <>
                      <Check size={12} color="#10B981" />
                      <span className="copied-text">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="aigen-code-scroll">
                <pre className="aigen-code-pre">
                  <code>
                    {(generatedSnippet?.code || '').split('\n').map((line, idx) => (
                      <div key={idx} className="aigen-code-line">
                        <span className="aigen-line-num">{idx + 1}</span>
                        <span className="aigen-line-text">{line || ' '}</span>
                      </div>
                    ))}
                  </code>
                </pre>
              </div>
            </div>

            {/* Keystroke Mastery Focus Callout */}
            <div className="aigen-focus-callout">
              <div className="aigen-focus-header">
                <ShieldCheck size={14} className="aigen-shield-icon" />
                <span>Typing Drill Focus Points</span>
              </div>
              <p className="aigen-focus-body">
                Reinforces precision on brackets, indentation discipline, lambda operators, and structural tokens specific to {generatedSnippet?.language}.
              </p>
            </div>

            {/* Primary Action Controls */}
            <div className="aigen-action-footer">
              <button
                type="button"
                className="btn btn-primary aigen-practice-btn"
                onClick={handleStartPractice}
                id="btn-start-ai-practice"
              >
                <Play size={14} fill="currentColor" strokeWidth={0} />
                <span>Start Practice Session</span>
                <ArrowRight size={13} className="arrow-launch" />
              </button>

              <button
                type="button"
                className={`btn btn-secondary aigen-save-btn ${isSaved ? 'saved' : ''}`}
                onClick={handleSaveToTemplates}
                disabled={isSaved}
                id="btn-save-ai-template"
              >
                {isSaved ? (
                  <>
                    <CheckCircle2 size={14} color="#10B981" />
                    <span>Saved to My Templates</span>
                  </>
                ) : (
                  <>
                    <Bookmark size={14} />
                    <span>Save to My Templates</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-secondary aigen-tweak-btn"
                onClick={() => handleGenerate()}
                title="Synthesize an alternative version"
                id="btn-regenerate-variant"
              >
                <RefreshCw size={13} />
                <span>Tweak Variant</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent AI Generations History Shelf ── */}
      {historyItems.length > 0 && (
        <div className="card aigen-history-card">
          <div className="card-hd aigen-history-hd">
            <div className="aigen-history-hd-left">
              <History size={15} className="aigen-hist-icon" />
              <h3 className="card-title">Recent Studio Generations</h3>
            </div>
            <span className="aigen-history-count">{historyItems.length} stored</span>
          </div>

          <div className="aigen-history-grid">
            {historyItems.map((item, idx) => (
              <div
                key={item.id || idx}
                className="aigen-history-item"
                onClick={() => handleLoadHistory(item)}
              >
                <div className="aigen-hist-top">
                  <span
                    className="aigen-pill-dot inline"
                    style={{ background: LANG_COLORS[item.language] || '#2563EB' }}
                  />
                  <span className="aigen-hist-lang">{item.language}</span>
                  <span className="aigen-hist-diff">{item.difficulty}</span>
                </div>
                <div className="aigen-hist-title">{item.title}</div>
                <div className="aigen-hist-footer">
                  <span className="aigen-hist-lines">
                    {item.code ? item.code.split('\n').length : 0} lines
                  </span>
                  <button
                    type="button"
                    className="aigen-hist-load-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoadHistory(item);
                    }}
                  >
                    Load into Studio
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
