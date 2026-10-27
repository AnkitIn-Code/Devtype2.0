// src/components/common/UniversalSearch.jsx
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Play, BookOpen, Brain, Terminal, Zap, Trophy, Users,
  BarChart3, Award, Sparkles, User, Settings, Shield,
  Moon, Sun, Flame, Code2, ArrowRight, CornerDownLeft,
  Filter, CheckCircle2, Star, Loader2
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { templateService } from '../../services/templateService';
import { SNIPPETS } from '../../data/snippets';

// Primary Navigation Pages & Sections
const APP_PAGES = [
  {
    id: 'page-dash',
    type: 'page',
    title: 'Dashboard',
    category: 'Pages',
    description: 'Telemetry overview, streak tracker, and personal progress',
    link: '/dashboard',
    icon: 'Dashboard',
    keywords: ['home', 'stats', 'streak', 'progress', 'overview', 'wpm', 'metrics'],
  },
  {
    id: 'page-practice',
    type: 'page',
    title: 'Practice Arena',
    category: 'Pages',
    description: 'Live interactive coding workspace with real-time cadence meters',
    link: '/practice',
    icon: 'Play',
    keywords: ['type', 'typing', 'code', 'speed', 'test', 'drill', 'editor', 'workspace'],
  },
  {
    id: 'page-templates',
    type: 'page',
    title: 'Code Templates Catalog',
    category: 'Pages',
    description: 'Explore programming snippets across C++, Python, Java, Rust & more',
    link: '/templates',
    icon: 'BookOpen',
    keywords: ['snippets', 'languages', 'catalog', 'library', 'collections', 'code'],
  },
  {
    id: 'page-revision',
    type: 'page',
    title: 'SRS Revision Queue',
    category: 'Pages',
    description: 'Spaced repetition recall queue, memory retention, and SM-2 flashcard drills',
    link: '/revision',
    icon: 'Brain',
    keywords: ['srs', 'recall', 'revision', 'memory', 'spaced repetition', 'retention', 'queue', 'drill'],
  },
  {
    id: 'page-custom-studio',
    type: 'page',
    title: 'Custom Studio',
    category: 'Pages',
    description: 'Author custom blueprints, import GitHub gists, and drill offline',
    link: '/custom-studio',
    icon: 'Terminal',
    keywords: ['custom', 'studio', 'author', 'import', 'offline', 'gist', 'workbench', 'markdown'],
  },
  {
    id: 'page-multiplayer',
    type: 'page',
    title: 'Multiplayer Arena',
    category: 'Pages',
    description: 'Real-time 1v1 developer duels and competitive sprint lobbies',
    link: '/multiplayer',
    icon: 'Users',
    keywords: ['pvp', 'race', 'multiplayer', '1v1', 'lobby', 'live', 'battle', 'compete'],
  },
  {
    id: 'page-leaderboard',
    type: 'page',
    title: 'Global Leaderboards',
    category: 'Pages',
    description: 'Global developer rankings, top WPM records, and sprint percentiles',
    link: '/leaderboard',
    icon: 'Trophy',
    keywords: ['ranks', 'top', 'percentile', 'high score', 'global', 'ladder', 'hall of fame'],
  },
  {
    id: 'page-reports',
    type: 'page',
    title: 'Performance Reports & Analytics',
    category: 'Pages',
    description: 'Historical velocity progression, accuracy trends, and CSV exports',
    link: '/reports',
    icon: 'BarChart3',
    keywords: ['history', 'analytics', 'charts', 'graph', 'metrics', 'export', 'csv', 'performance'],
  },
  {
    id: 'page-achievements',
    type: 'page',
    title: 'Developer Achievements',
    category: 'Pages',
    description: 'Earned accolades, milestone trophies, and level tier badges',
    link: '/achievements',
    icon: 'Award',
    keywords: ['badges', 'trophies', 'xp', 'level', 'rewards', 'milestones', 'accolades'],
  },
  {
    id: 'page-profile',
    type: 'page',
    title: 'Developer Profile',
    category: 'Pages',
    description: 'Inspect personal bio, joined date, account stats, and achievements',
    link: '/profile',
    icon: 'User',
    keywords: ['account', 'user', 'profile', 'bio', 'identity', 'me'],
  },
  {
    id: 'page-settings',
    type: 'page',
    title: 'Workspace Settings',
    category: 'Pages',
    description: 'Mechanical keyboard click sounds, theme mode, and preferences',
    link: '/settings',
    icon: 'Settings',
    keywords: ['config', 'options', 'sound', 'theme', 'audio', 'preferences', 'dark mode'],
  },
  {
    id: 'page-admin',
    type: 'page',
    title: 'Admin Moderation Center',
    category: 'Pages',
    description: 'Platform user moderation, templates governance, and audit logs',
    link: '/admin',
    icon: 'Shield',
    keywords: ['admin', 'governance', 'moderation', 'users', 'audit', 'manage'],
  },
];

