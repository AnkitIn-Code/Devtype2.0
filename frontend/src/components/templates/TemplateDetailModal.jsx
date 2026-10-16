// src/components/templates/TemplateDetailModal.jsx
import { useEffect, useState, useCallback } from 'react';
import {
  X, Play, Copy, Check, Clock,
  Code2, FileCode2, Star
} from 'lucide-react';
import { estimateTypingTime } from '../../utils/templateStore';
import CodeSnippetPreview from './CodeSnippetPreview';

export default function TemplateDetailModal({
  isOpen,
  template,
  onClose,
  onPractice,
}) {
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
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

  if (!isOpen || !template) return null;

  const { id, title, fileName, language, difficulty, description, code, xp, tags } = template;
  const lineCount = (code || '').split('\n').length;
  const charCount = (code || '').length;
  const estTime = estimateTypingTime(code);
  const displayFileName = fileName || `${title.toLowerCase().replace(/\s+/g, '_')}.${language.toLowerCase()}`;

  const diffBadgeClass =
    difficulty === 'Beginner'
      ? 'badge-emerald'
      : difficulty === 'Advanced'
      ? 'badge-rose'
      : 'badge-indigo';

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code to clipboard', err);
    }
  };

  return (
    <div className="template-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="card template-detail-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`modal-title-${id}`}
      >
        {/* ── Modal Header: matching Dashboard card header ── */}
        <div className="card-hd tdm-header">
          <div className="tdm-header-info">
            <div className="tdm-badges-row">
              <span className="badge badge-teal">
                <Code2 size={13} />
                {language}
              </span>
              <span className={`badge ${diffBadgeClass}`}>{difficulty}</span>
              <span className="xp-pill">
                <Star size={12} fill="currentColor" />
                +{xp || 40} XP
              </span>
            </div>
            <h3 id={`modal-title-${id}`} className="tdm-title">
              {title}
            </h3>
          </div>

          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close modal"
            id="btn-close-detail-modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className="card-bd tdm-body">
          {description && (
            <p className="tdm-desc">{description}</p>
          )}

          {/* Quick Specs Metrics Bar */}
          <div className="tdm-specs-bar">
            <div className="tdm-spec-item">
              <span className="tdm-spec-lbl">CHARACTERS</span>
              <span className="tdm-spec-val">
                <FileCode2 size={14} /> {charCount}
              </span>
            </div>

            <div className="tdm-spec-item">
              <span className="tdm-spec-lbl">TOTAL LINES</span>
              <span className="tdm-spec-val">
                <Code2 size={14} /> {lineCount}
              </span>
            </div>

            <div className="tdm-spec-item">
              <span className="tdm-spec-lbl">EST. SPEED TIME</span>
              <span className="tdm-spec-val">
                <Clock size={14} /> {estTime}
              </span>
            </div>

            <div className="tdm-spec-item">
              <span className="tdm-spec-lbl">FILE NAME</span>
              <span className="tdm-spec-val">{displayFileName}</span>
            </div>
          </div>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="tdm-tags-row">
              {tags.map((tag) => (
                <span key={tag} className="badge badge-neutral">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Code Block Container */}
          <div className="code-block tdm-code-box">
            <CodeSnippetPreview
              code={code}
              language={language}
              maxLines={null}
              showLineNumbers={true}
            />
          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div className="practice-actions tdm-footer">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleCopyCode}
            id="btn-copy-template-code"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>

          <div className="tdm-footer-right" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              id="btn-dismiss-detail-modal"
            >
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onPractice(template)}
              id="btn-launch-practice"
            >
              <Play size={12} fill="currentColor" strokeWidth={0} />
              <span>Start Practice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
