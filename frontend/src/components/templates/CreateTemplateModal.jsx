// src/components/templates/CreateTemplateModal.jsx
import { useState, useEffect, useCallback } from 'react';
import { X, Play, Sparkles, AlertCircle, Code2 } from 'lucide-react';
import { saveCustomTemplate } from '../../utils/templateStore';

const SUPPORTED_LANGUAGES = [
  'C++',
  'Java',
  'Python',
  'JavaScript',
  'TypeScript',
  'SQL',
  'Rust',
  'Go',
];

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

export default function CreateTemplateModal({
  isOpen,
  onClose,
  onCreated,
}) {
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('JavaScript');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [errors, setErrors] = useState({});

  const handleClose = useCallback(() => {
    setTitle('');
    setLanguage('JavaScript');
    setDifficulty('Intermediate');
    setDescription('');
    setCode('');
    setTagsInput('');
    setErrors({});
    onClose();
  }, [onClose]);

  // Escape key handler
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    },
    [handleClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!title.trim() || title.trim().length < 3) {
      errs.title = 'Title must be at least 3 characters.';
    }
    if (!code.trim() || code.trim().length < 10) {
      errs.code = 'Source code must be at least 10 characters.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (startImmediately = false) => {
    if (!validate()) return;

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newTemplate = saveCustomTemplate({
      title,
      language,
      difficulty,
      description: description || `Custom ${language} practice template.`,
      code,
      tags: parsedTags.length > 0 ? parsedTags : ['Custom'],
    });

    onCreated(newTemplate, startImmediately);
  };

  const codeChars = code.length;
  const codeLines = code ? code.split('\n').length : 0;
  const estXp = Math.max(
    25,
    Math.min(
      100,
      Math.round(
        (codeChars / 15) *
          (difficulty === 'Advanced' ? 1.5 : difficulty === 'Intermediate' ? 1.2 : 1.0)
      )
    )
  );

  return (
    <div className="template-modal-backdrop" onClick={handleClose} role="presentation">
      <div
        className="card create-template-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-create-title"
      >
        {/* ── Modal Header: matching Dashboard card header ── */}
        <div className="card-hd ctm-header">
          <div className="ctm-header-left">
            <div className="stat-icon-wrap cobalt" style={{ width: '36px', height: '36px' }}>
              <Code2 size={18} />
            </div>
            <div>
              <h3 id="modal-create-title" className="card-title">
                New Code Template
              </h3>
              <p className="card-sub">
                Add an algorithm or pattern to your practice library
              </p>
            </div>
          </div>

          <button
            type="button"
            className="icon-btn"
            onClick={handleClose}
            aria-label="Close"
            id="btn-close-create-modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Modal Body Form ── */}
        <form
          className="card-bd ctm-body"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave(false);
          }}
        >
          {/* Row 1: Title & Language */}
          <div className="ctm-grid-2">
            <div className="ctm-form-group">
              <label htmlFor="ctm-title-input" className="ctm-label">
                Template Title <span className="ctm-req">*</span>
              </label>
              <input
                id="ctm-title-input"
                type="text"
                className={`ctm-input ${errors.title ? 'is-error' : ''}`}
                placeholder="e.g. Invert Binary Tree or QuickSort"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
                }}
                maxLength={60}
              />
              {errors.title && (
                <div className="ctm-error-msg">
                  <AlertCircle size={12} />
                  <span>{errors.title}</span>
                </div>
              )}
            </div>

            <div className="ctm-form-group">
              <label htmlFor="ctm-lang-select" className="ctm-label">
                Language <span className="ctm-req">*</span>
              </label>
              <select
                id="ctm-lang-select"
                className="ctm-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Difficulty & Tags */}
          <div className="ctm-grid-2">
            <div className="ctm-form-group">
              <label className="ctm-label">Difficulty Level</label>
              <div className="ctm-diff-segments">
                {DIFFICULTIES.map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    className={`ctm-diff-btn ${difficulty === diff ? 'active' : ''} diff-${diff.toLowerCase()}`}
                    onClick={() => setDifficulty(diff)}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <div className="ctm-form-group">
              <label htmlFor="ctm-tags-input" className="ctm-label">
                Tags (Comma separated)
              </label>
              <input
                id="ctm-tags-input"
                type="text"
                className="ctm-input"
                placeholder="e.g. Trees, DFS, Recursion"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>
          </div>

          {/* Row 3: Description */}
          <div className="ctm-form-group">
            <label htmlFor="ctm-desc-input" className="ctm-label">
              Short Description / Objective
            </label>
            <input
              id="ctm-desc-input"
              type="text"
              className="ctm-input"
              placeholder="Brief summary of the algorithm, complexity, or goal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={140}
            />
          </div>

          {/* Row 4: Code Editor / Textarea */}
          <div className="ctm-form-group">
            <div className="ctm-code-label-row">
              <label htmlFor="ctm-code-input" className="ctm-label">
                Source Code <span className="ctm-req">*</span>
              </label>
              <div className="ctm-code-live-stats">
                <span>{codeLines} lines</span>
                <span>&bull;</span>
                <span>{codeChars} chars</span>
                <span>&bull;</span>
                <span className="ctm-xp-preview">
                  <Sparkles size={11} /> +{estXp} XP
                </span>
              </div>
            </div>

            <div className={`ctm-code-box ${errors.code ? 'is-error' : ''}`}>
              <div className="ctm-code-topbar">
                <span className="ctm-code-tag">
                  <Code2 size={12} />
                  <span>{language}</span>
                </span>
              </div>
              <textarea
                id="ctm-code-input"
                className="ctm-code-textarea"
                placeholder={`// Enter clean ${language} code for practice...\nfunction example() {\n  return true;\n}`}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (errors.code) setErrors((prev) => ({ ...prev, code: null }));
                }}
                rows={8}
                spellCheck={false}
              />
            </div>
            {errors.code && (
              <div className="ctm-error-msg">
                <AlertCircle size={12} />
                <span>{errors.code}</span>
              </div>
            )}
          </div>

          {/* ── Modal Footer Actions ── */}
          <div className="practice-actions ctm-footer">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleClose}
              id="btn-cancel-create"
            >
              Cancel
            </button>

            <div className="ctm-footer-right" style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleSave(false)}
                id="btn-save-template-only"
              >
                Save to Catalog
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleSave(true)}
                id="btn-save-and-practice"
              >
                <Play size={12} fill="currentColor" strokeWidth={0} />
                <span>Save &amp; Practice</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
