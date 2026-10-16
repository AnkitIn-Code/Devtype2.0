// src/pages/Templates.jsx
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Sparkles, Plus, LayoutGrid, List,
  Filter, BookOpen, RotateCcw,
  Layers, Code2, Cpu, Globe, Database
} from 'lucide-react';

import { getAllTemplates } from '../utils/templateStore';
import { LANGUAGES, DIFFICULTIES, CATEGORIES } from '../data/snippets';

import SpotlightTemplateCard from '../components/templates/SpotlightTemplateCard';
import TemplateCard from '../components/templates/TemplateCard';
import TemplateDetailModal from '../components/templates/TemplateDetailModal';
import CreateTemplateModal from '../components/templates/CreateTemplateModal';
import TemplateSkeletonCard from '../components/templates/TemplateSkeletonCard';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest First' },
  { value: 'diff-asc', label: 'Difficulty: Easy to Hard' },
  { value: 'diff-desc', label: 'Difficulty: Hard to Easy' },
  { value: 'length-asc', label: 'Shortest Code' },
  { value: 'length-desc', label: 'Longest Code' },
];

const DIFFICULTY_WEIGHTS = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
};

const CATEGORY_ICONS = {
  'All Collections': Layers,
  'Data Structures': Code2,
  'Algorithms': Cpu,
  'Concurrency': Cpu,
  'Web & Async': Globe,
  'SQL & Analytics': Database,
};

