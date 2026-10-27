// src/components/common/PracticeShortcutsModal.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Search,
  FileCode2,
  Brain,
  Terminal,
  Check,
  Sparkles,
  Layers,
  ChevronRight,
  Clock,
  Code2,
  ExternalLink,
  Flame,
  AlertCircle
} from 'lucide-react';
import { useShortcuts } from '../../utils/shortcutsStore';
import { PREDEFINED_BLUEPRINTS } from '../../data/predefinedBlueprints';
import srsService from '../../services/srsService';

const LANG_COLORS = {
  'C++': { bg: 'rgba(59, 130, 246, 0.12)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.25)' },
  cpp: { bg: 'rgba(59, 130, 246, 0.12)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.25)' },
  C: { bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8', border: 'rgba(99, 102, 241, 0.25)' },
  Java: { bg: 'rgba(239, 68, 68, 0.12)', text: '#f87171', border: 'rgba(239, 68, 68, 0.25)' },
  Python: { bg: 'rgba(16, 185, 129, 0.12)', text: '#34d399', border: 'rgba(16, 185, 129, 0.25)' },
  python: { bg: 'rgba(16, 185, 129, 0.12)', text: '#34d399', border: 'rgba(16, 185, 129, 0.25)' },
  JavaScript: { bg: 'rgba(245, 158, 11, 0.12)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.25)' },
  javascript: { bg: 'rgba(245, 158, 11, 0.12)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.25)' },
  TypeScript: { bg: 'rgba(14, 165, 233, 0.12)', text: '#38bdf8', border: 'rgba(14, 165, 233, 0.25)' },
  typescript: { bg: 'rgba(14, 165, 233, 0.12)', text: '#38bdf8', border: 'rgba(14, 165, 233, 0.25)' },
  Rust: { bg: 'rgba(249, 115, 22, 0.12)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.25)' },
  rust: { bg: 'rgba(249, 115, 22, 0.12)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.25)' },
  Go: { bg: 'rgba(6, 182, 212, 0.12)', text: '#22d3ee', border: 'rgba(6, 182, 212, 0.25)' },
  go: { bg: 'rgba(6, 182, 212, 0.12)', text: '#22d3ee', border: 'rgba(6, 182, 212, 0.25)' },
  SQL: { bg: 'rgba(168, 85, 247, 0.12)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.25)' },
  sql: { bg: 'rgba(168, 85, 247, 0.12)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.25)' },
};

function getLangBadgeStyle(lang) {
  return LANG_COLORS[lang] || {
    bg: 'rgba(255, 255, 255, 0.08)',
    text: 'var(--t2)',
    border: 'var(--glass-border-sub)',
  };
}

export default function PracticeShortcutsModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { shortcuts, addShortcut, removeShortcut, reorderShortcuts, resetShortcuts, maxShortcuts } = useShortcuts();

  const [activeTab, setActiveTab] = useState('templates'); // 'templates' | 'srs' | 'custom'
  const [searchQuery, setSearchQuery] = useState('');
  const [templateLangSelections, setTemplateLangSelections] = useState({});
  const [customSnippets, setCustomSnippets] = useState([]);
  const [srsCards, setSrsCards] = useState([]);
  const [bannerNotice, setBannerNotice] = useState(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load SRS and Custom Studio templates when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Load custom studio items
    try {
      const raw = localStorage.getItem('devtype_custom_templates');
      if (raw) {
        const parsed = JSON.parse(raw);
        setCustomSnippets(Array.isArray(parsed) ? parsed : []);
      } else {
        setCustomSnippets([]);
      }
    } catch {
      setCustomSnippets([]);
    }

    // Load SRS cards
    try {
      const deck = srsService.getLocalDeck();
      setSrsCards(Array.isArray(deck) ? deck : []);
    } catch {
      setSrsCards([]);
    }
  }, [isOpen]);

  // Notice helper with auto-clear
  const showNotice = (msg, isError = false) => {
    setBannerNotice({ text: msg, isError });
    setTimeout(() => {
      setBannerNotice(null);
    }, 3500);
  };

  // Helper to check if a specific item is already pinned
  const isPinned = (targetId, lang) => {
    return shortcuts.some((s) => {
      if (s.targetId === targetId || s.id === targetId) {
        if (!lang) return true;
        return String(s.lang).toLowerCase() === String(lang).toLowerCase();
      }
      return false;
    });
  };

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PREDEFINED_BLUEPRINTS.filter((t) => {
      if (!q) return true;
      const matchTitle = t.title?.toLowerCase().includes(q);
      const matchCat = t.category?.toLowerCase().includes(q);
      const matchTags = Array.isArray(t.tags) && t.tags.some((tag) => tag.toLowerCase().includes(q));
      const matchLang = Object.keys(t.variants || {}).some((l) => l.toLowerCase().includes(q));
      return matchTitle || matchCat || matchTags || matchLang;
    });
  }, [searchQuery]);

  // Filtered SRS Cards
  const filteredSrsCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return srsCards.filter((card) => {
      if (!q) return true;
      const matchTitle = card.title?.toLowerCase().includes(q);
      const matchCat = card.category?.toLowerCase().includes(q);
      const matchLang = card.language?.toLowerCase().includes(q);
      return matchTitle || matchCat || matchLang;
    });
  }, [srsCards, searchQuery]);

  // Filtered Custom Snippets
  const filteredCustomSnippets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return customSnippets.filter((item) => {
      if (!q) return true;
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchLang = item.language?.toLowerCase().includes(q);
      const matchDiff = item.difficulty?.toLowerCase().includes(q);
      return matchTitle || matchLang || matchDiff;
    });
  }, [customSnippets, searchQuery]);

  // Handlers to Add Shortcuts
  const handleAddTemplate = (template) => {
    const chosenLang = templateLangSelections[template.id] || (template.variants ? Object.keys(template.variants)[0] : 'C++');
    const slug = template.slug || template.id;
    const shortcutItem = {
      id: `shortcut-tpl-${slug}-${chosenLang.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      name: template.title,
      lang: chosenLang,
      source: 'template',
      targetId: slug,
      to: `/practice?snippet=${slug}&lang=${encodeURIComponent(chosenLang)}`,
    };

    const res = addShortcut(shortcutItem);
    if (!res.success) {
      showNotice(res.message, true);
    } else {
      showNotice(`Pinned "${template.title}" (${chosenLang}) to shortcuts.`);
    }
  };

  const handleAddSrsCard = (card) => {
    const cardLang = card.language || 'C++';
    const targetId = card.snippetId || String(card.id);
    const shortcutItem = {
      id: `shortcut-srs-${card.id}`,
      name: card.title,
      lang: cardLang,
      source: 'srs',
      targetId: targetId,
      to: `/practice?snippet=${targetId}&lang=${encodeURIComponent(cardLang)}&srsCardId=${card.id}`,
    };

    const res = addShortcut(shortcutItem);
    if (!res.success) {
      showNotice(res.message, true);
    } else {
      showNotice(`Pinned SRS card "${card.title}" to shortcuts.`);
    }
  };

  const handleAddCustomSnippet = (snip) => {
    const snipLang = snip.language || 'C++';
    const shortcutItem = {
      id: `shortcut-custom-${snip.id}`,
      name: snip.title,
      lang: snipLang,
      source: 'custom',
      targetId: snip.id,
      to: `/practice?snippet=${snip.id}&lang=${encodeURIComponent(snipLang)}&lockLang=true`,
    };

    const res = addShortcut(shortcutItem);
    if (!res.success) {
      showNotice(res.message, true);
    } else {
      showNotice(`Pinned custom blueprint "${snip.title}" to shortcuts.`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="shortcuts-modal-overlay" onClick={onClose}>
      <div
        className="shortcuts-modal-panel card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-modal-title"
      >
        {/* ── Modal Header ── */}
        <div className="shortcuts-modal-header">
          <div className="shortcuts-modal-header-left">
            <div className="shortcuts-header-icon-wrap">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 id="shortcuts-modal-title" className="shortcuts-modal-title">
                Manage Practice Shortcuts
              </h2>
              <p className="shortcuts-modal-subtitle">
                Pin verified drills from Algorithmic Blueprints, SRS Memory Decks, or Custom Studio.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="icon-btn shortcuts-close-btn"
            onClick={onClose}
            aria-label="Close shortcuts modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Notification Banner (if any) ── */}
        {bannerNotice && (
          <div className={`shortcuts-banner ${bannerNotice.isError ? 'is-error' : 'is-success'}`}>
            <AlertCircle size={15} />
            <span>{bannerNotice.text}</span>
          </div>
        )}

        {/* ── Section 1: Active Shortcuts (Reorder & Revoke) ── */}
        <div className="shortcuts-active-section">
          <div className="shortcuts-section-top">
            <div className="shortcuts-section-title-wrap">
              <span className="shortcuts-section-title">Active Sidebar Shortcuts</span>
              <span className="shortcuts-capacity-badge">
                {shortcuts.length} / {maxShortcuts} Pinned
              </span>
            </div>
            {shortcuts.length > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-xs shortcuts-reset-btn"
                onClick={() => {
                  resetShortcuts();
                  showNotice('Reset shortcuts to default catalog items.');
                }}
                title="Restore default shortcuts"
              >
                <RotateCcw size={12} />
                <span>Reset Defaults</span>
              </button>
            )}
          </div>

          {shortcuts.length === 0 ? (
            <div className="shortcuts-empty-active">
              <p>No active shortcuts pinned. Choose from the categories below to pin drills to your sidebar.</p>
            </div>
          ) : (
            <div className="shortcuts-active-list">
              {shortcuts.map((item, index) => {
                const style = getLangBadgeStyle(item.lang);
                const SourceIcon = item.source === 'srs' ? Brain : item.source === 'custom' ? Terminal : FileCode2;
                const sourceLabel = item.source === 'srs' ? 'SRS Deck' : item.source === 'custom' ? 'Custom Studio' : 'Template';

                return (
                  <div key={item.id} className="shortcuts-active-item">
                    {/* Reorder Up / Down */}
                    <div className="shortcuts-reorder-group">
                      <button
                        type="button"
                        className="shortcuts-reorder-btn"
                        disabled={index === 0}
                        onClick={() => reorderShortcuts(index, index - 1)}
                        title="Move Up"
                        aria-label="Move Up"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        className="shortcuts-reorder-btn"
                        disabled={index === shortcuts.length - 1}
                        onClick={() => reorderShortcuts(index, index + 1)}
                        title="Move Down"
                        aria-label="Move Down"
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>

                    {/* Source Icon */}
                    <div className="shortcuts-item-icon-wrap">
                      <SourceIcon size={14} />
                    </div>

                    {/* Info */}
                    <div className="shortcuts-item-info">
                      <span className="shortcuts-item-name">{item.name}</span>
                      <div className="shortcuts-item-meta">
                        <span
                          className="shortcuts-item-lang-pill"
                          style={{
                            backgroundColor: style.bg,
                            color: style.text,
                            borderColor: style.border,
                          }}
                        >
                          {item.lang}
                        </span>
                        <span className="shortcuts-item-source-tag">{sourceLabel}</span>
                      </div>
                    </div>

                    {/* Revoke / Remove button */}
                    <button
                      type="button"
                      className="shortcuts-revoke-btn"
                      onClick={() => {
                        removeShortcut(item.id);
                        showNotice(`Removed "${item.name}" from shortcuts.`);
                      }}
                      title="Remove shortcut"
                      aria-label={`Remove ${item.name} shortcut`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Section 2: Browse Templates Across 3 Separated Sources ── */}
        <div className="shortcuts-browse-section">
          {/* Tabs */}
          <div className="shortcuts-tabs-row">
            <button
              type="button"
              className={`shortcuts-tab-btn ${activeTab === 'templates' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('templates')}
            >
              <FileCode2 size={15} />
              <span>Algorithmic Templates ({PREDEFINED_BLUEPRINTS.length})</span>
            </button>
            <button
              type="button"
              className={`shortcuts-tab-btn ${activeTab === 'srs' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('srs')}
            >
              <Brain size={15} />
              <span>SRS Revision Deck ({srsCards.length})</span>
            </button>
            <button
              type="button"
              className={`shortcuts-tab-btn ${activeTab === 'custom' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('custom')}
            >
              <Terminal size={15} />
              <span>Custom Studio ({customSnippets.length})</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="shortcuts-search-wrap">
            <Search size={15} className="shortcuts-search-icon" />
            <input
              type="text"
              className="shortcuts-search-input"
              placeholder={
                activeTab === 'templates'
                  ? 'Search algorithmic blueprints by title, category, or language...'
                  : activeTab === 'srs'
                  ? 'Search SRS cards by title or category...'
                  : 'Search your custom blueprints...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="shortcuts-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Tab 1 Content: Predefined Templates */}
          {activeTab === 'templates' && (
            <div className="shortcuts-catalog-scroll">
              {filteredTemplates.length === 0 ? (
                <div className="shortcuts-tab-empty">
                  <p>No algorithmic blueprints found matching "{searchQuery}".</p>
                </div>
              ) : (
                filteredTemplates.map((template) => {
                  const availableLangs = template.variants ? Object.keys(template.variants) : ['C++'];
                  const selectedLang = templateLangSelections[template.id] || availableLangs[0] || 'C++';
                  const alreadyPinned = isPinned(template.slug || template.id, selectedLang);

                  return (
                    <div key={template.id} className="shortcuts-catalog-card">
                      <div className="shortcuts-catalog-card-left">
                        <div className="shortcuts-catalog-title-row">
                          <span className="shortcuts-catalog-title">{template.title}</span>
                          <span className="shortcuts-catalog-category">{template.category}</span>
                          <span className="shortcuts-catalog-diff">{template.difficulty}</span>
                        </div>
                        <p className="shortcuts-catalog-desc">{template.description}</p>
                      </div>

                      <div className="shortcuts-catalog-card-right">
                        {/* Language Selection if template supports multiple */}
                        {availableLangs.length > 1 && (
                          <select
                            className="shortcuts-lang-select"
                            value={selectedLang}
                            onChange={(e) =>
                              setTemplateLangSelections((prev) => ({
                                ...prev,
                                [template.id]: e.target.value,
                              }))
                            }
                            aria-label={`Language for ${template.title}`}
                          >
                            {availableLangs.map((lang) => (
                              <option key={lang} value={lang}>
                                {lang}
                              </option>
                            ))}
                          </select>
                        )}
                        {availableLangs.length === 1 && (
                          <span
                            className="shortcuts-item-lang-pill"
                            style={getLangBadgeStyle(selectedLang)}
                          >
                            {selectedLang}
                          </span>
                        )}

                        <button
                          type="button"
                          className={`btn btn-xs ${alreadyPinned ? 'btn-ghost' : 'btn-primary'} shortcuts-add-btn`}
                          onClick={() => handleAddTemplate(template)}
                          disabled={alreadyPinned || shortcuts.length >= maxShortcuts}
                        >
                          {alreadyPinned ? (
                            <>
                              <Check size={12} />
                              <span>Pinned</span>
                            </>
                          ) : (
                            <>
                              <Plus size={12} />
                              <span>Pin Shortcut</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 2 Content: SRS Revision Deck */}
          {activeTab === 'srs' && (
            <div className="shortcuts-catalog-scroll">
              {filteredSrsCards.length === 0 ? (
                <div className="shortcuts-tab-empty">
                  <Brain size={24} style={{ color: 'var(--brand)', marginBottom: 8 }} />
                  <p>
                    {searchQuery
                      ? `No SRS recall cards found matching "${searchQuery}".`
                      : 'No spaced repetition recall cards active in your deck yet.'}
                  </p>
                </div>
              ) : (
                filteredSrsCards.map((card) => {
                  const cardLang = card.language || 'C++';
                  const alreadyPinned = isPinned(card.snippetId || String(card.id), cardLang);

                  return (
                    <div key={card.id} className="shortcuts-catalog-card">
                      <div className="shortcuts-catalog-card-left">
                        <div className="shortcuts-catalog-title-row">
                          <span className="shortcuts-catalog-title">{card.title}</span>
                          <span className="shortcuts-catalog-category">{card.category || 'Algorithms & DSA'}</span>
                          <span className="shortcuts-srs-interval-pill">
                            <Clock size={11} /> Interval: {card.intervalDays || 1}d
                          </span>
                        </div>
                        <p className="shortcuts-catalog-desc">
                          Spaced Repetition drill (Repetition {card.repetition || 0} · Ease: {card.easeFactor || '2.50'})
                        </p>
                      </div>

                      <div className="shortcuts-catalog-card-right">
                        <span
                          className="shortcuts-item-lang-pill"
                          style={getLangBadgeStyle(cardLang)}
                        >
                          {cardLang}
                        </span>

                        <button
                          type="button"
                          className={`btn btn-xs ${alreadyPinned ? 'btn-ghost' : 'btn-primary'} shortcuts-add-btn`}
                          onClick={() => handleAddSrsCard(card)}
                          disabled={alreadyPinned || shortcuts.length >= maxShortcuts}
                        >
                          {alreadyPinned ? (
                            <>
                              <Check size={12} />
                              <span>Pinned</span>
                            </>
                          ) : (
                            <>
                              <Plus size={12} />
                              <span>Pin Shortcut</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 3 Content: Custom Studio Blueprints */}
          {activeTab === 'custom' && (
            <div className="shortcuts-catalog-scroll">
              {customSnippets.length === 0 ? (
                <div className="shortcuts-tab-empty">
                  <Terminal size={24} style={{ color: 'var(--brand)', marginBottom: 8 }} />
                  <p style={{ fontWeight: 600, color: 'var(--t1)' }}>No Custom Blueprints Found</p>
                  <p style={{ fontSize: '0.84rem', color: 'var(--t3)', maxWidth: 360, margin: '4px auto 16px' }}>
                    You haven't crafted custom code blueprints in Custom Studio yet. Create tailored drills to pin them to your sidebar.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      onClose();
                      navigate('/custom-studio');
                    }}
                  >
                    <Plus size={14} />
                    <span>Open Custom Studio</span>
                  </button>
                </div>
              ) : filteredCustomSnippets.length === 0 ? (
                <div className="shortcuts-tab-empty">
                  <p>No custom blueprints match "{searchQuery}".</p>
                </div>
              ) : (
                filteredCustomSnippets.map((snip) => {
                  const snipLang = snip.language || 'C++';
                  const alreadyPinned = isPinned(snip.id, snipLang);

                  return (
                    <div key={snip.id} className="shortcuts-catalog-card">
                      <div className="shortcuts-catalog-card-left">
                        <div className="shortcuts-catalog-title-row">
                          <span className="shortcuts-catalog-title">{snip.title}</span>
                          <span className="shortcuts-catalog-category">Custom Studio</span>
                          <span className="shortcuts-catalog-diff">{snip.difficulty || 'Custom'}</span>
                        </div>
                        <p className="shortcuts-catalog-desc" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                          {snip.code ? snip.code.split('\n')[0].substring(0, 60) : 'Custom Drill'}
                        </p>
                      </div>

                      <div className="shortcuts-catalog-card-right">
                        <span
                          className="shortcuts-item-lang-pill"
                          style={getLangBadgeStyle(snipLang)}
                        >
                          {snipLang}
                        </span>

                        <button
                          type="button"
                          className={`btn btn-xs ${alreadyPinned ? 'btn-ghost' : 'btn-primary'} shortcuts-add-btn`}
                          onClick={() => handleAddCustomSnippet(snip)}
                          disabled={alreadyPinned || shortcuts.length >= maxShortcuts}
                        >
                          {alreadyPinned ? (
                            <>
                              <Check size={12} />
                              <span>Pinned</span>
                            </>
                          ) : (
                            <>
                              <Plus size={12} />
                              <span>Pin Shortcut</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="shortcuts-modal-footer">
          <span className="shortcuts-footer-hint">
            Shortcuts are synced instantly to your DevType sidebar workspace.
          </span>
          <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
}
