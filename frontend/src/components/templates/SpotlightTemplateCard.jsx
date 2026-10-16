// src/components/templates/SpotlightTemplateCard.jsx
import { Zap, Play, Eye, Star, FileCode2, Clock, Code2 } from 'lucide-react';
import { estimateTypingTime } from '../../utils/templateStore';
import CodeSnippetPreview from './CodeSnippetPreview';

export default function SpotlightTemplateCard({
  template,
  onSelect,
  onPractice,
}) {
  if (!template) return null;

  const { title, fileName, language, difficulty, description, code, xp, tags } = template;
  const lineCount = (code || '').split('\n').length;
  const charCount = (code || '').length;
  const estTime = estimateTypingTime(code);
  const displayFileName = fileName || 'lru_cache.cpp';

  return (
    <section className="spotlight-glass-hero" aria-label="Spotlight template of the day">
      <div className="sgh-inner">
        {/* Left Information & Actions */}
        <div className="sgh-left">
          <div className="sgh-badge-row">
            <span className="sgh-badge">
              <Zap size={13} className="sgh-zap-icon" />
              <span>Featured Challenge</span>
            </span>
            <span className="sgh-xp-pill">
              <Star size={12} fill="currentColor" />
              +{xp || 150} XP
            </span>
          </div>

          <h2 className="sgh-title">{title}</h2>
          <p className="sgh-desc">{description}</p>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="sgh-tags-row">
              {tags.map((tag) => (
                <span key={tag} className="sgh-tag-pill">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Quick Specs */}
          <div className="sgh-specs-row">
            <span className="sgh-spec">
              <Code2 size={13} />
              <strong>{language}</strong>
            </span>
            <span className="sgh-spec-dot">&bull;</span>
            <span className="sgh-spec">
              <span>{difficulty}</span>
            </span>
            <span className="sgh-spec-dot">&bull;</span>
            <span className="sgh-spec">
              <FileCode2 size={13} />
              <span>{charCount} chars</span>
            </span>
            <span className="sgh-spec-dot">&bull;</span>
            <span className="sgh-spec">
              <span>{lineCount} lines</span>
            </span>
            <span className="sgh-spec-dot">&bull;</span>
            <span className="sgh-spec">
              <Clock size={13} />
              <span>{estTime}</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="sgh-actions-row">
            <button
              type="button"
              className="sgh-btn-practice"
              onClick={() => onPractice(template)}
              id="btn-spotlight-start"
            >
              <Play size={14} fill="currentColor" strokeWidth={0} />
              <span>Start Challenge</span>
            </button>

            <button
              type="button"
              className="sgh-btn-inspect"
              onClick={() => onSelect(template)}
              id="btn-spotlight-inspect"
            >
              <Eye size={14} strokeWidth={2} />
              <span>Inspect Blueprint</span>
            </button>
          </div>
        </div>

        {/* Right Preview Editor Window */}
        <div className="sgh-right">
          <div className="sgh-code-window">
            <div className="sgh-window-titlebar">
              <span className="sgh-window-filename">{displayFileName}</span>
              <span className="sgh-window-lang">{language}</span>
            </div>

            <div className="sgh-window-body">
              <CodeSnippetPreview
                code={code}
                language={language}
                maxLines={7}
                showLineNumbers={true}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
