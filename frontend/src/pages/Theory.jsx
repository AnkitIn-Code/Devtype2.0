// src/pages/Theory.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import mermaid from 'mermaid';
import Prism from 'prismjs';
import 'prismjs/components/prism-c.js';
import 'prismjs/components/prism-cpp.js';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-java.js';
import 'prismjs/components/prism-javascript.js';
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-go.js';
import 'prismjs/components/prism-rust.js';
import 'prismjs/components/prism-sql.js';
import {
  ArrowLeft, ArrowRight, BookOpen, Code2, Terminal,
  Copy, Check, Zap, Cpu, Clock, Database, Sparkles,
  Layers, Search, ShieldCheck, Brain
} from 'lucide-react';
import { normalizeLang } from '../utils/codeTokenizer';
import { PREDEFINED_BLUEPRINTS, getPredefinedSnippet } from '../data/predefinedBlueprints';
import { CURATED_SNIPPETS } from '../data/curatedSnippets';
import { formatTheoryMarkdown } from '../utils/mathMarkdown';
import 'katex/dist/katex.min.css';

function getFileExtension(lang) {
  const l = (lang || '').toLowerCase();
  if (l.includes('c++') || l === 'cpp') return 'cpp';
  if (l === 'c') return 'c';
  if (l.includes('java') && !l.includes('script')) return 'java';
  if (l.includes('python') || l === 'py') return 'py';
  if (l.includes('typescript') || l === 'ts') return 'ts';
  if (l.includes('javascript') || l === 'js') return 'js';
  if (l.includes('rust') || l === 'rs') return 'rs';
  if (l.includes('go')) return 'go';
  if (l.includes('sql')) return 'sql';
  return 'txt';
}

function getLangBadge(lang) {
  const l = (lang || '').toLowerCase();
  if (l.includes('c++') || l === 'cpp') return 'C++ 20 Standard';
  if (l === 'c') return 'C17 Standard';
  if (l.includes('java') && !l.includes('script')) return 'Java 21 LTS Standard';
  if (l.includes('python') || l === 'py') return 'Python 3.12 Standard';
  if (l.includes('typescript') || l === 'ts') return 'TypeScript 5 Standard';
  if (l.includes('javascript') || l === 'js') return 'JavaScript ES2024';
  if (l.includes('rust') || l === 'rs') return 'Rust 2021 Edition';
  if (l.includes('go')) return 'Go 1.22 Standard';
  if (l.includes('sql')) return 'ANSI SQL Standard';
  return `${lang || 'Code'} Standard`;
}

