// src/pages/Templates.jsx
import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Sparkles, LayoutGrid, Layers,
  Play, BookOpen, Code2, Cpu, Globe, Database,
  Lock, CheckCircle2, ChevronRight, ChevronLeft, ShieldAlert,
  Flame, Terminal, Zap, ArrowRight, Filter
} from 'lucide-react';
import { PREDEFINED_BLUEPRINTS } from '../data/predefinedBlueprints';
import { templateService } from '../services/templateService';

const TRACKS = [
  { id: 'all', label: 'All Tracks' },
  { id: 'foundations', label: 'C++ Core' },
  { id: 'stl', label: 'C++ STL' },
  { id: 'java-foundations', label: 'Java Core' },
  { id: 'jcf', label: 'Java JCF' },
  { id: 'cp', label: 'Competitive Algorithms' },
];

export default function Templates() {
  const navigate = useNavigate();

  // Active Blueprints Catalog
  const [blueprints, setBlueprints] = useState(PREDEFINED_BLUEPRINTS);
  const [isLoading, setIsLoading] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'categorized'

  // Modals State
  const [selectedBlueprint, setSelectedBlueprint] = useState(null);
  const [chosenLang, setChosenLang] = useState(() => localStorage.getItem('devtype_preferred_lang') || 'C++');

  // ── Pagination State ──
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

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

      const matchesTrack =
        selectedTrack === 'all' ||
        b.track === selectedTrack;

      const matchesCat =
        selectedCategory === 'All' || b.category === selectedCategory;

      const matchesDiff =
        selectedDifficulty === 'All' ||
        b.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();

      const matchesLang =
        selectedLanguage === 'All' ||
        (b.languages || []).includes(selectedLanguage);

      return matchesSearch && matchesTrack && matchesCat && matchesDiff && matchesLang;
    });
  }, [blueprints, searchQuery, selectedTrack, selectedCategory, selectedDifficulty, selectedLanguage]);

  // Reset pagination to page 1 on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTrack, selectedCategory, selectedDifficulty, selectedLanguage]);

  // ── Pagination Computations ──
  const totalItems = filteredBlueprints.length;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedBlueprints = useMemo(() => {
    if (pageSize === 'all') return filteredBlueprints;
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredBlueprints.slice(start, start + pageSize);
  }, [filteredBlueprints, safeCurrentPage, pageSize]);

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

  // Lock body scroll when practice modal is open
  useEffect(() => {
    if (selectedBlueprint) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [selectedBlueprint]);

  const handleOpenPracticeModal = (blueprint) => {
    const userPref = localStorage.getItem('devtype_preferred_lang') || 'C++';
    setSelectedBlueprint(blueprint);
    const initialLang = blueprint.languages?.includes(userPref)
      ? userPref
      : blueprint.languages?.[0] || 'C++';
    setChosenLang(initialLang);
  };

  const launchPracticeForBlueprint = (blueprint, lang) => {
    if (!blueprint) return;
    const targetLang = lang || chosenLang || 'C++';
    localStorage.setItem('devtype_preferred_lang', targetLang);

    const slug =
      blueprint.slugs?.[targetLang] ||
      blueprint.slug ||
      `${blueprint.key}-${targetLang.toLowerCase().replace('+', 'p')}`;

    const rawCode =
      blueprint.codeByLanguage?.[targetLang] ||
      blueprint.codeSnippet ||
      blueprint.code ||
      '';

    navigate(`/practice?snippet=${slug}&lang=${encodeURIComponent(targetLang)}&lockLang=true`, {
      state: {
        snippet: {
          id: slug,
          slug,
          title: `${blueprint.title} (${targetLang})`,
          language: targetLang,
          difficulty: blueprint.difficulty,
          code: rawCode,
          content: rawCode,
          category: blueprint.category,
          track: blueprint.track,
          timeComplexity: blueprint.timeComplexity,
          spaceComplexity: blueprint.spaceComplexity,
          paradigm: blueprint.paradigm,
          coreConcept: blueprint.coreConcept,
          theory: blueprint.theory,
          isLanguageLocked: true,
        },
      },
    });
  };

  const handleStartPractice = () => {
    if (!selectedBlueprint) return;
    launchPracticeForBlueprint(selectedBlueprint, chosenLang);
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
        {/* Track Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', marginRight: 4 }}>
            Tracks:
          </span>
          {TRACKS.map((track) => (
            <button
              key={track.id}
              type="button"
              onClick={() => setSelectedTrack(track.id)}
              className={`btn btn-xs ${selectedTrack === track.id ? 'btn-primary' : 'btn-secondary-glass'}`}
              style={{ padding: '4px 10px', fontSize: '0.74rem' }}
            >
              {track.label}
            </button>
          ))}
        </div>

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

        {/* Counter & Active Filter Tags & Page Size */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--glass-border-sub)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
              Showing <strong>{totalItems === 0 ? 0 : (safeCurrentPage - 1) * (pageSize === 'all' ? totalItems : pageSize) + 1}–{pageSize === 'all' ? totalItems : Math.min(safeCurrentPage * pageSize, totalItems)}</strong> of <strong>{totalItems}</strong> matching blueprints ({blueprints.length} total)
            </span>
            {totalItems > 0 && viewMode === 'all' && (
              <div className="reports-page-size-select" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <label htmlFor="top-page-size" style={{ fontSize: '0.72rem', color: 'var(--t3)' }}>Per page:</label>
                <select
                  id="top-page-size"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="reports-select-sm"
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                  <option value="all">All ({totalItems})</option>
                </select>
              </div>
            )}
          </div>
          {(searchQuery || selectedTrack !== 'all' || selectedCategory !== 'All' || selectedDifficulty !== 'All' || selectedLanguage !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTrack('all');
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
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
            {paginatedBlueprints.map((item) => {
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

                  {item.timeComplexity && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--brand)' }}>
                      <Zap size={12} />
                      <span>{item.timeComplexity}</span>
                    </div>
                  )}

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
                    onClick={() => navigate(`/theory/${item.slug || item.key || item.id}`)}
                    className="btn btn-secondary-glass btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <BookOpen size={13} />
                    <span>Theory</span>
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

        {/* ── Pagination Bar ── */}
        {totalItems > 0 && totalPages > 1 && (
          <div className="reports-pagination-bar" style={{ marginTop: 24, borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
            <div className="reports-pagination-info">
              <span>
                Page <strong>{safeCurrentPage}</strong> of <strong>{totalPages}</strong>
              </span>
              <div className="reports-page-size-select">
                <label htmlFor="bottom-page-size">Per page:</label>
                <select
                  id="bottom-page-size"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="reports-select-sm"
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>

            <div className="reports-pagination-controls">
              <button
                type="button"
                className="pagination-btn"
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 320, behavior: 'smooth' });
                }}
                disabled={safeCurrentPage <= 1}
                title="Previous Page"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>

              <div className="pagination-pages-list">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    return Math.abs(page - safeCurrentPage) <= 1;
                  })
                  .map((page, idx, arr) => {
                    const prevPage = arr[idx - 1];
                    const hasGap = prevPage && page - prevPage > 1;

                    return (
                      <span key={page} style={{ display: 'inline-flex', alignItems: 'center' }}>
                        {hasGap && <span className="pagination-ellipsis">...</span>}
                        <button
                          type="button"
                          className={`pagination-page-btn ${page === safeCurrentPage ? 'active' : ''}`}
                          onClick={() => {
                            setCurrentPage(page);
                            window.scrollTo({ top: 320, behavior: 'smooth' });
                          }}
                        >
                          {page}
                        </button>
                      </span>
                    );
                  })}
              </div>

              <button
                type="button"
                className="pagination-btn"
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 320, behavior: 'smooth' });
                }}
                disabled={safeCurrentPage >= totalPages}
                title="Next Page"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </>
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

                        {item.timeComplexity && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--brand)' }}>
                            <Zap size={11} />
                            <span>{item.timeComplexity}</span>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                        <button
                          onClick={() => navigate(`/theory/${item.slug || item.key || item.id}`)}
                          className="btn btn-secondary-glass btn-sm"
                          style={{ flex: 1, justifyContent: 'center', height: 30 }}
                        >
                          <BookOpen size={12} />
                          <span>Theory</span>
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

      {/* ── Language Selection Modal (Portaled directly to document.body for instant center alignment) ── */}
      {selectedBlueprint &&
        createPortal(
          <div className="devtype-modal-backdrop" onClick={() => setSelectedBlueprint(null)}>
            <div
              className="devtype-modal-box"
              style={{ maxWidth: 480 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="devtype-modal-header">
                <div>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase',
                      color: 'var(--brand)',
                      fontWeight: 700,
                    }}
                  >
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

              <div
                className="devtype-modal-body"
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                <div>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--t3)',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      display: 'block',
                      marginBottom: 8,
                    }}
                  >
                    Choose Your Target Stack:
                  </label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: 8,
                    }}
                  >
                    {(selectedBlueprint.languages || []).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setChosenLang(lang)}
                        className={`btn ${
                          chosenLang === lang ? 'btn-primary' : 'btn-secondary-glass'
                        }`}
                        style={{
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                        }}
                      >
                        <span>{lang}</span>
                        {chosenLang === lang && <CheckCircle2 size={16} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language Lock Warning */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: 'rgba(217, 119, 6, 0.10)',
                    border: '1px solid rgba(217, 119, 6, 0.25)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    fontSize: '0.78rem',
                    color: '#D97706',
                    lineHeight: 1.45,
                  }}
                >
                  <Lock size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ display: 'block', fontWeight: 700 }}>
                      Strict Language Focus
                    </strong>
                    Once practice begins, the drill will be locked in {chosenLang} to ensure
                    continuous motor memory development.
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
                <button onClick={handleStartPractice} className="btn btn-primary btn-sm">
                  <Play size={12} fill="currentColor" strokeWidth={0} />
                  <span>Begin Practice in {chosenLang}</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

    </div>
  );
}