export default function Templates() {
  const navigate = useNavigate();

  // ── Template Library State ──
  const [templates, setTemplates] = useState(() => getAllTemplates());
  const [isLoading, setIsLoading] = useState(false);

  // ── Filter & Search State ──
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Collections');
  const [selectedLang, setSelectedLang] = useState('All');
  const [selectedDiff, setSelectedDiff] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // ── Modals State ──
  const [activeModalSnippet, setActiveModalSnippet] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Featured spotlight snippet
  const spotlightTemplate = useMemo(() => {
    return templates.find((t) => t.isSpotlight) || templates[0];
  }, [templates]);

  // Language count badges
  const langCounts = useMemo(() => {
    const counts = { All: templates.length };
    templates.forEach((t) => {
      counts[t.language] = (counts[t.language] || 0) + 1;
    });
    return counts;
  }, [templates]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = { 'All Collections': templates.length };
    templates.forEach((t) => {
      if (t.category) {
        counts[t.category] = (counts[t.category] || 0) + 1;
      }
    });
    return counts;
  }, [templates]);

  // ── Filtered & Sorted Templates ──
  const filteredTemplates = useMemo(() => {
    let result = [...templates];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((t) => {
        const titleMatch = t.title.toLowerCase().includes(q);
        const descMatch = (t.description || '').toLowerCase().includes(q);
        const langMatch = t.language.toLowerCase().includes(q);
        const tagMatch = (t.tags || []).some((tag) => tag.toLowerCase().includes(q));
        const codeMatch = (t.code || '').toLowerCase().includes(q);
        return titleMatch || descMatch || langMatch || tagMatch || codeMatch;
      });
    }

    // Category filter
    if (selectedCategory !== 'All Collections') {
      result = result.filter((t) => t.category === selectedCategory);
    }

    // Language filter
    if (selectedLang !== 'All') {
      result = result.filter((t) => t.language === selectedLang);
    }

    // Difficulty filter
    if (selectedDiff !== 'All') {
      result = result.filter((t) => t.difficulty === selectedDiff);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'popular') {
        return (b.popularity || 80) - (a.popularity || 80);
      }
      if (sortBy === 'newest') {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }
      if (sortBy === 'diff-asc') {
        return (DIFFICULTY_WEIGHTS[a.difficulty] || 2) - (DIFFICULTY_WEIGHTS[b.difficulty] || 2);
      }
      if (sortBy === 'diff-desc') {
        return (DIFFICULTY_WEIGHTS[b.difficulty] || 2) - (DIFFICULTY_WEIGHTS[a.difficulty] || 2);
      }
      if (sortBy === 'length-asc') {
        return (a.code || '').length - (b.code || '').length;
      }
      if (sortBy === 'length-desc') {
        return (b.code || '').length - (a.code || '').length;
      }
      return 0;
    });

    return result;
  }, [templates, searchQuery, selectedCategory, selectedLang, selectedDiff, sortBy]);

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 120);
  };

  const handleLanguageChange = (lang) => {
    setSelectedLang(lang);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 120);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All Collections');
    setSelectedLang('All');
    setSelectedDiff('All');
    setSortBy('popular');
  };

  // Launch Practice Session
  const handleStartPractice = (snippet) => {
    navigate(`/practice?snippet=${snippet.id}&lang=${encodeURIComponent(snippet.language)}`, {
      state: { snippet },
    });
  };

  // Handle Created Template
  const handleTemplateCreated = (newTemplate, startImmediately = false) => {
    setIsCreateModalOpen(false);
    setTemplates(getAllTemplates());
    if (startImmediately) {
      handleStartPractice(newTemplate);
    }
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedCategory !== 'All Collections' ||
    selectedLang !== 'All' ||
    selectedDiff !== 'All';

  const showSpotlight = !hasActiveFilters;

  return (
    <div className="templates-page-root">
      {/* ── Page Header ── */}
      <header className="tpl-header">
        <div className="tpl-header-left">
          <div className="tpl-header-badge">
            <BookOpen size={13} className="tpl-badge-icon" />
            <span>Practice Catalog</span>
          </div>
          <h1 className="tpl-title">Explore Code Templates</h1>
          <p className="tpl-subtitle">
            Curated engineering benchmarks, data structures, and algorithmic patterns designed for typing practice.
          </p>
        </div>

        <div className="tpl-header-actions">
          <button
            type="button"
            className="tpl-hdr-btn tpl-hdr-ai"
            onClick={() => navigate('/ai-generator')}
            title="Generate custom practice templates with AI"
            id="btn-nav-ai-generator"
          >
            <Sparkles size={15} className="spark-icon" />
            <span>AI Generator</span>
          </button>

          <button
            type="button"
            className="tpl-hdr-btn tpl-hdr-primary"
            onClick={() => setIsCreateModalOpen(true)}
            title="Create a new practice code template"
            id="btn-open-create-template"
          >
            <Plus size={15} strokeWidth={2.2} />
            <span>New Template</span>
          </button>
        </div>
      </header>

      {/* ── Curated Spotlight Hero Card (Displayed on initial overview) ── */}
      {showSpotlight && spotlightTemplate && (
        <SpotlightTemplateCard
          template={spotlightTemplate}
          onSelect={setActiveModalSnippet}
          onPractice={handleStartPractice}
        />
      )}

      {/* ── Domain Category Tabs Row ── */}
      <nav className="tpl-category-tabs" aria-label="Template domain categories">
        {CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat] || Layers;
          const isSelected = selectedCategory === cat;
          const count = categoryCounts[cat] || 0;
          return (
            <button
              key={cat}
              type="button"
              className={`tpl-cat-tab ${isSelected ? 'active' : ''}`}
              onClick={() => handleCategoryChange(cat)}
              id={`tab-cat-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
            >
              <Icon size={14} className="tpl-cat-icon" />
              <span className="tpl-cat-name">{cat}</span>
              <span className="tpl-cat-badge">{count}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Main Toolbar: Search & Filter Controls ── */}
      <section className="tpl-toolbar-card" aria-label="Template search and filters">
        {/* Top Row: Search Input, Difficulty Dropdown, Sorting, View Toggle */}
        <div className="tpl-toolbar-top">
          {/* Spotlight Search Bar */}
          <div className="tpl-search-wrapper">
            <Search size={15} className="tpl-search-icon" />
            <input
              type="text"
              className="tpl-search-input"
              placeholder="Search templates by title, keyword, or concept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="input-template-search"
            />
            {searchQuery ? (
              <button
                type="button"
                className="tpl-search-clear-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search query"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            ) : (
              <span className="tpl-search-hotkey" aria-hidden="true">
                ⌘K
              </span>
            )}
          </div>

          {/* Right Toolbar Controls: Difficulty, Sort, View Toggle */}
          <div className="tpl-controls-right">
            {/* Difficulty Filter */}
            <div className="tpl-control-item">
              <Filter size={14} className="tpl-ctrl-icon" />
              <select
                className="tpl-select"
                value={selectedDiff}
                onChange={(e) => setSelectedDiff(e.target.value)}
                id="select-difficulty-filter"
                aria-label="Filter by difficulty"
              >
                {DIFFICULTIES.map((diff) => (
                  <option key={diff} value={diff}>
                    {diff === 'All' ? 'All Difficulties' : diff}
                  </option>
                ))}
              </select>
            </div>

            {/* Sorting Dropdown */}
            <div className="tpl-control-item">
              <select
                className="tpl-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                id="select-sort-filter"
                aria-label="Sort templates"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="tpl-view-toggle">
              <button
                type="button"
                className={`tpl-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid view"
                id="btn-view-grid"
                aria-label="Grid layout"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                className={`tpl-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List view"
                id="btn-view-list"
                aria-label="List layout"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Row: Language Filter Chips */}
        <div className="tpl-lang-chips-row">
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLang === lang;
            const count = langCounts[lang] || 0;
            return (
              <button
                key={lang}
                type="button"
                className={`tpl-lang-chip ${isSelected ? 'active' : ''}`}
                onClick={() => handleLanguageChange(lang)}
                id={`chip-lang-${lang.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              >
                <span className="tpl-chip-label">{lang}</span>
                <span className="tpl-chip-count">{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Summary & Reset Banner ── */}
      <div className="tpl-meta-banner">
        <span className="tpl-results-count">
          Showing <strong>{filteredTemplates.length}</strong>{' '}
          {filteredTemplates.length === 1 ? 'template' : 'templates'}
          {selectedCategory !== 'All Collections' && (
            <span> in <em>{selectedCategory}</em></span>
          )}
          {selectedLang !== 'All' && <span> for <em>{selectedLang}</em></span>}
          {selectedDiff !== 'All' && <span> ({selectedDiff})</span>}
        </span>

        {hasActiveFilters && (
          <button
            type="button"
            className="tpl-clear-filters-btn"
            onClick={handleClearFilters}
            id="btn-clear-all-filters"
          >
            <RotateCcw size={12} />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>

      {/* ── Templates Catalog: Grid or List View ── */}
      <section className="tpl-content-area" aria-label="Template catalog">
        {isLoading ? (
          <div className={viewMode === 'grid' ? 'tpl-grid-layout' : 'tpl-list-layout'}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <TemplateSkeletonCard key={n} />
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="tpl-empty-card">
            <div className="tpl-empty-icon-wrap">
              <BookOpen size={24} strokeWidth={1.8} />
            </div>
            <h3 className="tpl-empty-title">No templates found</h3>
            <p className="tpl-empty-desc">
              We couldn't find any practice templates matching your filters or search keywords.
            </p>
            <div className="tpl-empty-actions">
              <button
                type="button"
                className="tpl-btn-reset-empty"
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
              <button
                type="button"
                className="tpl-btn-new-empty"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus size={14} />
                <span>Create New Template</span>
              </button>
            </div>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'tpl-grid-layout' : 'tpl-list-layout'}>
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={setActiveModalSnippet}
                onPractice={handleStartPractice}
                isListView={viewMode === 'list'}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Detail Modal ── */}
      <TemplateDetailModal
        isOpen={!!activeModalSnippet}
        template={activeModalSnippet}
        onClose={() => setActiveModalSnippet(null)}
        onPractice={handleStartPractice}
      />

      {/* ── Create New Template Modal ── */}
      <CreateTemplateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleTemplateCreated}
      />
    </div>
  );
}
