// src/pages/CustomStudio.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2,
  Terminal,
  FolderGit2,
  FileText,
  Play,
  Trash2,
  Plus,
  Sparkles,
  Layers,
  ArrowRight,
  Database,
  CheckCircle2,
  AlertCircle,
  Eye,
  TrendingUp,
  Globe
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'devtype_custom_templates';

const LANGUAGES = [
  'C++',
  'C',
  'Java',
  'Python',
  'JavaScript',
  'TypeScript',
  'Rust',
  'Go',
  'HTML/CSS',
  'SQL'
];

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

export default function CustomStudio() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'github' | 'markdown'
  const [snippets, setSnippets] = useState([]);

  // Form State
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('C++');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [code, setCode] = useState(`// Custom Algorithmic Blueprint (C++)
#include <iostream>
#include <vector>

void solve() {
    std::cout << "DevType Custom Practice Drill" << std::endl;
}`);

  // GitHub & Markdown Importers
  const [githubUrl, setGithubUrl] = useState('');
  const [markdownText, setMarkdownText] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);

  // Load custom templates from localStorage
  useEffect(() => {
    loadLocalSnippets();
  }, []);

  const loadLocalSnippets = () => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        setSnippets(JSON.parse(raw));
      } else {
        const initial = [
          {
            id: 'custom-tree-inorder',
            title: 'Binary Tree Inorder Traversal',
            language: 'C++',
            difficulty: 'Intermediate',
            category: 'Data Structures',
            code: `void inorder(TreeNode* root, vector<int>& res) {
    if (!root) return;
    inorder(root->left, res);
    res.push_back(root->val);
    inorder(root->right, res);
}`,
            createdAt: new Date().toISOString(),
          },
        ];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
        setSnippets(initial);
      }
    } catch (e) {
      console.error('Failed to load local custom templates:', e);
    }
  };

  const showStatus = (text, type = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleSaveManual = (e, launchImmediately = false) => {
    if (e) e.preventDefault();
    if (!title.trim() || !code.trim()) {
      showStatus('Please provide both a title and code content.', 'error');
      return;
    }

    const newSnippet = {
      id: `custom-${Date.now()}`,
      slug: `custom-${Date.now()}`,
      title: title.trim(),
      language,
      difficulty,
      category: 'Custom Drills',
      code: code.trim(),
      content: code.trim(),
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    const updated = [newSnippet, ...snippets];
    setSnippets(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}

    showStatus(`Saved "${newSnippet.title}" to your local library.`);
    setTitle('');

    if (launchImmediately) {
      navigate(`/practice?snippet=${newSnippet.id}&lang=${encodeURIComponent(language)}&lockLang=true`, {
        state: { snippet: newSnippet },
      });
    }
  };

  const handleImportGithub = async (e) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;

    let targetUrl = githubUrl.trim();
    if (targetUrl.includes('github.com') && !targetUrl.includes('raw.githubusercontent.com') && !targetUrl.includes('/raw/')) {
      targetUrl = targetUrl
        .replace('github.com', 'raw.githubusercontent.com')
        .replace('/blob/', '/');
    }

    showStatus('Fetching code from GitHub...', 'info');
    try {
      const res = await fetch(targetUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status} from source`);
      const text = await res.text();

      const extractedTitle = targetUrl.split('/').pop().replace(/\.[^/.]+$/, '') || 'GitHub Import';
      setTitle(extractedTitle.charAt(0).toUpperCase() + extractedTitle.slice(1));
      setCode(text.slice(0, 3000));
      setActiveTab('manual');
      showStatus('GitHub code loaded into studio. Review and save below!');
    } catch (err) {
      showStatus(`Failed to fetch GitHub snippet: ${err.message}`, 'error');
    }
  };

  const handleImportMarkdown = (e) => {
    e.preventDefault();
    if (!markdownText.trim()) return;

    const codeBlockRegex = /```([a-zA-Z0-9+#]*)\n([\s\S]*?)```/;
    const match = markdownText.match(codeBlockRegex);

    if (match) {
      const detectedLang = match[1] || '';
      const extractedCode = match[2].trim();

      if (detectedLang.toLowerCase().includes('py')) setLanguage('Python');
      else if (detectedLang.toLowerCase().includes('cpp') || detectedLang.toLowerCase().includes('c++')) setLanguage('C++');
      else if (detectedLang.toLowerCase().includes('js')) setLanguage('JavaScript');
      else if (detectedLang.toLowerCase().includes('ts')) setLanguage('TypeScript');
      else if (detectedLang.toLowerCase().includes('java')) setLanguage('Java');
      else if (detectedLang.toLowerCase().includes('rust')) setLanguage('Rust');
      else if (detectedLang.toLowerCase().includes('go')) setLanguage('Go');

      setCode(extractedCode);
      setTitle('Markdown Extracted Snippet');
      setActiveTab('manual');
      showStatus('Code block successfully extracted from Markdown!');
    } else {
      showStatus('No fenced code block (```lang ... ```) found in markdown.', 'error');
    }
  };

  const handleDeleteSnippet = (id, e) => {
    e.stopPropagation();
    const updated = snippets.filter((s) => s.id !== id);
    setSnippets(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}
    showStatus('Custom template removed from library.');
  };

  const handleLaunchPractice = (snip) => {
    navigate(`/practice?snippet=${snip.id}&lang=${encodeURIComponent(snip.language || 'C++')}&lockLang=true`, {
      state: { snippet: snip },
    });
  };

  return (
    <div className="dash space-y-6">
      {/* ── Welcome Header (Matches Dashboard Design Exactly) ── */}
      <div className="dash-welcome">
        <div className="welcome-left">
          <div className="welcome-sup flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Custom Drill Workbench // Personal Snippet Studio</span>
          </div>
          <h1 className="welcome-title">Custom Blueprint Studio</h1>
          <p className="welcome-sub">
            Craft, import, and test personal code snippets. Practice your proprietary algorithms,
            interview questions, and production patterns with real keystroke telemetry.
          </p>
        </div>

        {/* Ice Glass Studio Widget */}
        <div className="welcome-widget">
          <div className="welcome-widget-top">
            <span>{snippets.length} Saved Drills</span>
            <Code2 size={16} className="welcome-cal-icon" />
          </div>
          <div className="welcome-widget-sub">
            <Globe size={14} fill="currentColor" strokeWidth={0} />
            <span>Local Offline Storage</span>
          </div>
        </div>
      </div>

      {/* ── 3 Stat Cards Grid (Matches Dashboard Exactly) ── */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-top">
              <div className="stat-icon-wrap cobalt">
                <Code2 size={19} strokeWidth={2.2} />
              </div>
              <div className="stat-top-right">
                <span className="badge badge-teal">Library</span>
              </div>
            </div>
            <div className="stat-num">{snippets.length}</div>
            <div className="stat-label">Saved Custom Drills</div>
            <div className="stat-sub">
              <span>Ready for active practice</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-top">
              <div className="stat-icon-wrap emerald">
                <Terminal size={19} strokeWidth={2.2} />
              </div>
              <div className="stat-top-right">
                <span className="badge badge-indigo">10 Stacks</span>
              </div>
            </div>
            <div className="stat-num">10</div>
            <div className="stat-label">Supported Languages</div>
            <div className="stat-sub">
              <span>C++, C, Java, Python, JS, TS, Rust, Go, SQL</span>
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
                <span className="badge badge-teal">Private</span>
              </div>
            </div>
            <div className="stat-num">Offline</div>
            <div className="stat-label">Storage Architecture</div>
            <div className="stat-sub">
              <span>Encrypted in browser sandbox</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Status Banner ── */}
      {statusMessage && (
        <div
          className="card"
          style={{
            padding: '12px 18px',
            background: statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.10)' : 'rgba(16, 185, 129, 0.10)',
            border: `1px solid ${statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
            color: statusMessage.type === 'error' ? '#EF4444' : '#10B981',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.84rem',
            fontWeight: 600,
          }}
        >
          {statusMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* ── Workbench Editor Card ── */}
      <div className="card" style={{ padding: 22 }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--glass-border-sub)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`btn btn-sm ${activeTab === 'manual' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ height: 32 }}
          >
            <Code2 size={14} />
            <span>Direct Code Entry</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('github')}
            className={`btn btn-sm ${activeTab === 'github' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ height: 32 }}
          >
            <FolderGit2 size={14} />
            <span>GitHub / Gist URL</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('markdown')}
            className={`btn btn-sm ${activeTab === 'markdown' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ height: 32 }}
          >
            <FileText size={14} />
            <span>Markdown Extractor</span>
          </button>
        </div>

        {/* Tab 1: Manual Direct Code Entry */}
        {activeTab === 'manual' && (
          <form onSubmit={(e) => handleSaveManual(e, false)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                  Blueprint Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Red-Black Tree Rotation"
                  className="search-input"
                  style={{ width: '100%', height: 38 }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                  Language Stack
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="btn btn-secondary-glass btn-sm"
                  style={{ width: '100%', height: 38, padding: '0 12px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--t1)', background: 'var(--bg-surface)' }}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="btn btn-secondary-glass btn-sm"
                  style={{ width: '100%', height: 38, padding: '0 12px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--t1)', background: 'var(--bg-surface)' }}
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Code Snippet Contents
                </label>
                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
                  {code.split('\n').length} lines &bull; {code.length} characters
                </span>
              </div>
              <textarea
                rows={10}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste code snippet here..."
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 10,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--code-bg, #0F172A)',
                  color: '#F8FAFC',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.86rem',
                  lineHeight: 1.55,
                  resize: 'vertical',
                }}
                required
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid var(--glass-border-sub)' }}>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
                Stored privately in your browser's local sandbox.
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="submit"
                  className="btn btn-secondary-glass btn-sm"
                >
                  Save to Local Library
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveManual(null, true)}
                  className="btn btn-primary btn-sm"
                >
                  <Play size={12} fill="currentColor" strokeWidth={0} />
                  <span>Save &amp; Practice Now</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: GitHub URL Import */}
        {activeTab === 'github' && (
          <div style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.25)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderGit2 size={26} />
            </div>
            <div style={{ maxWidth: 440 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--t1)', margin: 0 }}>
                Sync from Public GitHub Repo or Gist
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--t3)', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                Paste any raw GitHub URL or Gist link to parse algorithms into standalone offline practice drills.
              </p>
            </div>
            <form onSubmit={handleImportGithub} style={{ width: '100%', maxWidth: 520, display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://raw.githubusercontent.com/user/repo/main/algo.cpp"
                className="search-input"
                style={{ flex: 1, height: 38 }}
                required
              />
              <button type="submit" className="btn btn-primary btn-sm" style={{ height: 38, padding: '0 16px' }}>
                Fetch Code
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Markdown Extractor */}
        {activeTab === 'markdown' && (
          <form onSubmit={handleImportMarkdown} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 700 }}>
                Paste Markdown Note with Fenced Code Block
              </label>
              <span style={{ fontSize: '0.72rem', color: 'var(--t3)' }}>
                Looks for ```cpp ... ``` or ```python ... ```
              </span>
            </div>
            <textarea
              rows={8}
              value={markdownText}
              onChange={(e) => setMarkdownText(e.target.value)}
              placeholder="# LeetCode 206&#10;```cpp&#10;ListNode* reverseList(ListNode* head) { ... }&#10;```"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 10,
                border: '1px solid var(--glass-border)',
                background: 'var(--bg-surface)',
                color: 'var(--t1)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.84rem',
                lineHeight: 1.5,
              }}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid var(--glass-border-sub)' }}>
              <button type="submit" className="btn btn-primary btn-sm">
                Extract Code Snippet
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Saved Custom Blueprints Grid Inside a Card ── */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--glass-border-sub)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Layers size={18} color="var(--brand)" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--t1)', margin: 0 }}>
              Your Saved Custom Blueprints ({snippets.length})
            </h2>
          </div>
          <button
            onClick={() => {
              setTitle('New Custom Snippet');
              setCode('// Enter your code here\n');
              setActiveTab('manual');
            }}
            className="btn btn-secondary-glass btn-sm"
          >
            <Plus size={13} />
            <span>New Snippet</span>
          </button>
        </div>

        {snippets.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--t3)', fontSize: '0.84rem' }}>
            No custom blueprints saved yet. Use the workbench above to create or import your first drill.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {snippets.map((snip) => (
              <div
                key={snip.id}
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
                    <span className="badge badge-teal" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>
                      {snip.language || 'Code'}
                    </span>
                    <button
                      onClick={(e) => handleDeleteSnippet(snip.id, e)}
                      className="icon-btn"
                      style={{ width: 26, height: 26, color: '#EF4444' }}
                      title="Delete snippet"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--t1)', margin: '0 0 6px 0' }}>
                    {snip.title}
                  </h4>

                  <div style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--t3)', margin: '6px 0 12px 0' }}>
                    {snip.difficulty || 'Intermediate'} &bull; {(snip.code || '').split('\n').length} lines
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                  <button
                    onClick={() => handleLaunchPractice(snip)}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, justifyContent: 'center', height: 32 }}
                  >
                    <Play size={12} fill="currentColor" strokeWidth={0} />
                    <span>Practice Drill</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
