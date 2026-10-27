// src/pages/Templates.jsx
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Sparkles, LayoutGrid, Layers,
  Play, BookOpen, Code2, Cpu, Globe, Database,
  Lock, CheckCircle2, ChevronRight, Eye, ShieldAlert,
  Flame, Terminal, Zap, ArrowRight, Filter
} from 'lucide-react';
import { PREDEFINED_BLUEPRINTS } from '../data/predefinedBlueprints';
import { templateService } from '../services/templateService';

export default function Templates() {
  const navigate = useNavigate();

  // Active Blueprints Catalog
  const [blueprints, setBlueprints] = useState(PREDEFINED_BLUEPRINTS);
  const [isLoading, setIsLoading] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'categorized'

  // Modals State
  const [selectedBlueprint, setSelectedBlueprint] = useState(null);
  const [chosenLang, setChosenLang] = useState('C++');
  const [previewBlueprint, setPreviewBlueprint] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Load server templates if available, merge with predefined blueprints
  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      setIsLoading(true);
      try {
        const result = await templateService.getTemplates({ size: 100 });
        if (isMounted && result?.items && result.items.length > 0) {
          // Predefined catalog is the primary foundation
          setBlueprints(PREDEFINED_BLUEPRINTS);
        }
      } catch (err) {
        console.warn('Using local authoritative blueprints catalog:', err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Distinct Categories
  const categories = useMemo(() => {
    const set = new Set();
    blueprints.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return ['All', ...Array.from(set)];
  }, [blueprints]);

  // Distinct Languages
  const languagesList = useMemo(() => {
    const set = new Set();
    blueprints.forEach((b) => {
      (b.languages || []).forEach((l) => set.add(l));
    });
    return ['All', ...Array.from(set)];
  }, [blueprints]);

  // Filtered Blueprints
  const filteredBlueprints = useMemo(() => {
    return blueprints.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        (b.languages || []).some((l) => l.toLowerCase().includes(q));

      const matchesCat =
        selectedCategory === 'All' || b.category === selectedCategory;

      const matchesDiff =
        selectedDifficulty === 'All' ||
        b.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();

      const matchesLang =
        selectedLanguage === 'All' ||
        (b.languages || []).includes(selectedLanguage);

      return matchesSearch && matchesCat && matchesDiff && matchesLang;
    });
  }, [blueprints, searchQuery, selectedCategory, selectedDifficulty, selectedLanguage]);

  // Categorized Blueprints Map
  const categorizedBlueprints = useMemo(() => {
    const map = {};
    filteredBlueprints.forEach((b) => {
      const cat = b.category || 'General';
      if (!map[cat]) map[cat] = [];
      map[cat].push(b);
    });
    return map;
  }, [filteredBlueprints]);

  const handleOpenPracticeModal = (blueprint) => {
    setSelectedBlueprint(blueprint);
    setChosenLang(blueprint.languages?.[0] || 'C++');
  };

  const handleStartPractice = () => {
    if (!selectedBlueprint) return;
    const slug =
      selectedBlueprint.slugs?.[chosenLang] ||
      `${selectedBlueprint.key}-${chosenLang.toLowerCase().replace('+', 'p')}`;

    const rawCode =
      selectedBlueprint.codeByLanguage?.[chosenLang] ||
      selectedBlueprint.codeSnippet ||
      selectedBlueprint.code ||
      '';

    navigate(`/practice?snippet=${slug}&lang=${encodeURIComponent(chosenLang)}&lockLang=true`, {
      state: {
        snippet: {
          id: slug,
          slug,
          title: `${selectedBlueprint.title} (${chosenLang})`,
          language: chosenLang,
          difficulty: selectedBlueprint.difficulty,
          code: rawCode,
          content: rawCode,
          category: selectedBlueprint.category,
          isLanguageLocked: true,
        },
      },
    });
  };

  return (
    <div className="dash space-y-6">
      {/* ── Welcome Header (Matches Dashboard Design Exactly) ── */}
      <div className="dash-welcome">
        <div className="welcome-left">
          <div className="welcome-sup flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>DevType Server Catalog // Multi-Language Blueprints</span>
          </div>
          <h1 className="welcome-title">Algorithmic Blueprints &amp; Templates</h1>
          <p className="welcome-sub">
            Authoritative algorithmic implementations and modern engineering patterns across{' '}
            <span className="text-primary font-semibold">C++, C, Java, Python, JavaScript, TypeScript, Go, Rust, and SQL</span>.
            Practice with deterministic focus and syntax validation.
          </p>
        </div>

        {/* Ice Glass Date & Catalog Widget */}
        <div className="welcome-widget">
          <div className="welcome-widget-top">
            <span>50+ Blueprints</span>
            <Code2 size={16} className="welcome-cal-icon" />
          </div>
          <div className="welcome-widget-sub">
            <Globe size={14} fill="currentColor" strokeWidth={0} />
            <span>9 Language Stacks</span>
          </div>
        </div>
      </div>

      {/* ── 4 Stat Cards Grid (Matches Dashboard Exactly) ── */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-top">
              <div className="stat-icon-wrap cobalt">
                <Cpu size={19} strokeWidth={2.2} />
              </div>
              <div className="stat-top-right">
                <span className="badge badge-teal">Core</span>
              </div>
            </div>
            <div className="stat-num">24</div>
            <div className="stat-label">Algorithms &amp; DSA</div>
            <div className="stat-sub">
              <span>Searches, Sorts, Dynamic Prog.</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-top">
              <div className="stat-icon-wrap emerald">
                <Zap size={19} strokeWidth={2.2} />
              </div>
              <div className="stat-top-right">
                <span className="badge badge-indigo">Reactive</span>
              </div>
            </div>
            <div className="stat-num">12</div>
            <div className="stat-label">Frameworks &amp; Modern</div>
            <div className="stat-sub">
              <span>React Hooks, Angular Signals</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-top">
              <div className="stat-icon-wrap rose">
                <Terminal size={19} strokeWidth={2.2} />
              </div>
              <div className="stat-top-right">
                <span className="badge badge-amber">Systems</span>
              </div>
            </div>
            <div className="stat-num">8</div>
            <div className="stat-label">Concurrency &amp; Systems</div>
            <div className="stat-sub">
              <span>Go Pools, Rust Channels, Mutexes</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-top">
              <div className="stat-icon-wrap amber">
                <Database size={19} strokeWidth={2.2} />
              </div>
              <div className="stat-top-right">
                <span className="badge badge-teal">Analytics</span>
              </div>
            </div>
            <div className="stat-num">6</div>
            <div className="stat-label">SQL &amp; Data Pipeline</div>
            <div className="stat-sub">
              <span>Window Functions &amp; CTEs</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter & Search Toolbar Inside a Card ── */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div className="search-wrap" style={{ flex: 1, minWidth: 260, maxWidth: 440 }}>
            <Search className="search-icon" size={16} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search blueprints (e.g. Binary Search, Quick Sort, React, C++)..."
              className="search-input"
              style={{ height: 38 }}
            />
          </div>

          {/* Filter Dropdowns / Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="btn btn-secondary-glass btn-sm"
              style={{ height: 38, padding: '0 12px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--t1)', background: 'var(--bg-surface)' }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>

            {/* Language Select */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="btn btn-secondary-glass btn-sm"
              style={{ height: 38, padding: '0 12px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--t1)', background: 'var(--bg-surface)' }}
            >
              {languagesList.map((lang) => (
                <option key={lang} value={lang}>
                  {lang === 'All' ? 'All Stacks' : lang}
                </option>
              ))}
            </select>

            {/* Difficulty Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.04)', padding: 3, borderRadius: 8 }}>
              {['All', 'Beginner', 'Intermediate', 'Advanced'].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`btn btn-sm ${selectedDifficulty === diff ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ height: 32, padding: '0 10px', fontSize: '0.74rem' }}
                >
                  {diff}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderLeft: '1px solid var(--glass-border)', paddingLeft: 10 }}>
              <button
                onClick={() => setViewMode('all')}
                className={`btn btn-sm ${viewMode === 'all' ? 'btn-primary' : 'btn-secondary-glass'}`}
                title="Grid View"
                style={{ height: 32 }}
              >
                <LayoutGrid size={14} />
                <span>Grid</span>
              </button>
              <button
                onClick={() => setViewMode('categorized')}
                className={`btn btn-sm ${viewMode === 'categorized' ? 'btn-primary' : 'btn-secondary-glass'}`}
                title="Categorized View"
                style={{ height: 32 }}
              >
                <Layers size={14} />
                <span>Categories</span>
              </button>
            </div>
          </div>
        </div>

        {/* Counter & Active Filter Tags */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--glass-border-sub)' }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
            Showing <strong>{filteredBlueprints.length}</strong> of {blueprints.length} blueprints
          </span>
          {(searchQuery || selectedCategory !== 'All' || selectedDifficulty !== 'All' || selectedLanguage !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedDifficulty('All');
                setSelectedLanguage('All');
              }}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.72rem', height: 26, padding: '0 8px', color: 'var(--brand)' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Content View 1: Flat Grid ── */}
      {viewMode === 'all' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
          {filteredBlueprints.map((item) => {
            const diffClass =
              item.difficulty === 'Beginner'
                ? 'badge-teal'
                : item.difficulty === 'Intermediate'
                ? 'badge-amber'
                : 'badge-rose';

            return (
              <div key={item.key} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 20 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>
                      {item.category}
                    </span>
                    <span className={`badge ${diffClass}`}>
                      {item.difficulty}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--t1)', margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
                    {item.title}
                  </h3>

                  <p style={{ fontSize: '0.82rem', color: 'var(--t2)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                    {item.description}
                  </p>

                  {/* Language Badges */}
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 6 }}>
                      Available Stacks:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(item.languages || []).map((lang) => (
                        <span
                          key={lang}
                          className="badge badge-teal"
                          style={{ fontSize: '0.7rem', padding: '3px 8px', fontFamily: 'var(--font-mono)' }}
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingTop: 14, borderTop: '1px solid var(--glass-border-sub)' }}>
                  <button
                    onClick={() => {
                      setPreviewBlueprint(item);
                      setPreviewModalOpen(true);
                    }}
                    className="btn btn-secondary-glass btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <Eye size={13} />
                    <span>Preview</span>
                  </button>

                  <button
                    onClick={() => handleOpenPracticeModal(item)}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <Play size={12} fill="currentColor" strokeWidth={0} />
                    <span>Practice</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Content View 2: Organized by Category ── */}
      {viewMode === 'categorized' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {Object.entries(categorizedBlueprints).map(([categoryName, items]) => (
            <div key={categoryName} className="card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--glass-border-sub)' }}>
                <Layers size={20} color="var(--brand)" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--t1)', margin: 0 }}>
                  {categoryName}
                </h2>
                <span className="badge badge-teal" style={{ marginLeft: 'auto' }}>
                  {items.length} drills
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {items.map((item) => {
                  const diffClass =
                    item.difficulty === 'Beginner'
                      ? 'badge-teal'
                      : item.difficulty === 'Intermediate'
                      ? 'badge-amber'
                      : 'badge-rose';

                  return (
                    <div
                      key={item.key}
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span className={`badge ${diffClass}`}>
                            {item.difficulty}
                          </span>
                          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--brand)', fontWeight: 700 }}>
                            {item.languages?.length || 1} Stacks
                          </span>
                        </div>

                        <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--t1)', margin: '0 0 6px 0' }}>
                          {item.title}
                        </h4>

                        <p style={{ fontSize: '0.78rem', color: 'var(--t2)', margin: '0 0 12px 0', lineHeight: 1.45 }}>
                          {item.description}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                        <button
                          onClick={() => {
                            setPreviewBlueprint(item);
                            setPreviewModalOpen(true);
                          }}
                          className="btn btn-secondary-glass btn-sm"
                          style={{ flex: 1, justifyContent: 'center', height: 30 }}
                        >
                          <Eye size={12} />
                          <span>Preview</span>
                        </button>
                        <button
                          onClick={() => handleOpenPracticeModal(item)}
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1, justifyContent: 'center', height: 30 }}
                        >
                          <Play size={11} fill="currentColor" strokeWidth={0} />
                          <span>Practice</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Language Selection Modal ── */}
      {selectedBlueprint && (
        <div className="devtype-modal-backdrop">
          <div className="devtype-modal-box" style={{ maxWidth: 480 }}>
            <div className="devtype-modal-header">
              <div>
                <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--brand)', fontWeight: 700 }}>
                  Select Practice Language
                </span>
                <h3 className="devtype-modal-title" style={{ marginTop: 2, fontSize: '1.15rem' }}>
                  {selectedBlueprint.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBlueprint(null)}
                className="icon-btn"
                style={{ width: 28, height: 28 }}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="devtype-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 8 }}>
                  Choose Your Target Stack:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {(selectedBlueprint.languages || []).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setChosenLang(lang)}
                      className={`btn ${chosenLang === lang ? 'btn-primary' : 'btn-secondary-glass'}`}
                      style={{ justifyContent: 'space-between', padding: '10px 14px' }}
                    >
                      <span>{lang}</span>
                      {chosenLang === lang && <CheckCircle2 size={16} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Lock Warning */}
              <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(217, 119, 6, 0.10)', border: '1px solid rgba(217, 119, 6, 0.25)', display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.78rem', color: '#D97706', lineHeight: 1.45 }}>
                <Lock size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong style={{ display: 'block', fontWeight: 700 }}>Strict Language Focus</strong>
                  Once practice begins, the drill will be locked in {chosenLang} to ensure continuous motor memory development.
                </div>
              </div>
            </div>

            <div className="devtype-modal-footer">
              <button
                onClick={() => setSelectedBlueprint(null)}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleStartPractice}
                className="btn btn-primary btn-sm"
              >
                <Play size={12} fill="currentColor" strokeWidth={0} />
                <span>Begin Practice in {chosenLang}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Code Preview Modal ── */}
      {previewModalOpen && previewBlueprint && (
        <div className="devtype-modal-backdrop">
          <div className="devtype-modal-box" style={{ maxWidth: 640 }}>
            <div className="devtype-modal-header">
              <div>
                <span className="badge badge-teal" style={{ marginBottom: 4 }}>
                  {previewBlueprint.category} &bull; {previewBlueprint.difficulty}
                </span>
                <h3 className="devtype-modal-title" style={{ fontSize: '1.2rem' }}>
                  {previewBlueprint.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="icon-btn"
                style={{ width: 28, height: 28 }}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="devtype-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: '0.84rem', color: 'var(--t2)', margin: 0, lineHeight: 1.5 }}>
                {previewBlueprint.description}
              </p>

              {/* Code preview block */}
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--glass-border)', background: 'var(--code-bg, #0F172A)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#94A3B8' }}>
                    Reference Blueprint Implementation
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#38BDF8', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {previewBlueprint.languages?.[0] || 'Code'}
                  </span>
                </div>
                <pre style={{ margin: 0, padding: 16, fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: '#F8FAFC', overflowX: 'auto', lineHeight: 1.55 }}>
                  {Object.values(previewBlueprint.codeByLanguage || {})[0] || previewBlueprint.codeSnippet || previewBlueprint.code || '// No code preview available'}
                </pre>
              </div>
            </div>

            <div className="devtype-modal-footer">
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="btn btn-ghost btn-sm"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  setPreviewModalOpen(false);
                  handleOpenPracticeModal(previewBlueprint);
                }}
                className="btn btn-primary btn-sm"
              >
                <Play size={12} fill="currentColor" strokeWidth={0} />
                <span>Select Stack &amp; Practice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
