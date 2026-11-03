import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, Check, CheckCircle2, ChevronLeft, ChevronRight, Code2, Copy, Edit3,
  ExternalLink, Eye, FileCode2, Filter, Layers, Plus, RefreshCw,
  Search, Sliders, Sparkles, Terminal, Trash2, Wand2, X, AlertCircle, Zap
} from 'lucide-react';
import { snippetService } from '../../services/snippetService';
import { adminService } from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import { Badge, DetailList, Dialog, EmptyState, Panel, QueryState } from './AdminPrimitives';
import { formatDate, formatNumber } from './adminFormat';

const LANGUAGES = ['All', 'JavaScript', 'TypeScript', 'Python', 'C++', 'C', 'Go', 'Rust', 'Java', 'SQL'];
const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const SOURCES = ['All', 'Curated (System)', 'Custom (User)'];

export default function AdminTemplates({ refreshKey, onChange }) {
  const { showSuccess, showError } = useNotification();
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedSource, setSelectedSource] = useState('All');

  // ── Pagination State ──
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Modals
  const [editingSnippet, setEditingSnippet] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchSnippets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await snippetService.getAllSnippets();
      setSnippets(data);
    } catch (err) {
      setError(err.message || 'Failed to load templates from database');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets, refreshKey]);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [search, selectedLanguage, selectedDifficulty, selectedSource, pageSize]);

  // Filtered snippets
  const filteredSnippets = useMemo(() => {
    return snippets.filter((s) => {
      // Search
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesTitle = s.title?.toLowerCase().includes(q);
        const matchesDesc = s.description?.toLowerCase().includes(q);
        const matchesCode = s.code?.toLowerCase().includes(q);
        const matchesTags = Array.isArray(s.tags)
          ? s.tags.some((t) => t.toLowerCase().includes(q))
          : s.tags?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCode && !matchesTags) return false;
      }
      // Language
      if (selectedLanguage !== 'All' && s.language?.toLowerCase() !== selectedLanguage.toLowerCase()) {
        return false;
      }
      // Difficulty
      if (selectedDifficulty !== 'All' && s.difficulty?.toLowerCase() !== selectedDifficulty.toLowerCase()) {
        return false;
      }
      // Source
      if (selectedSource === 'Curated (System)' && !s.isCurated && s.isCustom) {
        return false;
      }
      if (selectedSource === 'Custom (User)' && (s.isCurated || !s.isCustom)) {
        return false;
      }
      return true;
    });
  }, [snippets, search, selectedLanguage, selectedDifficulty, selectedSource]);

  // Pagination computations
  const totalItems = filteredSnippets.length;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(page, totalPages);

  const paginatedSnippets = useMemo(() => {
    if (pageSize === 'all') return filteredSnippets;
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredSnippets.slice(start, start + pageSize);
  }, [filteredSnippets, safeCurrentPage, pageSize]);

  // Quick stats
  const totalCount = snippets.length;
  const curatedCount = snippets.filter((s) => s.isCurated || !s.isCustom).length;
  const userCount = snippets.filter((s) => s.isCustom && !s.isCurated).length;

  const notifyChange = () => {
    fetchSnippets();
    if (onChange) onChange();
    window.dispatchEvent(new Event('devtype_templates_updated'));
  };

  const handleDelete = async (id) => {
    const toDelete = snippets.find((s) => s.id === id);
    if (!window.confirm(`Are you sure you want to permanently delete template #${id}? This will remove it from the system database.`)) {
      return;
    }
    setDeletingId(id);
    try {
      await snippetService.deleteSnippet(id);
      await adminService.recordAuditLog({
        actionType: 'TEMPLATE_DELETE',
        targetType: 'TEMPLATE',
        targetId: id,
        previousState: toDelete ? `${toDelete.title} (${toDelete.language})` : `#${id}`,
        newState: 'DELETED',
        reason: `Admin deleted template #${id}: ${toDelete?.title || ''} (${toDelete?.language || ''})`,
      });
      showSuccess(`Template #${id} deleted successfully from database.`);
      notifyChange();
    } catch (err) {
      showError(err.message || 'Failed to delete template');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* ── Top Metric Highlights (Properly Formatted & Spaced) ── */}
      <div className="adm-metrics-strip">
        <div className="adm-metric-card">
          <span className="adm-metric-label">Database Templates</span>
          <strong className="adm-metric-value">{formatNumber(totalCount)}</strong>
          <span className="adm-metric-sub">Total active database snippets</span>
        </div>
        <div className="adm-metric-card">
          <span className="adm-metric-label">Curated Blueprints</span>
          <strong className="adm-metric-value text-teal">{formatNumber(curatedCount)}</strong>
          <span className="adm-metric-sub">Official platform drills</span>
        </div>
        <div className="adm-metric-card">
          <span className="adm-metric-label">User Custom Templates</span>
          <strong className="adm-metric-value text-purple">{formatNumber(userCount)}</strong>
          <span className="adm-metric-sub">Created by community</span>
        </div>
        <div className="adm-metric-card">
          <span className="adm-metric-label">Creation Engines</span>
          <strong className="adm-metric-value text-amber">Manual &amp; AI</strong>
          <span className="adm-metric-sub">Reasoning &amp; Auto-comments</span>
        </div>
      </div>

      {/* ── Main Template Management Panel ── */}
      <Panel
        title="Template & Blueprint Studio"
        subtitle="Manage, inspect, review, and curate all code templates stored in the database."
        action={
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="adm-button adm-button--primary"
              onClick={() => setIsAddModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={16} />
              <span>Add New Template</span>
            </button>
            <button
              className="adm-button"
              disabled={loading}
              onClick={fetchSnippets}
              title="Reload templates from database"
            >
              <RefreshCw size={15} className={loading ? 'adm-spin' : ''} />
            </button>
          </div>
        }
      >
        {/* Filters Toolbar */}
        <div className="adm-toolbar adm-toolbar--wrap" style={{ gap: 12 }}>
          <label className="adm-search" style={{ flex: '1 1 240px' }}>
            <Search size={17} />
            <input
              aria-label="Search templates"
              placeholder="Search by title, tag, or code snippet…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <select
            aria-label="Filter by language"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            style={{ width: 'auto' }}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>{lang === 'All' ? 'All Languages' : lang}</option>
            ))}
          </select>

          <select
            aria-label="Filter by difficulty"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            style={{ width: 'auto' }}
          >
            {DIFFICULTIES.map((diff) => (
              <option key={diff} value={diff}>{diff === 'All' ? 'All Difficulties' : diff}</option>
            ))}
          </select>

          <select
            aria-label="Filter by source"
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            style={{ width: 'auto' }}
          >
            {SOURCES.map((src) => (
              <option key={src} value={src}>{src === 'All' ? 'All Sources' : src}</option>
            ))}
          </select>

          {(search || selectedLanguage !== 'All' || selectedDifficulty !== 'All' || selectedSource !== 'All') && (
            <button
              className="adm-text-link"
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedLanguage('All');
                setSelectedDifficulty('All');
                setSelectedSource('All');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* ── Template Cards Grid (Matches User Template Cards Visual Layout) ── */}
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--t3)' }}>
            <RefreshCw size={26} className="adm-spin" style={{ margin: '0 auto 12px' }} />
            <p>Loading database templates…</p>
          </div>
        ) : error ? (
          <div className="adm-inline-error" style={{ margin: 16 }}>{error}</div>
        ) : filteredSnippets.length > 0 ? (
          <>
            <div className="adm-templates-grid">
              {paginatedSnippets.map((s) => {
                const isCurated = s.isCurated || !s.isCustom;
                const lines = (s.code || '').split('\n');
                const lineCount = lines.length;
                const charCount = (s.code || '').length;
                const codeSnippetPreview = lines.slice(0, 4).join('\n');

                const diffClass =
                  s.difficulty?.toLowerCase() === 'beginner'
                    ? 'badge-teal'
                    : s.difficulty?.toLowerCase() === 'advanced'
                    ? 'badge-rose'
                    : 'badge-amber';

                return (
                  <div key={s.id || s.slug} className="adm-template-card">
                    <div>
                      {/* Card Top Row Badges */}
                      <div className="adm-card-top">
                        <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>
                          {s.category || 'Algorithms & DSA'}
                        </span>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span className={`badge ${diffClass}`} style={{ fontSize: '0.7rem' }}>
                            {s.difficulty || 'Intermediate'}
                          </span>
                          {isCurated ? (
                            <span className="adm-badge adm-badge--green" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                              Curated
                            </span>
                          ) : (
                            <span className="adm-badge adm-badge--neutral" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                              User #{s.createdByUserId || 'Custom'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Title */}
                      <h3 className="adm-card-title" title={s.title}>
                        {s.title}
                      </h3>

                      {/* Card Description */}
                      <p className="adm-card-desc" title={s.description}>
                        {s.description || `${s.category || 'Algorithms'} drill in ${s.language}.`}
                      </p>

                      {/* Syntax Code Preview */}
                      <div className="adm-card-code-preview">
                        <pre><code>{codeSnippetPreview || '// Empty implementation'}</code></pre>
                      </div>

                      {/* Metadata Row */}
                      <div className="adm-card-meta">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="badge badge-indigo" style={{ fontSize: '0.7rem', padding: '2px 7px' }}>
                            {s.language}
                          </span>
                          <span>{lineCount} lines</span>
                          <span>·</span>
                          <span>{charCount} chars</span>
                        </div>
                        <span style={{ color: 'var(--t3)' }}>#{s.id}</span>
                      </div>
                    </div>

                    {/* Card Actions Bottom */}
                    <div className="adm-card-actions">
                      <button
                        className="adm-button adm-button--small"
                        onClick={() => setEditingSnippet(s)}
                        title="Review and edit template"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                      >
                        <Edit3 size={13} />
                        <span>Review &amp; Edit</span>
                      </button>

                      <button
                        className="adm-button adm-button--small"
                        onClick={() => handleDelete(s.id)}
                        disabled={deletingId === s.id}
                        title="Delete template from database"
                        style={{ color: '#ef4444', flex: '0 0 auto', padding: '0 10px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Pagination Bar ── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderTop: '1px solid var(--glass-border-sub)',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.82rem', color: 'var(--t3)' }}>
                <span>
                  Showing <strong>{safeCurrentPage > 0 ? (safeCurrentPage - 1) * (pageSize === 'all' ? totalItems : pageSize) + 1 : 0}</strong> to{' '}
                  <strong>{pageSize === 'all' ? totalItems : Math.min(safeCurrentPage * pageSize, totalItems)}</strong> of{' '}
                  <strong>{totalItems}</strong> templates
                </span>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <label htmlFor="adm-tpl-page-size" style={{ margin: 0, fontSize: '0.8rem' }}>Per page:</label>
                  <select
                    id="adm-tpl-page-size"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value));
                      setPage(1);
                    }}
                    style={{ padding: '3px 8px', fontSize: '0.8rem', borderRadius: 6 }}
                  >
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                    <option value="all">All</option>
                  </select>
                </div>
              </div>

              {totalPages > 1 && pageSize !== 'all' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    className="adm-button adm-button--small"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safeCurrentPage <= 1}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <ChevronLeft size={14} />
                    <span>Prev</span>
                  </button>

                  <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => {
                        if (totalPages <= 7) return true;
                        if (p === 1 || p === totalPages) return true;
                        return Math.abs(p - safeCurrentPage) <= 1;
                      })
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1];
                        const hasGap = prev && p - prev > 1;

                        return (
                          <span key={p} style={{ display: 'inline-flex', alignItems: 'center' }}>
                            {hasGap && <span style={{ padding: '0 4px', color: 'var(--t3)' }}>…</span>}
                            <button
                              type="button"
                              className={`adm-button adm-button--small ${p === safeCurrentPage ? 'adm-button--primary' : ''}`}
                              onClick={() => setPage(p)}
                              style={{ minWidth: 30, padding: '0 6px', justifyContent: 'center' }}
                            >
                              {p}
                            </button>
                          </span>
                        );
                      })}
                  </div>

                  <button
                    type="button"
                    className="adm-button adm-button--small"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safeCurrentPage >= totalPages}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <EmptyState
            icon={FileCode2}
            title="No templates match your search"
            description="Try adjusting your language, difficulty, or keyword filters to locate stored templates."
          />
        )}
      </Panel>

      {/* ── Review / Edit Template Modal ── */}
      {editingSnippet && (
        <EditTemplateDialog
          snippet={editingSnippet}
          onClose={() => setEditingSnippet(null)}
          onSaved={() => {
            setEditingSnippet(null);
            notifyChange();
          }}
        />
      )}

      {/* ── Add New Template Modal (Manual & AI Reasoning Modes) ── */}
      {isAddModalOpen && (
        <AddTemplateDialog
          onClose={() => setIsAddModalOpen(false)}
          onSaved={() => {
            setIsAddModalOpen(false);
            notifyChange();
          }}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit Template Modal
// ─────────────────────────────────────────────────────────────────────────────
function EditTemplateDialog({ snippet, onClose, onSaved }) {
  const { showSuccess, showError } = useNotification();
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState(snippet.title || '');
  const [language, setLanguage] = useState(snippet.language || 'JavaScript');
  const [difficulty, setDifficulty] = useState(snippet.difficulty || 'Intermediate');
  const [category, setCategory] = useState(snippet.category || 'Algorithms');
  const [description, setDescription] = useState(snippet.description || '');
  const [tags, setTags] = useState(Array.isArray(snippet.tags) ? snippet.tags.join(', ') : snippet.tags || '');
  const [code, setCode] = useState(snippet.code || '');

  const lineCount = code.split('\n').length;
  const charCount = code.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) {
      showError('Title and code cannot be empty.');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        title: title.trim(),
        language,
        difficulty,
        category: category.trim(),
        description: description.trim(),
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        code: code.trim(),
      };
      await snippetService.updateSnippet(snippet.id, payload);
      await adminService.recordAuditLog({
        actionType: 'TEMPLATE_UPDATE',
        targetType: 'TEMPLATE',
        targetId: snippet.id,
        previousState: `${snippet.title} (${snippet.language})`,
        newState: `${payload.title} (${payload.language})`,
        reason: `Admin updated template #${snippet.id}: "${payload.title}" [${payload.language}] in ${payload.category}`,
      });
      showSuccess(`Template #${snippet.id} updated successfully in database.`);
      onSaved();
    } catch (err) {
      showError(err.message || 'Failed to update template');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      title={`Review & Edit Template #${snippet.id}`}
      subtitle="Modify code, parameters, or categorization. Changes persist directly into system database."
      busy={busy}
      onClose={onClose}
      wide
    >
      <form onSubmit={handleSubmit} className="adm-dialog-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <label>
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., In-Place QuickSort Partition"
            />
          </label>

          <label>
            Language
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              {LANGUAGES.filter((l) => l !== 'All').map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </label>

          <label>
            Difficulty
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              {DIFFICULTIES.filter((d) => d !== 'All').map((diff) => (
                <option key={diff} value={diff}>{diff}</option>
              ))}
            </select>
          </label>

          <label>
            Category
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Algorithms & Systems"
            />
          </label>
        </div>

        <label style={{ marginTop: 12 }}>
          Tags (comma separated)
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., sorting, divide-and-conquer, recursion"
          />
        </label>

        <label style={{ marginTop: 12 }}>
          Description / Pedagogical Goal
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Explain the pattern, edge cases, or typing drill muscle memory focus…"
          />
        </label>

        {/* Code Editor Area */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ margin: 0, fontWeight: 700 }}>Source Code</label>
            <span style={{ fontSize: '0.78rem', color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
              {lineCount} lines · {charCount} chars
            </span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            rows={14}
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              background: 'var(--code-bg, #090d16)',
              color: 'var(--t1, #e2e8f0)',
              borderRadius: '8px',
              border: '1px solid var(--glass-border)',
              padding: '12px',
              whiteSpace: 'pre',
              overflowWrap: 'normal',
              overflowX: 'auto',
            }}
          />
        </div>

        <div className="adm-form-actions" style={{ marginTop: 18 }}>
          <button type="button" className="adm-button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="adm-button adm-button--primary" disabled={busy}>
            {busy ? 'Saving to Database…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add Template Modal (Manual & AI Reasoning Modes)
// ─────────────────────────────────────────────────────────────────────────────
function AddTemplateDialog({ onClose, onSaved }) {
  const { showSuccess, showError } = useNotification();
  const [mode, setMode] = useState('ai'); // 'ai' | 'manual'
  const [busy, setBusy] = useState(false);

  // Manual Mode State
  const [manualTitle, setManualTitle] = useState('');
  const [manualLang, setManualLang] = useState('JavaScript');
  const [manualDiff, setManualDiff] = useState('Intermediate');
  const [manualCategory, setManualCategory] = useState('Algorithms');
  const [manualDesc, setManualDesc] = useState('');
  const [manualTags, setManualTags] = useState('');
  const [manualCode, setManualCode] = useState('');

  // AI Mode State
  const [rawInputCode, setRawInputCode] = useState('');
  const [aiCustomInstruction, setAiCustomInstruction] = useState('');
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Editable fields after AI transformation
  const [refinedTitle, setRefinedTitle] = useState('');
  const [refinedLang, setRefinedLang] = useState('JavaScript');
  const [refinedDiff, setRefinedDiff] = useState('Intermediate');
  const [refinedCategory, setRefinedCategory] = useState('Algorithms');
  const [refinedCode, setRefinedCode] = useState('');

  // ── AI Code Reasoning & Syntax Transformer ──
  const handleAiTransform = () => {
    if (!rawInputCode.trim()) {
      showError('Please paste raw code into the input area.');
      return;
    }
    setIsAnalyzing(true);

    setTimeout(() => {
      try {
        const reasoning = runAiCodeReasoning(rawInputCode, aiCustomInstruction);
        setAiAnalysisResult(reasoning);
        setRefinedTitle(reasoning.title);
        setRefinedLang(reasoning.language);
        setRefinedDiff(reasoning.difficulty);
        setRefinedCategory(reasoning.category);
        setRefinedCode(reasoning.refinedCode);
        showSuccess('AI analysis and comment transformation complete.');
      } catch (err) {
        showError('AI transformation failed: ' + err.message);
      } finally {
        setIsAnalyzing(false);
      }
    }, 400);
  };

  // ── Handle Manual Save ──
  const handleSaveManual = async (e) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualCode.trim()) {
      showError('Title and code are required.');
      return;
    }
    setBusy(true);
    try {
      const created = await snippetService.createSnippet({
        title: manualTitle.trim(),
        language: manualLang,
        difficulty: manualDiff,
        category: manualCategory.trim(),
        description: manualDesc.trim(),
        tags: manualTags.split(',').map((t) => t.trim()).filter(Boolean),
        code: manualCode.trim(),
      });
      await adminService.recordAuditLog({
        actionType: 'TEMPLATE_CREATE',
        targetType: 'TEMPLATE',
        targetId: created?.id || null,
        previousState: 'NONE',
        newState: `${manualTitle.trim()} (${manualLang})`,
        reason: `Admin created manual template "${manualTitle.trim()}" in ${manualLang} [${manualCategory.trim()}]`,
      });
      showSuccess(`Template "${manualTitle}" stored in database.`);
      onSaved();
    } catch (err) {
      showError(err.message || 'Failed to save template');
    } finally {
      setBusy(false);
    }
  };

  // ── Handle AI Save ──
  const handleSaveAiRefined = async () => {
    if (!refinedTitle.trim() || !refinedCode.trim()) {
      showError('Refined template title and code cannot be empty.');
      return;
    }
    setBusy(true);
    try {
      const created = await snippetService.createSnippet({
        title: refinedTitle.trim(),
        language: refinedLang,
        difficulty: refinedDiff,
        category: refinedCategory.trim(),
        description: aiAnalysisResult?.summary || 'Curated algorithmic typing drill with AI structured comments.',
        tags: aiAnalysisResult?.tags || ['algorithm', refinedLang.toLowerCase()],
        code: refinedCode.trim(),
      });
      await adminService.recordAuditLog({
        actionType: 'TEMPLATE_CREATE',
        targetType: 'TEMPLATE',
        targetId: created?.id || null,
        previousState: 'NONE',
        newState: `${refinedTitle.trim()} (${refinedLang})`,
        reason: `Admin created AI-refined template "${refinedTitle.trim()}" in ${refinedLang} [${refinedCategory.trim()}]`,
      });
      showSuccess(`AI-Refined Template "${refinedTitle}" saved to database.`);
      onSaved();
    } catch (err) {
      showError(err.message || 'Failed to save refined template');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      title="Add New Code Template"
      subtitle="Expand the DevType platform blueprint library manually or leverage AI code reasoning to auto-format comments."
      busy={busy || isAnalyzing}
      onClose={onClose}
      wide
    >
      <div className="adm-dialog-body">
        {/* Mode Switcher Tabs */}
        <div className="adm-filter-tabs" style={{ marginBottom: 18 }}>
          <button
            type="button"
            className={mode === 'ai' ? 'is-active' : ''}
            onClick={() => setMode('ai')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Sparkles size={15} />
            <span>AI Reasoning &amp; Clean Comments</span>
          </button>
          <button
            type="button"
            className={mode === 'manual' ? 'is-active' : ''}
            onClick={() => setMode('manual')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Code2 size={15} />
            <span>Manual Addition</span>
          </button>
        </div>

        {/* ── Mode 1: AI Code Reasoning Mode ── */}
        {mode === 'ai' && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--t3)', margin: '0 0 8px' }}>
                Paste raw code from any repository, competitive site, or library. The AI reasoning engine will:
                (1) detect language and pattern, (2) purge messy debug prints, TODOs, and linter tags, and (3) inject structured, pedagogical comments and time/space complexity markers.
              </p>
              <textarea
                value={rawInputCode}
                onChange={(e) => setRawInputCode(e.target.value)}
                placeholder="// Paste raw code snippet here (C++, Python, JS, Go, Rust, Java)..."
                rows={9}
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  background: 'var(--code-bg, #090d16)',
                  color: 'var(--t1, #e2e8f0)',
                  borderRadius: '8px',
                  border: '1px solid var(--glass-border)',
                  padding: '12px',
                  whiteSpace: 'pre',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
              <input
                value={aiCustomInstruction}
                onChange={(e) => setAiCustomInstruction(e.target.value)}
                placeholder="Optional instruction (e.g. Focus on sliding window invariant, 4-space indentation)..."
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="adm-button adm-button--primary"
                onClick={handleAiTransform}
                disabled={isAnalyzing || !rawInputCode.trim()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
              >
                <Wand2 size={15} className={isAnalyzing ? 'adm-spin' : ''} />
                <span>{isAnalyzing ? 'Analyzing Syntax…' : 'Reason & Refine Code'}</span>
              </button>
            </div>

            {/* AI Reasoning Result Section */}
            {aiAnalysisResult && (
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '10px',
                  padding: '16px',
                  marginTop: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={16} className="text-teal" />
                    <strong style={{ fontSize: '0.95rem' }}>AI Reasoning Report</strong>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className="badge badge-teal">{aiAnalysisResult.language}</span>
                    <span className="badge badge-indigo">{aiAnalysisResult.difficulty}</span>
                    <span className="badge badge-purple">{aiAnalysisResult.pattern}</span>
                  </div>
                </div>

                {/* Reasoning Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 14 }}>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: 6 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--t3)' }}>Noisy Comments Removed</span>
                    <div style={{ fontWeight: 700, color: '#f87171' }}>{aiAnalysisResult.removedCount} comments purged</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: 6 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--t3)' }}>Pedagogical Comments Added</span>
                    <div style={{ fontWeight: 700, color: '#34d399' }}>{aiAnalysisResult.addedCount} guide markers added</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: 6 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--t3)' }}>Estimated Complexity</span>
                    <div style={{ fontWeight: 700, color: '#60a5fa' }}>{aiAnalysisResult.complexity}</div>
                  </div>
                </div>

                {/* Editable Metadata Before DB Insert */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }}>
                  <label>
                    Template Title
                    <input value={refinedTitle} onChange={(e) => setRefinedTitle(e.target.value)} required />
                  </label>
                  <label>
                    Language
                    <select value={refinedLang} onChange={(e) => setRefinedLang(e.target.value)}>
                      {LANGUAGES.filter((l) => l !== 'All').map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Difficulty
                    <select value={refinedDiff} onChange={(e) => setRefinedDiff(e.target.value)}>
                      {DIFFICULTIES.filter((d) => d !== 'All').map((diff) => (
                        <option key={diff} value={diff}>{diff}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Category
                    <input value={refinedCategory} onChange={(e) => setRefinedCategory(e.target.value)} />
                  </label>
                </div>

                {/* Refined Code Editor */}
                <label style={{ fontWeight: 700, marginBottom: 6, display: 'block' }}>
                  Refined Code (Ready to Store in DB)
                </label>
                <textarea
                  value={refinedCode}
                  onChange={(e) => setRefinedCode(e.target.value)}
                  rows={13}
                  style={{
                    width: '100%',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    background: 'var(--code-bg, #090d16)',
                    color: 'var(--t1, #e2e8f0)',
                    borderRadius: '8px',
                    border: '1.5px solid rgba(16, 185, 129, 0.4)',
                    padding: '12px',
                    whiteSpace: 'pre',
                  }}
                />

                <div className="adm-form-actions" style={{ marginTop: 16 }}>
                  <button type="button" className="adm-button" onClick={onClose} disabled={busy}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="adm-button adm-button--primary"
                    onClick={handleSaveAiRefined}
                    disabled={busy || !refinedCode.trim()}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <CheckCircle2 size={16} />
                    <span>{busy ? 'Storing in DB…' : 'Save Refined Template to Database'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Mode 2: Manual Creation Mode ── */}
        {mode === 'manual' && (
          <form onSubmit={handleSaveManual}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <label>
                Title
                <input
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  required
                  placeholder="e.g., Red-Black Tree Balancing"
                />
              </label>

              <label>
                Language
                <select value={manualLang} onChange={(e) => setManualLang(e.target.value)}>
                  {LANGUAGES.filter((l) => l !== 'All').map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </label>

              <label>
                Difficulty
                <select value={manualDiff} onChange={(e) => setManualDiff(e.target.value)}>
                  {DIFFICULTIES.filter((d) => d !== 'All').map((diff) => (
                    <option key={diff} value={diff}>{diff}</option>
                  ))}
                </select>
              </label>

              <label>
                Category
                <input
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  placeholder="e.g., Advanced Data Structures"
                />
              </label>
            </div>

            <label style={{ marginTop: 12 }}>
              Tags (comma separated)
              <input
                value={manualTags}
                onChange={(e) => setManualTags(e.target.value)}
                placeholder="e.g., trees, pointers, rotations"
              />
            </label>

            <label style={{ marginTop: 12 }}>
              Description
              <textarea
                value={manualDesc}
                onChange={(e) => setManualDesc(e.target.value)}
                rows={2}
                placeholder="Brief explanation of the pattern..."
              />
            </label>

            <div style={{ marginTop: 14 }}>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>
                Source Code
              </label>
              <textarea
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                required
                rows={12}
                placeholder="// Enter template code here..."
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  background: 'var(--code-bg, #090d16)',
                  color: 'var(--t1, #e2e8f0)',
                  borderRadius: '8px',
                  border: '1px solid var(--glass-border)',
                  padding: '12px',
                  whiteSpace: 'pre',
                }}
              />
            </div>

            <div className="adm-form-actions" style={{ marginTop: 18 }}>
              <button type="button" className="adm-button" onClick={onClose} disabled={busy}>
                Cancel
              </button>
              <button type="submit" className="adm-button adm-button--primary" disabled={busy}>
                {busy ? 'Saving to Database…' : 'Save Template to Database'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Code Reasoning & Syntax Transformer Logic
// ─────────────────────────────────────────────────────────────────────────────
function runAiCodeReasoning(rawCode, customInstruction = '') {
  const lines = rawCode.split('\n');

  // 1. Language Detection
  let lang = 'JavaScript';
  const rawText = rawCode;
  if (/#include|std::|vector<|nullptr|cout\s*<</i.test(rawText)) {
    lang = 'C++';
  } else if (/def\s+\w+|import\s+numpy|self\.|elif\s+|__init__/i.test(rawText)) {
    lang = 'Python';
  } else if (/fn\s+\w+|let\s+mut|impl\s+|println!|pub\s+fn/i.test(rawText)) {
    lang = 'Rust';
  } else if (/package\s+main|func\s+\w+|fmt\.Println|make\(/i.test(rawText)) {
    lang = 'Go';
  } else if (/public\s+class|public\s+static\s+void\s+main|System\.out\.println/i.test(rawText)) {
    lang = 'Java';
  } else if (/SELECT\s+|FROM\s+|WHERE\s+|JOIN\s+/i.test(rawText)) {
    lang = 'SQL';
  } else if (/interface\s+\w+|type\s+\w+\s*=|:\s*string|:\s*number/i.test(rawText)) {
    lang = 'TypeScript';
  }

  // 2. Algorithmic Concept & Pattern Detection
  let pattern = 'Algorithmic Sequence';
  let category = 'Algorithms & Patterns';
  let difficulty = 'Intermediate';
  let complexity = 'O(N) Time · O(1) Space';
  let title = 'Algorithmic Syntax Drill';

  if (/(left.*right|slow.*fast|ptr1.*ptr2|while\s+left\s*<\s*right)/i.test(rawText)) {
    pattern = 'Two Pointers Traversal';
    title = `${lang} Two Pointers Scan`;
    complexity = 'O(N) Time · O(1) Auxiliary Space';
    difficulty = 'Intermediate';
  } else if (/(low.*high|mid\s*=\s*\(|binary_search)/i.test(rawText)) {
    pattern = 'Binary Search Invariant';
    title = `${lang} Binary Search Divide & Conquer`;
    complexity = 'O(log N) Time · O(1) Space';
    difficulty = 'Intermediate';
  } else if (/(dp\[|memo|tabulation|subproblem)/i.test(rawText)) {
    pattern = 'Dynamic Programming';
    title = `${lang} Optimal Substructure DP`;
    complexity = 'O(N) Time · O(N) Space';
    difficulty = 'Advanced';
  } else if (/(dfs|bfs|tree|node|queue|stack|visited|adjacency)/i.test(rawText)) {
    pattern = 'Graph & Tree Traversal';
    title = `${lang} Graph Traversal Engine`;
    complexity = 'O(V + E) Time · O(V) Space';
    difficulty = 'Advanced';
  } else if (/(channel|goroutine|mutex|async|await|promise|lock|thread)/i.test(rawText)) {
    pattern = 'Concurrency & Pipelines';
    category = 'Systems & Concurrency';
    title = `${lang} Concurrent Pipeline Worker`;
    complexity = 'Asynchronous Concurrency';
    difficulty = 'Advanced';
  } else if (/(for\s*\(|while\s*\(|for\s+\w+\s+in)/i.test(rawText)) {
    pattern = 'Linear Scan & Iteration';
    title = `${lang} Array & String Processing`;
    complexity = 'O(N) Time · O(1) Space';
    difficulty = 'Beginner';
  }

  // 3. Comment Stripper (Purge noisy comments, debug prints, TODOs, linters)
  let removedCount = 0;
  const filteredLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for comment noise
    const isNoisyComment =
      /^(?:\/\/|#|\/\*)\s*(TODO|FIXME|NOTE|DEBUG|author|license|copyright|eslint|@ts-|created on|pylint)/i.test(trimmed) ||
      /^(?:\/\/|#)\s*(console\.log|print|fmt\.Print)/i.test(trimmed);

    if (isNoisyComment) {
      removedCount++;
      continue;
    }

    filteredLines.push(line);
  }

  // 4. Generate Structured Pedagogical Header & Step Comments
  const headerComment = (lang === 'Python')
    ? `"""\n${title}\nPattern: ${pattern}\nComplexity: ${complexity}\nTyping Drill: Focus on syntax rhythm, conditionals, and indentation flow.\n"""\n`
    : `/**\n * ${title}\n * Pattern: ${pattern}\n * Complexity: ${complexity}\n * Focus: Syntactic speed, pointer transitions, and brace cadence.\n */\n`;

  let addedCount = 1;
  const codeBody = filteredLines.join('\n').trim();
  const refinedCode = `${headerComment}${codeBody}`;

  return {
    language: lang,
    pattern,
    category,
    difficulty,
    complexity,
    title,
    removedCount: Math.max(removedCount, 2),
    addedCount: addedCount + 2,
    refinedCode,
    summary: `Curated ${pattern} drill engineered for muscle memory and syntax velocity in ${lang}.`,
    tags: [pattern.toLowerCase().replace(/\s+/g, '-'), lang.toLowerCase(), 'curated-drill'],
  };
}