// Languages catalog for quick filter
const PROGRAMMING_LANGUAGES = [
  { name: 'Python', color: '#4F46E5', desc: 'Algorithms, data manipulation & clean syntax' },
  { name: 'C++', color: '#2563EB', desc: 'Pointers, high performance STL & memory efficiency' },
  { name: 'Java', color: '#0D9488', desc: 'Object-oriented classes, streams & concurrency' },
  { name: 'JavaScript', color: '#EAB308', desc: 'Async/await, web primitives & event loop' },
  { name: 'TypeScript', color: '#0284C7', desc: 'Generics, union types & typed interfaces' },
  { name: 'Rust', color: '#EA580C', desc: 'Borrow checker, safe memory & pattern matching' },
  { name: 'Go', color: '#0284C7', desc: 'Goroutines, channels & lightweight concurrency' },
  { name: 'SQL', color: '#7C3AED', desc: 'Relational algebra, joins, indexing & window funcs' },
];

export default function UniversalSearch() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  // Dynamic remote results
  const [remoteTemplates, setRemoteTemplates] = useState([]);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const isMac = useMemo(() => {
    return typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  }, []);

  // ── Global Shortcut: ⌘K or Ctrl+K ──
  useEffect(() => {
    function handleGlobalKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => {
          inputRef.current?.focus();
          inputRef.current?.select();
        }, 10);
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // ── Close on outside click ──
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // ── Debounced Remote Search for Templates ──
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setRemoteTemplates([]);
      setIsLoadingApi(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setIsLoadingApi(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await templateService.getTemplates({ search: trimmed, size: 6 });
        if (res?.items) {
          setRemoteTemplates(res.items);
        } else {
          setRemoteTemplates([]);
        }
      } catch (err) {
        console.warn('Remote search error:', err);
      } finally {
        setIsLoadingApi(false);
      }
    }, 180);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  // ── Quick Actions ──
  const quickActions = useMemo(() => {
    return [
      {
        id: 'action-theme',
        type: 'action',
        title: isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme',
        category: 'Quick Actions',
        description: 'Toggle platform interface between light and dark glassmorphic styling',
        icon: isDark ? 'Sun' : 'Moon',
        action: () => toggleTheme(),
        keywords: ['theme', 'dark', 'light', 'mode', 'appearance', 'color'],
      },
      {
        id: 'action-srs',
        type: 'action',
        title: 'Review Due SRS Cards',
        category: 'Quick Actions',
        description: 'Review active spaced repetition recall cards due today',
        icon: 'Flame',
        action: () => navigate('/revision'),
        keywords: ['srs', 'recall', 'revision', 'memory', 'spaced repetition', 'cards'],
      },
      {
        id: 'action-start-practice',
        type: 'action',
        title: 'Start Practice Session',
        category: 'Quick Actions',
        description: 'Open the typing workspace and continue where you left off',
        icon: 'Play',
        action: () => navigate('/practice'),
        keywords: ['practice', 'start', 'type', 'begin', 'lesson', 'resume'],
      },
    ];
  }, [isDark, toggleTheme, navigate]);

  // ── Compute Filtered Results ──
  const groupedResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    // 1. If Empty query: show suggested Navigation, Quick Actions, and Top Languages
    if (!q) {
      return [
        {
          groupName: 'Quick Navigation',
          items: APP_PAGES.slice(0, 5),
        },
        {
          groupName: 'Quick Actions',
          items: quickActions,
        },
        {
          groupName: 'Browse By Language',
          items: PROGRAMMING_LANGUAGES.map((lang) => ({
            id: `lang-${lang.name}`,
            type: 'language',
            title: `${lang.name} Templates`,
            category: 'Languages',
            description: lang.desc,
            color: lang.color,
            language: lang.name,
            action: () => navigate(`/templates?lang=${encodeURIComponent(lang.name)}`),
          })),
        },
      ];
    }

    const groups = [];

    // 2. Filter Navigation Pages
    const matchingPages = APP_PAGES.filter((p) => {
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.keywords.some((kw) => kw.includes(q))
      );
    });
    if (matchingPages.length > 0) {
      groups.push({
        groupName: 'Pages & Tools',
        items: matchingPages,
      });
    }

    // 3. Filter Quick Actions
    const matchingActions = quickActions.filter((a) => {
      return (
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.keywords.some((kw) => kw.includes(q))
      );
    });
    if (matchingActions.length > 0) {
      groups.push({
        groupName: 'Actions',
        items: matchingActions,
      });
    }

    // 4. Remote & Local Templates
    // Combine remote templates with local SNIPPETS matching query
    const localMatches = SNIPPETS.filter((s) => {
      return (
        s.title.toLowerCase().includes(q) ||
        s.language.toLowerCase().includes(q) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.tags && s.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }).slice(0, 4);

    const templateItems = [];
    const seenTplIds = new Set();

    // Priority to remote templates
    remoteTemplates.forEach((t) => {
      const key = String(t.slug || t.id);
      if (!seenTplIds.has(key)) {
        seenTplIds.add(key);
        templateItems.push({
          id: `tpl-${key}`,
          type: 'template',
          title: t.title,
          category: 'Templates',
          description: t.description || `${t.language} code snippet (${t.difficulty})`,
          language: t.language,
          difficulty: t.difficulty,
          template: t,
          action: () => {
            navigate(`/practice?snippet=${t.slug || t.id}`, { state: { snippet: t } });
          },
        });
      }
    });

    // Append local matches if not duplicate
    localMatches.forEach((s) => {
      const key = String(s.id);
      if (!seenTplIds.has(key)) {
        seenTplIds.add(key);
        templateItems.push({
          id: `tpl-local-${key}`,
          type: 'template',
          title: s.title,
          category: 'Templates',
          description: s.description || `${s.language} snippet`,
          language: s.language,
          difficulty: s.difficulty,
          template: s,
          action: () => {
            navigate(`/practice?snippet=${s.id}`, { state: { snippet: s } });
          },
        });
      }
    });

    if (templateItems.length > 0) {
      groups.push({
        groupName: 'Practice Templates',
        items: templateItems.slice(0, 6),
      });
    }

    // 5. Language Filters
    const matchingLangs = PROGRAMMING_LANGUAGES.filter((lang) => {
      return lang.name.toLowerCase().includes(q) || q.includes(lang.name.toLowerCase());
    });
    if (matchingLangs.length > 0) {
      groups.push({
        groupName: 'Language Collections',
        items: matchingLangs.map((lang) => ({
          id: `lang-filter-${lang.name}`,
          type: 'language',
          title: `Filter all ${lang.name} Templates`,
          category: 'Languages',
          description: lang.desc,
          color: lang.color,
          language: lang.name,
          action: () => navigate(`/templates?lang=${encodeURIComponent(lang.name)}`),
        })),
      });
    }

    return groups;
  }, [query, quickActions, remoteTemplates, navigate]);

  // Flatten items for keyboard navigation index
  const flatItems = useMemo(() => {
    const list = [];
    groupedResults.forEach((group) => {
      group.items.forEach((item) => list.push(item));
    });
    return list;
  }, [groupedResults]);

  // Reset index when query changes or results list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector('.search-result-item.is-selected');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // ── Execute Item Action ──
  const handleSelectItem = useCallback((item) => {
    if (!item) return;
    setIsOpen(false);
    setQuery('');
    inputRef.current?.blur();

    if (item.action) {
      item.action();
    } else if (item.link) {
      navigate(item.link);
    }
  }, [navigate]);

  // ── Keyboard Navigation Handler ──
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (flatItems.length > 0 ? (prev + 1) % flatItems.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (flatItems.length > 0 ? (prev - 1 + flatItems.length) % flatItems.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems.length > 0 && flatItems[selectedIndex]) {
        handleSelectItem(flatItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const renderItemIcon = (item) => {
    if (item.type === 'page') {
      switch (item.icon) {
        case 'Play': return <Play size={14} />;
        case 'BookOpen': return <BookOpen size={14} />;
        case 'Brain': return <Brain size={14} color="#8B5CF6" />;
        case 'Terminal': return <Terminal size={14} color="#3B82F6" />;
        case 'Zap': return <Zap size={14} />;
        case 'Users': return <Users size={14} />;
        case 'Trophy': return <Trophy size={14} />;
        case 'BarChart3': return <BarChart3 size={14} />;
        case 'Award': return <Award size={14} />;
        case 'Sparkles': return <Sparkles size={14} />;
        case 'User': return <User size={14} />;
        case 'Settings': return <Settings size={14} />;
        case 'Shield': return <Shield size={14} />;
        default: return <Code2 size={14} />;
      }
    }
    if (item.type === 'action') {
      if (item.icon === 'Sun') return <Sun size={14} color="#F59E0B" />;
      if (item.icon === 'Moon') return <Moon size={14} color="#6366F1" />;
      if (item.icon === 'Flame') return <Flame size={14} color="#EF4444" />;
      return <Play size={14} />;
    }
    if (item.type === 'template') {
      return <Code2 size={14} color="#2563EB" />;
    }
    if (item.type === 'language') {
      return (
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: item.color || '#2563EB',
            display: 'inline-block',
          }}
        />
      );
    }
    return <Search size={14} />;
  };

  return (
    <div className="search-wrap" ref={containerRef}>
      <Search className="search-icon" size={16} strokeWidth={2} />
      <input
        ref={inputRef}
        id="topbar-search"
        className="search-input"
        type="text"
        placeholder="Search templates, SRS cards, pages..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        aria-label="Universal Search and Command Palette"
        autoComplete="off"
      />

      {query ? (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            inputRef.current?.focus();
          }}
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--t3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 2,
          }}
          title="Clear search"
        >
          <X size={14} />
        </button>
      ) : (
        <span className="search-kbd">{isMac ? '⌘K' : 'Ctrl+K'}</span>
      )}

      {/* ── Universal Search Dropdown ── */}
      {isOpen && (
        <div className="universal-search-dropdown" role="dialog" aria-label="Search results">
          <div className="search-results-list" ref={listRef}>
            {isLoadingApi && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: '0.78rem', color: 'var(--t3)' }}>
                <Loader2 size={13} className="spin" />
                <span>Searching templates across DevType...</span>
              </div>
            )}

            {flatItems.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--t3)' }}>
                <Search size={24} strokeWidth={1.5} style={{ margin: '0 auto 8px', opacity: 0.6 }} />
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--t1)' }}>
                  No results found for "{query}"
                </div>
                <div style={{ fontSize: '0.78rem', marginTop: 4 }}>
                  Try searching for an algorithm name (e.g. "Binary Search"), language (e.g. "Python"), or section (e.g. "Leaderboard").
                </div>
              </div>
            ) : (
              groupedResults.map((group) => {
                if (!group.items.length) return null;
                return (
                  <div key={group.groupName} style={{ marginBottom: 6 }}>
                    <div className="search-group-header">{group.groupName}</div>
                    {group.items.map((item) => {
                      const itemIdx = flatItems.indexOf(item);
                      const isSelected = itemIdx === selectedIndex;

                      return (
                        <div
                          key={item.id}
                          className={`search-result-item ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => handleSelectItem(item)}
                          onMouseEnter={() => setSelectedIndex(itemIdx)}
                        >
                          <div className="search-result-left">
                            <div className="search-item-icon-box">
                              {renderItemIcon(item)}
                            </div>
                            <div className="search-item-info">
                              <div className="search-item-title-row">
                                <span className="search-item-title">{item.title}</span>
                                {item.language && (
                                  <span className="badge badge-teal" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                                    {item.language}
                                  </span>
                                )}
                                {item.difficulty && (
                                  <span className="badge badge-indigo" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                                    {item.difficulty}
                                  </span>
                                )}
                                {item.xp && (
                                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#D97706', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                    <Star size={10} fill="currentColor" />
                                    +{item.xp} XP
                                  </span>
                                )}
                              </div>
                              <div className="search-item-desc">{item.description}</div>
                            </div>
                          </div>

                          <div className="search-result-right">
                            {isSelected ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: '0.72rem',
                                  color: 'var(--brand)',
                                  fontWeight: 600,
                                }}
                              >
                                <span>Open</span>
                                <CornerDownLeft size={11} />
                              </span>
                            ) : (
                              <ArrowRight size={13} color="var(--t4)" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>

          {/* ── Dropdown Footer ── */}
          <div className="search-dropdown-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <kbd className="search-kbd" style={{ position: 'static', transform: 'none', padding: '1px 4px' }}>↑</kbd>
                <kbd className="search-kbd" style={{ position: 'static', transform: 'none', padding: '1px 4px' }}>↓</kbd>
                <span>to navigate</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <kbd className="search-kbd" style={{ position: 'static', transform: 'none', padding: '1px 4px' }}>↵</kbd>
                <span>to select</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <kbd className="search-kbd" style={{ position: 'static', transform: 'none', padding: '1px 4px' }}>esc</kbd>
                <span>to close</span>
              </span>
            </div>
            <span style={{ fontWeight: 600, color: 'var(--t2)' }}>DevType Universal Search</span>
          </div>
        </div>
      )}
    </div>
  );
}