export default function Theory() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const querySnippet = searchParams.get('snippet');
  const targetIdentifier = slug || querySnippet || 'binary-search';

  // Resolve target snippet across PREDEFINED_BLUEPRINTS and CURATED_SNIPPETS
  const snippet = useMemo(() => {
    const needle = String(targetIdentifier).toLowerCase().trim();

    // 1. Direct key/slug/id match in PREDEFINED_BLUEPRINTS
    const foundInPredefined = PREDEFINED_BLUEPRINTS.find((bp) => {
      if (bp.key && bp.key.toLowerCase() === needle) return true;
      if (bp.slug && bp.slug.toLowerCase() === needle) return true;
      if (bp.id && String(bp.id).toLowerCase() === needle) return true;
      if (bp.slugs) {
        return Object.values(bp.slugs).some((s) => s.toLowerCase() === needle);
      }
      return false;
    });
    if (foundInPredefined) return foundInPredefined;

    // 2. Direct match in CURATED_SNIPPETS
    const foundInCurated = CURATED_SNIPPETS.find(
      (s) =>
        s.slug?.toLowerCase() === needle ||
        String(s.id).toLowerCase() === needle ||
        s.title?.toLowerCase() === needle
    );
    if (foundInCurated) {
      return {
        key: foundInCurated.slug || String(foundInCurated.id),
        id: foundInCurated.id,
        slug: foundInCurated.slug || String(foundInCurated.id),
        title: foundInCurated.title,
        track: foundInCurated.track || 'cp',
        category: foundInCurated.category || 'Competitive Algorithms',
        subCategory: foundInCurated.subCategory || foundInCurated.pattern || '',
        difficulty: foundInCurated.difficulty || 'Intermediate',
        language: foundInCurated.language || 'C++',
        languages: [foundInCurated.language || 'C++'],
        code: foundInCurated.code,
        codeByLanguage: { [foundInCurated.language || 'C++']: foundInCurated.code },
        description: foundInCurated.description || foundInCurated.coreConcept || '',
        timeComplexity: foundInCurated.timeComplexity || '',
        spaceComplexity: foundInCurated.spaceComplexity || '',
        paradigm: foundInCurated.paradigm || '',
        coreConcept: foundInCurated.coreConcept || '',
        theory: foundInCurated.theory || '',
        tags: foundInCurated.tags || [],
        xpBounty: foundInCurated.xpBounty || 70,
      };
    }

    // 3. Fallback to getPredefinedSnippet resolver
    const resolved = getPredefinedSnippet(targetIdentifier);
    if (resolved) {
      return {
        ...resolved,
        languages: [resolved.language || 'C++'],
        codeByLanguage: { [resolved.language || 'C++']: resolved.code },
      };
    }

    return PREDEFINED_BLUEPRINTS[0] || null;
  }, [targetIdentifier]);

  // Determine all available languages for multi-stack switching
  const availableLanguages = useMemo(() => {
    if (!snippet) return ['C++'];
    if (snippet.languages && Array.isArray(snippet.languages) && snippet.languages.length > 0) {
      return snippet.languages;
    }
    if (snippet.codeByLanguage && typeof snippet.codeByLanguage === 'object') {
      const keys = Object.keys(snippet.codeByLanguage);
      if (keys.length > 0) return keys;
    }
    return [snippet.language || 'C++'];
  }, [snippet]);

  // Selected Language State for Code View
  const [selectedLang, setSelectedLang] = useState(() => {
    const preferred = localStorage.getItem('devtype_preferred_lang') || 'C++';
    return preferred;
  });

  // Keep selectedLang valid if snippet changes
  useEffect(() => {
    if (availableLanguages.length > 0 && !availableLanguages.includes(selectedLang)) {
      const preferred = localStorage.getItem('devtype_preferred_lang') || 'C++';
      if (availableLanguages.includes(preferred)) {
        setSelectedLang(preferred);
      } else {
        setSelectedLang(availableLanguages[0]);
      }
    }
  }, [availableLanguages, selectedLang]);

  // Sibling blueprints in the same track/category for Prev / Next navigation
  const { prevSnippet, nextSnippet } = useMemo(() => {
    if (!snippet) return { prevSnippet: null, nextSnippet: null };
    const currentTrack = snippet.track || 'cp';
    const currentCat = snippet.category || 'General';

    // Look in PREDEFINED_BLUEPRINTS or CURATED_SNIPPETS
    let siblings = PREDEFINED_BLUEPRINTS.filter(
      (b) => (b.track && b.track === currentTrack) || (b.category && b.category === currentCat)
    );
    if (siblings.length <= 1) {
      siblings = PREDEFINED_BLUEPRINTS;
    }

    const currentIndex = siblings.findIndex(
      (s) =>
        (s.key && s.key === snippet.key) ||
        (s.slug && s.slug === snippet.slug) ||
        (s.id && s.id === snippet.id)
    );

    return {
      prevSnippet: currentIndex > 0 ? siblings[currentIndex - 1] : null,
      nextSnippet:
        currentIndex >= 0 && currentIndex < siblings.length - 1
          ? siblings[currentIndex + 1]
          : null,
    };
  }, [snippet]);

  const [activeTab, setActiveTab] = useState('theory'); // 'theory' | 'code'
  const [copied, setCopied] = useState(false);
  const articleRef = useRef(null);

  // Scroll to top when target identifier changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [snippet?.slug, snippet?.key]);

  // Active code string based on currently selected language
  const activeCode = useMemo(() => {
    if (!snippet) return '';
    if (snippet.codeByLanguage && snippet.codeByLanguage[selectedLang]) {
      return snippet.codeByLanguage[selectedLang];
    }
    if (snippet.codeByLanguage) {
      const match = Object.keys(snippet.codeByLanguage).find(
        (k) => k.toLowerCase() === selectedLang.toLowerCase()
      );
      if (match) return snippet.codeByLanguage[match];
      const first = Object.values(snippet.codeByLanguage)[0];
      if (first) return first;
    }
    return snippet.code || '';
  }, [snippet, selectedLang]);

  // Raw or generated Markdown theory
  const rawTheoryText = useMemo(() => {
    if (snippet?.theory && snippet.theory.trim().length > 0) {
      return snippet.theory;
    }
    return `### Theoretical Foundations & Architecture

#### Core Concept
${snippet?.description || snippet?.coreConcept || 'Algorithmic blueprint implementation with optimal asymptotic performance and memory invariants.'}

#### Asymptotic Complexity Analysis
- **Time Complexity**: $${snippet?.timeComplexity || 'O(N)'}$
- **Space Complexity**: $${snippet?.spaceComplexity || 'O(1)'}$ auxiliary memory
- **Paradigm**: **${snippet?.paradigm || 'Algorithmic State Invariant'}**

#### Mathematical Invariants & Verification
1. **State Invariant**: The structural integrity and ordering invariants are maintained across all recursive and iterative transitions.
2. **Boundary Conditions**: Edge cases including empty collections, single-element collections, and maximum capacity limits are rigorously satisfied.
3. **Termination Guarantee**: Monotonically decreasing search or traversal intervals guarantee bounded execution within stated asymptotic limits.
`;
  }, [snippet]);

  // Formatted HTML theory via KaTeX, marked, Mermaid cards, and VS Code code blocks
  const renderedTheoryHtml = useMemo(() => {
    if (!rawTheoryText) return '';
    return formatTheoryMarkdown(rawTheoryText);
  }, [rawTheoryText]);

  // Syntax-highlight reference blueprint code for the VS Code theme Code tab
  const highlightedBlueprintCode = useMemo(() => {
    if (!activeCode) return '';
    const normLang = normalizeLang(selectedLang || snippet?.language || 'cpp');
    const grammar = Prism.languages[normLang] || Prism.languages.cpp || Prism.languages.java || Prism.languages.javascript;
    try {
      const cleanCode = activeCode.replace(/^\n+|\n+$/g, '');
      const rawHighlighted = Prism.highlight(cleanCode, grammar, normLang);
      const lines = rawHighlighted.split('\n');
      return lines.map((l, i) => (
        `<div class="vscode-line flex hover:bg-white/[0.04] transition-colors"><span class="vscode-line-num select-none">${i + 1}</span><span class="vscode-line-text">${l || '&nbsp;'}</span></div>`
      )).join('');
    } catch {
      return activeCode.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  }, [activeCode, selectedLang, snippet?.language]);

  // Copy-button delegation for VS Code code cards inside rendered markdown
  useEffect(() => {
    const articleEl = articleRef.current;
    if (!articleEl) return;

    const handleCopyClick = (e) => {
      const btn = e.target.closest('.vscode-copy-btn');
      if (btn) {
        const raw = btn.getAttribute('data-code');
        if (raw) {
          const code = decodeURIComponent(raw);
          navigator.clipboard.writeText(code);
          const textSpan = btn.querySelector('.copy-text');
          if (textSpan) textSpan.textContent = 'Copied!';
          setTimeout(() => {
            if (textSpan) textSpan.textContent = 'Copy';
          }, 2000);
        }
      }
    };

    articleEl.addEventListener('click', handleCopyClick);
    return () => {
      articleEl.removeEventListener('click', handleCopyClick);
    };
  }, [renderedTheoryHtml]);

  // Client-side Mermaid interactive diagram compilation
  useEffect(() => {
    if (activeTab !== 'theory' || !articleRef.current) return;

    const targets = articleRef.current.querySelectorAll('.devtype-mermaid-target');
    if (!targets || targets.length === 0) return;

    let isCancelled = false;

    const renderAllDiagrams = async () => {
      try {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light' ||
          document.documentElement.classList.contains('light');

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: 'base',
          themeVariables: isLight
            ? {
                darkMode: false,
                background: '#ffffff',
                primaryColor: '#e0f2fe',
                primaryTextColor: '#0369a1',
                primaryBorderColor: '#0284c7',
                lineColor: '#0284c7',
                secondaryColor: '#f8fafc',
                secondaryTextColor: '#334155',
                secondaryBorderColor: '#cbd5e1',
                tertiaryColor: '#f1f5f9',
                tertiaryTextColor: '#0f172a',
                tertiaryBorderColor: '#94a3b8',
                mainBkg: '#ffffff',
                nodeBorder: '#0284c7',
                nodeTextColor: '#0369a1',
                clusterBkg: '#f8fafc',
                clusterBorder: '#93c5fd',
                titleColor: '#0f172a',
                edgeLabelBackground: '#f1f5f9',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
              }
            : {
                darkMode: true,
                background: '#0a0e17',
                primaryColor: '#0c2738',
                primaryTextColor: '#38bdf8',
                primaryBorderColor: '#00f0ff',
                lineColor: '#00f0ff',
                secondaryColor: '#121622',
                secondaryTextColor: '#94a3b8',
                secondaryBorderColor: '#334155',
                tertiaryColor: '#1a202c',
                tertiaryTextColor: '#cbd5e1',
                tertiaryBorderColor: '#475569',
                mainBkg: '#0d131f',
                nodeBorder: 'rgba(0, 240, 255, 0.7)',
                nodeTextColor: '#e2e8f0',
                clusterBkg: 'rgba(15, 23, 42, 0.85)',
                clusterBorder: 'rgba(0, 240, 255, 0.35)',
                titleColor: '#f8fafc',
                edgeLabelBackground: '#0b111e',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
              },
          flowchart: {
            curve: 'basis',
            useMaxWidth: false,
            htmlLabels: true,
            padding: 12,
            nodeSpacing: 28,
            rankSpacing: 32,
          },
        });

        for (let i = 0; i < targets.length; i++) {
          if (isCancelled) break;
          const target = targets[i];
          const rawCode = target.getAttribute('data-mermaid-code');
          if (!rawCode) continue;

          const decoded = decodeURIComponent(rawCode);
          const uniqueId = `devtype-mermaid-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`;

          try {
            const { svg } = await mermaid.render(uniqueId, decoded);
            if (!isCancelled && target) {
              target.innerHTML = svg;
              const svgEl = target.querySelector('svg');
              if (svgEl) {
                svgEl.removeAttribute('height');
                svgEl.style.maxWidth = '580px';
                svgEl.style.width = '100%';
                svgEl.style.height = 'auto';
                svgEl.style.display = 'block';
                svgEl.style.margin = '0 auto';
              }
            }
          } catch (renderErr) {
            console.error(`Mermaid render failed for target ${i}`, renderErr);
            const lingering = document.getElementById(uniqueId);
            if (lingering) lingering.remove();

            if (!isCancelled && target) {
              target.innerHTML = `
                <div style="text-align: left; width: 100%; max-width: 580px; padding: 14px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); font-family: var(--font-mono); font-size: 11px;">
                  <div style="color: #fbbf24; font-weight: 700; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                    <span>Architecture Diagram Definition</span>
                  </div>
                  <pre style="overflow-x: auto; white-space: pre; padding: 10px; background: #070a10; border-radius: 8px; color: #38bdf8; font-size: 11px; margin: 0;">${decoded.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                </div>
              `;
            }
          }
        }
      } catch (err) {
        console.error('Mermaid initialization error:', err);
      }
    };

    renderAllDiagrams();

    return () => {
      isCancelled = true;
    };
  }, [renderedTheoryHtml, activeTab]);

  const handleCopyCode = () => {
    if (activeCode) {
      navigator.clipboard.writeText(activeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLanguageChange = (lang) => {
    setSelectedLang(lang);
    localStorage.setItem('devtype_preferred_lang', lang);
  };

  const handleLaunchPractice = () => {
    if (!snippet) return;
    const targetLang = selectedLang || snippet.language || 'C++';
    localStorage.setItem('devtype_preferred_lang', targetLang);

    const slugToUse =
      snippet.slugs?.[targetLang] ||
      snippet.slug ||
      snippet.id ||
      `${snippet.key || 'snippet'}-${targetLang.toLowerCase().replace('+', 'p')}`;

    navigate(`/practice?snippet=${slugToUse}&lang=${encodeURIComponent(targetLang)}&lockLang=true`, {
      state: {
        snippet: {
          id: slugToUse,
          slug: slugToUse,
          title: `${snippet.title} (${targetLang})`,
          language: targetLang,
          difficulty: snippet.difficulty || 'Intermediate',
          code: activeCode,
          content: activeCode,
          category: snippet.category,
          track: snippet.track,
          timeComplexity: snippet.timeComplexity,
          spaceComplexity: snippet.spaceComplexity,
          paradigm: snippet.paradigm,
          coreConcept: snippet.coreConcept,
          theory: snippet.theory,
          isLanguageLocked: true,
        },
      },
    });
  };

  if (!snippet) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <Search size={36} color="var(--t3)" />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--t1)' }}>Blueprint Theory Not Found</h2>
        <Link
          to="/templates"
          className="btn btn-primary btn-sm"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 1440, margin: '0 auto', paddingBottom: 96, paddingLeft: 16, paddingRight: 16, userSelect: 'none' }}>
      {/* ── Top Navigation & Breadcrumbs ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20, paddingTop: 8, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--t3)', flexWrap: 'wrap' }}>
          <Link
            to={snippet.track ? `/templates?track=${snippet.track}` : '/templates'}
            className="btn btn-secondary-glass btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', height: 30 }}
          >
            <ArrowLeft size={14} />
            <span>Blueprint Catalog</span>
          </Link>
          <span style={{ color: 'var(--t4)' }}>/</span>
          <span style={{ textTransform: 'uppercase', color: 'var(--t3)', fontWeight: 600 }}>
            {snippet.track === 'foundations'
              ? 'C++ Foundations'
              : snippet.track === 'stl'
              ? 'STL Mastery'
              : snippet.track === 'java-foundations'
              ? 'Java Foundations'
              : snippet.track === 'jcf'
              ? 'Java Collections (JCF)'
              : snippet.category || 'Competitive Algorithms'}
          </span>
          <span style={{ color: 'var(--t4)' }}>/</span>
          <span style={{ color: 'var(--t1)', fontWeight: 700, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {snippet.subCategory || snippet.title}
          </span>
        </div>

        {/* Top Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={handleCopyCode}
            className="btn btn-secondary-glass btn-sm"
            style={{ height: 34, gap: 6 }}
            title={`Copy reference ${selectedLang} implementation`}
          >
            {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} color="var(--brand)" />}
            <span>{copied ? 'Copied' : `Copy ${selectedLang}`}</span>
          </button>

          <button
            onClick={handleLaunchPractice}
            className="btn btn-primary btn-sm"
            style={{ height: 34, gap: 6 }}
          >
            <Terminal size={14} />
            <span>Practice Studio</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 5px', borderRadius: 4, fontSize: '0.65rem' }}>⚡</span>
          </button>
        </div>
      </div>

      {/* ── Hero Title Section ── */}
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        marginBottom: 24,
        background: 'var(--glass-card)',
        backdropFilter: 'blur(20px)',
        padding: '28px',
        borderRadius: '20px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-glass)',
        overflow: 'hidden'
      }}>
        {/* Glow ambient bloom */}
        <div style={{
          position: 'absolute',
          top: -40,
          left: '30%',
          width: 320,
          height: 100,
          background: 'rgba(56, 189, 248, 0.12)',
          filter: 'blur(40px)',
          borderRadius: 9999,
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              padding: '3px 8px',
              borderRadius: 6,
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              border: '1px solid rgba(56, 189, 248, 0.3)'
            }}>
              {snippet.track === 'foundations'
                ? 'C++ FOUNDATIONS // CORE MECHANICS'
                : snippet.track === 'stl'
                ? 'STL MASTERY // STANDARD LIBRARY'
                : snippet.track === 'java-foundations'
                ? 'JAVA FOUNDATIONS // JVM RUNTIME'
                : snippet.track === 'jcf'
                ? 'JAVA COLLECTIONS FRAMEWORK // JCF'
                : `${snippet.category?.toUpperCase() || 'ALGORITHMS & DSA'}`}
            </span>

            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              padding: '3px 8px',
              borderRadius: 6,
              background: 'rgba(129, 140, 248, 0.15)',
              color: '#818cf8',
              fontWeight: 600
            }}>
              {snippet.subCategory || snippet.category}
            </span>

            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              padding: '3px 8px',
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--t2)',
              fontWeight: 600,
              textTransform: 'uppercase'
            }}>
              {getLangBadge(selectedLang)}
            </span>

            <span style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              padding: '3px 10px',
              borderRadius: 6,
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}>
              <Zap size={13} fill="#f59e0b" strokeWidth={0} />
              <span>+{snippet.xpBounty || 70} XP BOUNTY</span>
            </span>
          </div>

          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.02em', margin: 0 }}>
            {snippet.title}
          </h1>

          <p style={{ fontSize: '0.92rem', color: 'var(--t2)', fontFamily: 'var(--font-mono)', lineHeight: 1.6, maxWidth: 960, margin: 0 }}>
            {snippet.description || `${snippet.coreConcept || 'Algorithmic blueprint'} (${snippet.paradigm || 'Optimal invariant'}).`}
          </p>

          {snippet.tags && snippet.tags.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', paddingTop: 4 }}>
              {snippet.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--t3)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── 4 Pillars Executive Architecture Grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          marginTop: 6,
          paddingTop: 16,
          borderTop: '1px solid var(--border-subtle)',
          fontFamily: 'var(--font-mono)',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg-hover-sub)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Brain size={13} color="#38bdf8" /> Paradigm
            </span>
            <span style={{ fontWeight: 700, color: 'var(--t1)', fontSize: '0.82rem' }}>
              {snippet.paradigm || 'Algorithmic State Invariant'}
            </span>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg-hover-sub)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={13} color="#34d399" /> Time Complexity
            </span>
            <span style={{ fontWeight: 800, color: '#34d399', fontSize: '0.82rem' }}>
              {snippet.timeComplexity || 'O(N)'}
            </span>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg-hover-sub)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Cpu size={13} color="#fbbf24" /> Space Complexity
            </span>
            <span style={{ fontWeight: 800, color: '#fbbf24', fontSize: '0.82rem' }}>
              {snippet.spaceComplexity || 'O(1) Auxiliary'}
            </span>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg-hover-sub)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Sparkles size={13} color="#818cf8" /> Core Concept
            </span>
            <span style={{ fontWeight: 700, color: 'var(--t1)', fontSize: '0.82rem' }}>
              {snippet.coreConcept || 'Optimal State Machine'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Layout: Full Study Body ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
        {/* Tab Navigation Strip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--glass-card)',
          borderRadius: 14,
          padding: '4px 12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setActiveTab('theory')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                fontWeight: 700,
                borderBottom: activeTab === 'theory' ? '2px solid #38bdf8' : '2px solid transparent',
                color: activeTab === 'theory' ? '#38bdf8' : 'var(--t3)',
                background: 'transparent',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <BookOpen size={16} />
              <span>Theoretical Foundations &amp; Mathematical Proof</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                fontWeight: 700,
                borderBottom: activeTab === 'code' ? '2px solid #38bdf8' : '2px solid transparent',
                color: activeTab === 'code' ? '#38bdf8' : 'var(--t3)',
                background: 'transparent',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Code2 size={16} />
              <span>{selectedLang} Implementation</span>
              <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.08)', color: 'var(--t3)' }}>
                {(activeCode || '').split('\n').filter(Boolean).length}L
              </span>
            </button>
          </div>

          {/* Quick Language Switcher Dropdown/Pills in Strip for instant access */}
          {availableLanguages.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--t3)', fontWeight: 600 }}>
                Stack:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {availableLanguages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 6,
                      border: selectedLang === lang ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                      background: selectedLang === lang ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255,255,255,0.04)',
                      color: selectedLang === lang ? '#38bdf8' : 'var(--t2)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Active Tab: Theory Article View ── */}
        {activeTab === 'theory' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            borderRadius: 20,
            background: 'var(--glass-card)',
            backdropFilter: 'blur(20px)',
            padding: '28px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-glass)'
          }}>
            {/* Theory Origin Banner */}
            <div style={{
              padding: '16px 18px',
              borderRadius: 12,
              background: 'var(--bg-hover-sub)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14
            }}>
              <ShieldCheck size={24} color="#38bdf8" style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 800, color: 'var(--t1)' }}>
                  {snippet.track === 'foundations'
                    ? 'C++ Language Mechanics & Zero-Cost Abstractions'
                    : snippet.track === 'stl'
                    ? 'Standard Template Library (STL) Architecture & Invariants'
                    : snippet.track === 'java-foundations'
                    ? 'Java Language Mechanics & JVM Runtime Architecture'
                    : snippet.track === 'jcf'
                    ? 'Java Collections Framework (JCF) Memory Models'
                    : 'Rigorous Algorithmic Specification & Asymptotic Proof'}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--t2)', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>
                  {snippet.track === 'foundations'
                    ? 'Master underlying memory layouts, references, stream buffer mechanics, and C++ idioms.'
                    : snippet.track === 'stl'
                    ? 'Inspect asymptotic container invariants, iterator invalidation rules, and performance guarantees.'
                    : snippet.track === 'java-foundations'
                    ? 'Master JVM heap/stack layouts, compressed OOPs, object headers, garbage collection dynamics, and type erasure.'
                    : snippet.track === 'jcf'
                    ? 'Inspect amortized asymptotic bounds, modCount fail-fast invariants, resize thresholds, and thread-safety semantics.'
                    : 'Study problem formulations, mathematical state invariants, and asymptotic proofs. Formulas are typeset via LaTeX notation.'}
                </span>
              </div>
            </div>

            {/* Rendered Markdown + KaTeX Math Content */}
            <article
              ref={articleRef}
              className="theory-article"
              dangerouslySetInnerHTML={{ __html: renderedTheoryHtml }}
            />

            {/* Bottom Study CTA */}
            <div style={{
              marginTop: 32,
              paddingTop: 20,
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              background: 'var(--bg-hover-sub)',
              padding: '20px',
              borderRadius: 14,
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--t1)', fontFamily: 'var(--font-mono)' }}>
                  Concepts Mastered? Test Your Algorithmic Muscle Memory
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
                  Launch the Practice Studio to drill the {selectedLang} syntax under timed active recall conditions.
                </span>
              </div>

              <button
                onClick={handleLaunchPractice}
                className="btn btn-primary"
                style={{ padding: '10px 22px', fontSize: '0.85rem', gap: 8 }}
              >
                <Terminal size={16} />
                <span>Drill in Studio</span>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 4, fontSize: '0.68rem' }}>⚡</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Active Tab: Code Implementation View ── */}
        {activeTab === 'code' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Multi-Language Switcher Toolbar */}
            {availableLanguages.length > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
                padding: '12px 16px',
                borderRadius: 12,
                background: 'var(--glass-card)',
                border: '1px solid var(--border-subtle)'
              }}>
                <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--t2)' }}>
                  Switch Implementation Stack:
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageChange(lang)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        border: selectedLang === lang ? '1.5px solid #38bdf8' : '1px solid var(--border-subtle)',
                        background: selectedLang === lang ? 'rgba(56, 189, 248, 0.16)' : 'rgba(255,255,255,0.04)',
                        color: selectedLang === lang ? '#38bdf8' : 'var(--t1)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Code2 size={12} color={selectedLang === lang ? '#38bdf8' : 'var(--t3)'} />
                      <span>{lang}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* VS Code Dark Editor Card */}
            <div className="vscode-code-card" style={{ borderRadius: 14, overflow: 'hidden' }}>
              <div className="vscode-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56', display: 'inline-block', opacity: 0.85 }} />
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e', display: 'inline-block', opacity: 0.85 }} />
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f', display: 'inline-block', opacity: 0.85 }} />
                  </div>
                  <div className="vscode-tab" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600 }}>
                    <Terminal size={13} color="#38bdf8" />
                    <span>{snippet.slug || snippet.key || 'Solution'}.{getFileExtension(selectedLang)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4, background: '#333333', color: '#a0a0a0', fontWeight: 700 }}>
                    {getLangBadge(selectedLang)}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: '#2d2d2d',
                      border: '1px solid #404040',
                      color: '#9cdcfe',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title={`Copy reference ${selectedLang} implementation`}
                  >
                    {copied ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
              </div>

              {/* Code Box with VS Code Theme & Line Numbers */}
              <div className="vscode-editor" style={{ padding: '16px', overflowX: 'auto', fontSize: '0.8rem', lineHeight: 1.6 }}>
                <pre className="vscode-code-body" style={{ margin: 0, padding: 0, fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.65 }}>
                  <code dangerouslySetInnerHTML={{ __html: highlightedBlueprintCode }} />
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ── Previous / Next Blueprint Navigation ── */}
        {(prevSnippet || nextSnippet) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginTop: 10 }}>
            {prevSnippet ? (
              <button
                onClick={() => navigate(`/theory/${prevSnippet.slug || prevSnippet.key || prevSnippet.id}`)}
                className="btn btn-secondary-glass"
                style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, height: 'auto', textAlign: 'left', cursor: 'pointer' }}
              >
                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ArrowLeft size={12} />
                  <span>Previous Blueprint</span>
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--t1)', fontFamily: 'var(--font-mono)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {prevSnippet.title}
                </span>
              </button>
            ) : <div />}

            {nextSnippet && (
              <button
                onClick={() => navigate(`/theory/${nextSnippet.slug || nextSnippet.key || nextSnippet.id}`)}
                className="btn btn-secondary-glass"
                style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, height: 'auto', textAlign: 'right', cursor: 'pointer' }}
              >
                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>Next Blueprint</span>
                  <ArrowRight size={12} />
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--t1)', fontFamily: 'var(--font-mono)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {nextSnippet.title}
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
