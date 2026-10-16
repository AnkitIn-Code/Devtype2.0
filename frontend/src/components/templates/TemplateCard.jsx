// src/components/templates/TemplateCard.jsx
import { Code2, Clock, Play, Eye, Star, FileCode2, Terminal } from 'lucide-react';
import { LANG_COLORS, DIFFICULTY_CONFIG, estimateTypingTime } from '../../utils/templateStore';
import CodeSnippetPreview from './CodeSnippetPreview';

export default function TemplateCard({
  template,
  onSelect,
  onPractice,
  isListView = false,
}) {
  const { id, title, fileName, language, difficulty, description, code, xp, tags } = template;

  const langColor = LANG_COLORS[language] || '#2563EB';
  const diffConfig = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.Intermediate;
  const lineCount = (code || '').split('\n').length;
  const charCount = (code || '').length;
  const estTime = estimateTypingTime(code);
  const displayFileName = fileName || `${title.toLowerCase().replace(/\s+/g, '_')}.${language.toLowerCase()}`;

  const handleCardClick = (e) => {
    if (e.target.closest('.tc-btn-practice')) return;
    onSelect(template);
  };

  return (
    <div
      className={`template-glass-card ${isListView ? 'tc-list-view' : 'tc-grid-view'}`}
      onClick={handleCardClick}
      id={`template-card-${id}`}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(template);
        }
      }}
    >
      {/* ── Top Bar: Language & Badges ── */}
      <div className="tc-header">
        <div className="tc-file-identity">
          <div
            className="tc-lang-monogram"
            style={{
              backgroundColor: `${langColor}14`,
              borderColor: `${langColor}2e`,
              color: langColor,
            }}
          >
            <span className="tc-lang-pip" style={{ backgroundColor: langColor }} />
            <span>{language}</span>
          </div>

          <span className="tc-filename-label" title={displayFileName}>
            <Terminal size={12} className="tc-term-icon" />
            <span>{displayFileName}</span>
          </span>
        </div>

        <div className="tc-badges-right">
          <span
            className="tc-diff-pill"
            style={{
              color: diffConfig.color,
              backgroundColor: diffConfig.bg,
              borderColor: diffConfig.border,
            }}
          >
            {difficulty}
          </span>

          <span className="tc-xp-pill">
            <Star size={11} fill="currentColor" />
            <span>+{xp || 40} XP</span>
          </span>
        </div>
      </div>

      {/* ── Title, Domain Tags & Description ── */}
      <div className="tc-body">
        <h3 className="tc-title" title={title}>
          {title}
        </h3>

        {/* Domain Tags */}
        {tags && tags.length > 0 && (
          <div className="tc-tags-row">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="tc-domain-tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        <p className="tc-desc" title={description}>
          {description}
        </p>

        {/* Stats Row */}
        <div className="tc-meta-row">
          <span className="tc-meta-item">
            <FileCode2 size={12} className="tc-meta-icon" />
            <span>{charCount} chars</span>
          </span>
          <span className="tc-meta-dot">&bull;</span>
          <span className="tc-meta-item">
            <Code2 size={12} className="tc-meta-icon" />
            <span>{lineCount} lines</span>
          </span>
          <span className="tc-meta-dot">&bull;</span>
          <span className="tc-meta-item">
            <Clock size={12} className="tc-meta-icon" />
            <span>{estTime}</span>
          </span>
        </div>
      </div>

      {/* ── Code Preview Box ── */}
      <div className="tc-preview-box">
        <div className="tc-window-header" aria-hidden="true">
          <span className="tc-window-title">{displayFileName}</span>
          <span className="tc-window-lang">{language}</span>
        </div>

        <CodeSnippetPreview
          code={code}
          language={language}
          maxLines={isListView ? 3 : 4}
          showLineNumbers={true}
        />
      </div>

      {/* ── Action Buttons ── */}
      <div className="tc-footer">
        <button
          type="button"
          className="tc-btn-view"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(template);
          }}
          title="Inspect full snippet"
          id={`btn-view-${id}`}
        >
          <Eye size={14} strokeWidth={2} />
          <span>Inspect</span>
        </button>

        <button
          type="button"
          className="tc-btn-practice"
          onClick={(e) => {
            e.stopPropagation();
            onPractice(template);
          }}
          title="Start practice session"
          id={`btn-practice-${id}`}
        >
          <Play size={13} fill="currentColor" strokeWidth={0} />
          <span>Start Practice</span>
        </button>
      </div>
    </div>
  );
}
