// src/pages/CustomStudio.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Globe,
  Upload,
  Download,
  Edit2,
  X,
  Clock,
  Zap,
  Repeat,
  Bookmark,
  Sparkle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { snippetService } from '../services/snippetService';
import { aiService } from '../services/aiService';

const LANGUAGES = [
  'TypeScript',
  'JavaScript',
  'C++',
  'C',
  'Java',
  'Python',
  'Rust',
  'Go',
  'HTML/CSS',
  'SQL'
];

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

export default function CustomStudio() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'github' | 'markdown' | 'ai'
  const [snippets, setSnippets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Editing state
  const [editingId, setEditingId] = useState(null);

  // Form State (Starts completely empty for user to fill)
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('TypeScript');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [tags, setTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [code, setCode] = useState('');

  // Importers State
  const [githubUrl, setGithubUrl] = useState('');
  const [markdownText, setMarkdownText] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);

  // Fireworks AI DeepSeek Generator State
  const [aiTopic, setAiTopic] = useState('');
  const [aiLanguage, setAiLanguage] = useState('TypeScript');
  const [aiDifficulty, setAiDifficulty] = useState('Intermediate');
  const [aiExerciseType, setAiExerciseType] = useState('Algorithm');
  const [aiInstructions, setAiInstructions] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiQuota, setAiQuota] = useState(null);
  const [aiSavedTemplates, setAiSavedTemplates] = useState([]);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setLanguage('TypeScript');
    setDifficulty('Intermediate');
    setTags([]);
    setNewTagInput('');
    setCode('');
  };

  const loadSnippets = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await snippetService.getCustomSnippets(user?.id);
      setSnippets(list);
    } catch (err) {
      console.error('Failed to load custom snippets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadSnippets();
  }, [loadSnippets]);

  const showStatus = (text, type = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const loadAiQuota = async () => {
    try {
      const q = await aiService.getQuota();
      if (q) setAiQuota(q);
    } catch (e) {
      console.debug('Failed to load AI quota:', e);
    }
  };

  const loadAiSavedTemplates = async () => {
    try {
      const list = await aiService.getSavedTemplates();
      if (Array.isArray(list)) setAiSavedTemplates(list);
    } catch (e) {
      console.debug('Failed to load saved AI templates:', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'ai') {
      loadAiQuota();
      loadAiSavedTemplates();
    }
  }, [activeTab]);

  const handleGenerateAi = async (e) => {
    e.preventDefault();
    if (!aiTopic.trim()) {
      showStatus('Please specify an algorithm or engineering topic for AI generation.', 'error');
      return;
    }
    setAiGenerating(true);
    setAiResult(null);
    showStatus('Dispatching generation task to Fireworks AI (DeepSeek V4 Pro)...', 'info');
    try {
      const result = await aiService.generateTemplate({
        language: aiLanguage,
        difficulty: aiDifficulty.toUpperCase(),
        topic: aiTopic.trim(),
        exerciseType: aiExerciseType,
        targetLength: 'Balanced (20-35 lines)',
        customInstructions: aiInstructions.trim() || undefined,
      });
      setAiResult(result);
      if (result.remainingHourlyQuota !== undefined) {
        setAiQuota((prev) => (prev ? { ...prev, remainingInLastHour: result.remainingHourlyQuota } : null));
      }
      showStatus(`Generated "${result.title}" via DeepSeek V4 Pro!`, 'success');
    } catch (err) {
      console.error('AI Generation failed:', err);
      showStatus(err.message || 'Failed to generate code template with AI. Please check quota or try again.', 'error');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveAiTemplate = async () => {
    if (!aiResult) return;
    try {
      const diffFormatted = aiResult.difficulty
        ? aiResult.difficulty.charAt(0).toUpperCase() + aiResult.difficulty.slice(1).toLowerCase()
        : 'Intermediate';

      const snippetPayload = {
        title: aiResult.title,
        language: aiResult.language,
        difficulty: diffFormatted,
        drillMode: 'standard',
        category: 'Custom Drills',
        tags: ['ai-generated', aiResult.language.toLowerCase(), (aiResult.topic || 'drill').toLowerCase()],
        code: aiResult.code,
        xpBounty: diffFormatted === 'Advanced' ? 100 : diffFormatted === 'Intermediate' ? 60 : 40,
      };

      // 1. Save directly to Custom Blueprints so it appears in "Your Saved Custom Blueprints"
      const savedSnippet = await snippetService.createSnippet(snippetPayload, user?.id);

      // 2. Also sync to backend AI templates library for redundancy
      try {
        await aiService.saveTemplate({
          title: aiResult.title,
          description: aiResult.description || `AI-generated ${aiResult.language} ${diffFormatted} drill`,
          language: aiResult.language,
          difficulty: aiResult.difficulty,
          category: 'AI Generated',
          content: aiResult.code,
          estimatedDurationSeconds: aiResult.estimatedDurationSeconds || 90,
        });
        await loadAiSavedTemplates();
      } catch (backendErr) {
        console.warn('AI template backend sync notice:', backendErr);
      }

      const savedTitle = savedSnippet?.title || aiResult.title;
      showStatus(`Saved "${savedTitle}" to your Saved Custom Blueprints!`, 'success');

      // Refresh blueprints list so the new snippet appears immediately in the grid
      await loadSnippets();

      // Empty generated fields and clear input prompt so it's ready for the next input
      setAiResult(null);
      setAiTopic('');
      setAiInstructions('');
    } catch (err) {
      console.error('Failed to save AI template:', err);
      showStatus(err.message || 'Failed to save template to custom blueprints.', 'error');
    }
  };

  const handleSendAiToWorkbench = () => {
    if (!aiResult) return;
    setTitle(aiResult.title);
    setLanguage(aiResult.language);
    setDifficulty(aiResult.difficulty.charAt(0).toUpperCase() + aiResult.difficulty.slice(1).toLowerCase());
    setTags(['ai-generated', aiResult.language.toLowerCase(), (aiResult.topic || 'drill').toLowerCase()]);
    setCode(aiResult.code);
    setActiveTab('manual');
    window.scrollTo({ top: 400, behavior: 'smooth' });
    showStatus(`Loaded "${aiResult.title}" into Workbench editor.`);
  };

  const handlePracticeAiDirectly = (tpl) => {
    const target = tpl || aiResult;
    if (!target) return;
    const snippetData = {
      id: target.id || 'ai-session-' + Date.now(),
      title: target.title,
      language: target.language,
      difficulty: target.difficulty,
      content: target.code || target.content,
      code: target.code || target.content,
    };
    navigate(`/practice?lang=${encodeURIComponent(target.language)}&mode=standard&lockLang=true`, {
      state: { snippet: snippetData, mode: 'standard' },
    });
  };

  // Tag Management
  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = newTagInput.trim().replace(/^#/, '');
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setNewTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Edit Snippet Workflow
  const handleEditSnippet = (snip) => {
    setEditingId(snip.id);
    setTitle(snip.title || '');
    setLanguage(snip.language || 'TypeScript');
    setDifficulty(snip.difficulty || 'Intermediate');
    setTags(Array.isArray(snip.tags) ? snip.tags : []);
    setCode(snip.code || snip.content || '');
    setActiveTab('manual');
    window.scrollTo({ top: 400, behavior: 'smooth' });
    showStatus(`Editing "${snip.title}". Update code and click Update Blueprint below.`);
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  // Save / Update Snippet
  const handleSaveManual = async (e, launchImmediately = false) => {
    if (e) e.preventDefault();
    if (!title.trim() || !code.trim()) {
      showStatus('Please provide both a title and code content.', 'error');
      return;
    }

    const snippetPayload = {
      title: title.trim(),
      language,
      difficulty,
      drillMode: 'standard',
      category: 'Custom Drills',
      tags,
      code: code.trim(),
      xpBounty: difficulty === 'Advanced' ? 100 : difficulty === 'Intermediate' ? 60 : 40,
    };

    let result = null;
    if (editingId) {
      result = await snippetService.updateSnippet(editingId, snippetPayload, user?.id);
      showStatus(`Updated "${result.title}" in your studio library.`);
    } else {
      result = await snippetService.createSnippet(snippetPayload, user?.id);
      showStatus(`Saved "${result.title}" to your studio library.`);
    }

    resetForm();
    await loadSnippets();

    if (launchImmediately && result) {
      navigate(`/practice?snippet=${result.id}&lang=${encodeURIComponent(language)}&mode=standard&lockLang=true`, {
        state: { snippet: result, mode: 'standard' },
      });
    }
  };

  // GitHub / Gist URL Importer
  const handleImportGithub = async (e) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;

    let targetUrl = githubUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    // Handle gist.github.com
    if (targetUrl.includes('gist.github.com')) {
      targetUrl = targetUrl.replace('gist.github.com', 'gist.githubusercontent.com');
      if (!targetUrl.endsWith('/raw')) {
        targetUrl = targetUrl.replace(/\/$/, '') + '/raw';
      }
    } else if (targetUrl.includes('github.com') && !targetUrl.includes('raw.githubusercontent.com')) {
      targetUrl = targetUrl
        .replace('github.com', 'raw.githubusercontent.com')
        .replace('/blob/', '/');
    }

    showStatus('Fetching raw code from repository...', 'info');
    try {
      const res = await fetch(targetUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status} from source`);
      const text = await res.text();

      // Infer language from URL
      let inferredLang = 'TypeScript';
      const cleanUrl = targetUrl.split('?')[0].split('#')[0].toLowerCase();
      if (cleanUrl.endsWith('.py')) inferredLang = 'Python';
      else if (cleanUrl.endsWith('.java')) inferredLang = 'Java';
      else if (cleanUrl.endsWith('.cpp') || cleanUrl.endsWith('.cc') || cleanUrl.endsWith('.cxx') || cleanUrl.endsWith('.h') || cleanUrl.endsWith('.hpp')) inferredLang = 'C++';
      else if (cleanUrl.endsWith('.c')) inferredLang = 'C';
      else if (cleanUrl.endsWith('.rs')) inferredLang = 'Rust';
      else if (cleanUrl.endsWith('.go')) inferredLang = 'Go';
      else if (cleanUrl.endsWith('.sql')) inferredLang = 'SQL';
      else if (cleanUrl.endsWith('.js') || cleanUrl.endsWith('.jsx') || cleanUrl.endsWith('.mjs')) inferredLang = 'JavaScript';
      else if (cleanUrl.endsWith('.ts') || cleanUrl.endsWith('.tsx')) inferredLang = 'TypeScript';
      else if (cleanUrl.endsWith('.html') || cleanUrl.endsWith('.css')) inferredLang = 'HTML/CSS';

      const segments = targetUrl.split('?')[0].split('/');
      const rawName = decodeURIComponent(segments[segments.length - 1]).replace(/\.[^/.]+$/, '').replace(/-|_/g, ' ');
      const extractedTitle = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : 'GitHub Import';

      setTitle(extractedTitle);
      setLanguage(inferredLang);
      setCode(text.trim());
      setTags(['github-import', inferredLang.toLowerCase()]);
      setGithubUrl('');
      setActiveTab('manual');
      showStatus(`GitHub code for "${extractedTitle}" loaded into studio. Review and click Save!`);
    } catch (err) {
      showStatus(`Failed to fetch snippet: ${err.message}. Ensure the URL points to raw code.`, 'error');
    }
  };

  // Markdown Extractor: Extracts ALL code blocks in notes
  const handleImportMarkdown = async (e) => {
    e.preventDefault();
    if (!markdownText.trim()) return;

    const regex = /```([a-zA-Z0-9+#_-]*)[^\S\r\n]*\r?\n([\s\S]*?)```/g;
    let match;
    let count = 0;

    while ((match = regex.exec(markdownText)) !== null) {
      const rawLang = match[1] || '';
      const snippetCode = match[2].trim();
      if (!snippetCode) continue;

      let parsedLang = 'TypeScript';
      const l = rawLang.toLowerCase();
      if (l.includes('py')) parsedLang = 'Python';
      else if (l.includes('cpp') || l.includes('c++')) parsedLang = 'C++';
      else if (l.includes('java')) parsedLang = 'Java';
      else if (l.includes('c') && !l.includes('css')) parsedLang = 'C';
      else if (l.includes('ts')) parsedLang = 'TypeScript';
      else if (l.includes('js')) parsedLang = 'JavaScript';
      else if (l.includes('rust') || l.includes('rs')) parsedLang = 'Rust';
      else if (l.includes('go')) parsedLang = 'Go';
      else if (l.includes('sql')) parsedLang = 'SQL';
      else if (l.includes('html') || l.includes('css')) parsedLang = 'HTML/CSS';

      count++;

      const beforeText = markdownText.slice(0, match.index);
      const headingMatches = [...beforeText.matchAll(/(?:^|\n)#{1,6}\s+([^\n]+)/g)];
      let extractedTitle = `Study Note Drill #${count} (${parsedLang})`;
      if (headingMatches.length > 0) {
        const lastHeading = headingMatches[headingMatches.length - 1][1].trim();
        if (lastHeading) extractedTitle = `${lastHeading} (${parsedLang})`;
      }

      await snippetService.createSnippet({
        title: extractedTitle,
        language: parsedLang,
        difficulty: 'Intermediate',
        drillMode: 'standard',
        code: snippetCode,
        tags: ['markdown-extracted', parsedLang.toLowerCase()],
        xpBounty: 60,
      }, user?.id);
    }

    if (count > 0) {
      setMarkdownText('');
      showStatus(`Extracted and cataloged ${count} snippets from your markdown notes!`);
      await loadSnippets();
    } else {
      showStatus('No fenced code blocks (```lang ... ```) found in the pasted markdown.', 'error');
    }
  };

  // Delete Snippet
  const handleDeleteSnippet = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this custom blueprint?')) return;
    await snippetService.deleteSnippet(id, user?.id);
    await loadSnippets();
    showStatus('Custom template removed from library.');
  };

  // Launch Practice
  const handleLaunchPractice = (snip) => {
    navigate(`/practice?snippet=${snip.id}&lang=${encodeURIComponent(snip.language || 'TypeScript')}&mode=standard&lockLang=true`, {
      state: { snippet: snip, mode: 'standard' },
    });
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snippets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `devtype-custom-snippets-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showStatus(`Exported ${snippets.length} blueprints as JSON.`);
  };

  // Import JSON File
  const handleImportJsonFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed)) {
          let importedCount = 0;
          for (const item of parsed) {
            if (item.title && (item.code || item.content)) {
              await snippetService.createSnippet({
                title: item.title,
                language: item.language || 'TypeScript',
                difficulty: item.difficulty || 'Intermediate',
                drillMode: 'standard',
                code: item.code || item.content,
                tags: item.tags || ['imported'],
                xpBounty: item.xpBounty || 60,
              }, user?.id);
              importedCount++;
            }
          }
          await loadSnippets();
          showStatus(`Successfully imported ${importedCount} custom blueprints from JSON!`);
        } else {
          showStatus('Invalid JSON format: Expected an array of snippets.', 'error');
        }
      } catch (err) {
        showStatus(`Failed to parse JSON file: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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
            <span>Local &amp; Server Synced</span>
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
              <span>TypeScript, Python, Java, C++, Rust, Go, SQL</span>
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
                <span className="badge badge-teal">Resilient</span>
              </div>
            </div>
            <div className="stat-num">Dual-Layer</div>
            <div className="stat-label">Storage Architecture</div>
            <div className="stat-sub">
              <span>REST API + Offline Indexed Sandbox</span>
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
            background: statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.10)' : statusMessage.type === 'info' ? 'rgba(59, 130, 246, 0.10)' : 'rgba(16, 185, 129, 0.10)',
            border: `1px solid ${statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.25)' : statusMessage.type === 'info' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
            color: statusMessage.type === 'error' ? '#EF4444' : statusMessage.type === 'info' ? '#38BDF8' : '#10B981',
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
        {/* Navigation Tabs & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--glass-border-sub)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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

            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              className={`btn btn-sm ${activeTab === 'ai' ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                height: 32,
                background: activeTab === 'ai' ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : undefined,
                color: activeTab === 'ai' ? '#fff' : 'var(--t1)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Sparkles size={14} />
              <span>Fireworks AI</span>
              <span
                style={{
                  fontSize: '0.62rem',
                  padding: '1px 5px',
                  borderRadius: 4,
                  background: activeTab === 'ai' ? 'rgba(255,255,255,0.25)' : 'rgba(99, 102, 241, 0.15)',
                  color: activeTab === 'ai' ? '#fff' : '#818cf8',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                DeepSeek V4
              </span>
            </button>
          </div>

          {/* Quick Import / Export Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportJsonFile}
              accept=".json"
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary-glass btn-sm"
              title="Import custom blueprints from a JSON file"
              style={{ height: 32 }}
            >
              <Upload size={13} />
              <span>Import JSON</span>
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="btn btn-secondary-glass btn-sm"
              title="Export all custom blueprints to JSON"
              style={{ height: 32 }}
            >
              <Download size={13} />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Manual Direct Code Entry */}
        {activeTab === 'manual' && (
          <form onSubmit={(e) => handleSaveManual(e, false)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {editingId && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: 8 }}>
                <span style={{ fontSize: '0.8rem', color: '#38BDF8', fontWeight: 600 }}>
                  Editing Blueprint: <strong>{title}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn btn-ghost btn-xs"
                  style={{ color: 'var(--t3)', height: 24 }}
                >
                  Cancel Edit
                </button>
              </div>
            )}

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

            {/* Tags Management */}
            <div>
              <label style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                Tags &amp; Categories (Press Enter or Comma to add)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, padding: '6px 10px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="badge badge-teal"
                    style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px' }}
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', display: 'flex' }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder={tags.length === 0 ? "Add tags (e.g. dynamic-programming, arrays)..." : "Add more..."}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--t1)',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-mono)',
                    flex: 1,
                    minWidth: 120,
                  }}
                />
              </div>
            </div>

            {/* Code Snippet Contents */}
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



            {/* Form Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid var(--glass-border-sub)' }}>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
                Dual-layer persistence: REST API + offline browser sandbox.
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="submit"
                  className="btn btn-secondary-glass btn-sm"
                >
                  {editingId ? 'Update Blueprint' : 'Save to Studio Library'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveManual(null, true)}
                  className="btn btn-primary btn-sm"
                >
                  <Play size={12} fill="currentColor" strokeWidth={0} />
                  <span>{editingId ? 'Update & Practice' : 'Save & Practice Now'}</span>
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
                Paste any raw GitHub URL, blob link, or Gist URL to parse code into standalone practice drills.
              </p>
            </div>
            <form onSubmit={handleImportGithub} style={{ width: '100%', maxWidth: 520, display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/user/repo/blob/main/algo.cpp"
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
                Paste Markdown Note with Fenced Code Blocks
              </label>
              <span style={{ fontSize: '0.72rem', color: 'var(--t3)' }}>
                Extracts all ```lang ... ``` blocks automatically
              </span>
            </div>
            <textarea
              rows={8}
              value={markdownText}
              onChange={(e) => setMarkdownText(e.target.value)}
              placeholder="# LeetCode Study Notes&#10;&#10;```cpp&#10;ListNode* reverseList(ListNode* head) { ... }&#10;```&#10;&#10;```python&#10;def binary_search(nums, target): ...&#10;```"
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
                Extract All Code Snippets
              </button>
            </div>
          </form>
        )}

        {/* Tab 4: Fireworks AI DeepSeek Generator */}
        {activeTab === 'ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header / Model Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                padding: '14px 18px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12), rgba(124, 58, 237, 0.08))',
                border: '1px solid rgba(99, 102, 241, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
                  }}
                >
                  <Sparkles size={18} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--t1)' }}>
                      Fireworks AI Engine
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: '#818cf8',
                        fontWeight: 700,
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                      }}
                    >
                      accounts/fireworks/models/deepseek-v4-pro-0813
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--t3)' }}>
                    Generate production-grade algorithmic drills, concurrency primitives, and idiomatic patterns with verified typing metrics.
                  </p>
                </div>
              </div>

              {/* Quota Pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 14px',
                  borderRadius: 999,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--glass-border)',
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--t2)',
                }}
              >
                <Zap size={14} color="#38bdf8" />
                <span>
                  Quota:{' '}
                  <strong style={{ color: aiQuota && aiQuota.remainingInLastHour <= 2 ? '#ef4444' : '#10b981' }}>
                    {aiQuota ? aiQuota.remainingInLastHour : 20}
                  </strong>{' '}
                  / {aiQuota ? aiQuota.hourlyLimit : 20} left this hour
                </span>
              </div>
            </div>

            {/* Generation Form */}
            <form onSubmit={handleGenerateAi} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 14 }}>
                <div>
                  <label
                    style={{
                      fontSize: '0.74rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--t3)',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Topic / Algorithm / Pattern
                  </label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="e.g. Thread-Safe Ring Buffer, Red-Black Tree, A* Search"
                    className="search-input"
                    style={{ width: '100%', height: 38 }}
                    required
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: '0.74rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--t3)',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Language
                  </label>
                  <select
                    value={aiLanguage}
                    onChange={(e) => setAiLanguage(e.target.value)}
                    className="btn btn-secondary-glass btn-sm"
                    style={{
                      width: '100%',
                      height: 38,
                      padding: '0 12px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--t1)',
                      background: 'var(--bg-surface)',
                    }}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: '0.74rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--t3)',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Difficulty
                  </label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value)}
                    className="btn btn-secondary-glass btn-sm"
                    style={{
                      width: '100%',
                      height: 38,
                      padding: '0 12px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--t1)',
                      background: 'var(--bg-surface)',
                    }}
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: '0.74rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--t3)',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Drill Category
                  </label>
                  <select
                    value={aiExerciseType}
                    onChange={(e) => setAiExerciseType(e.target.value)}
                    className="btn btn-secondary-glass btn-sm"
                    style={{
                      width: '100%',
                      height: 38,
                      padding: '0 12px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--t1)',
                      background: 'var(--bg-surface)',
                    }}
                  >
                    {['Algorithm', 'Data Structure', 'Concurrency Pattern', 'System Primitive', 'Idiomatic Utility'].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.74rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--t3)',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Custom Directives &amp; Coding Constraints (Optional)
                </label>
                <input
                  type="text"
                  value={aiInstructions}
                  onChange={(e) => setAiInstructions(e.target.value)}
                  placeholder="e.g. Include zero-allocation iterators, strictly clean syntax, concise identifiers"
                  className="search-input"
                  style={{ width: '100%', height: 38 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
                  Generates clean, indentation-standard code ready for the DevType practice engine.
                </span>
                <button
                  type="submit"
                  disabled={aiGenerating}
                  className="btn btn-primary btn-sm"
                  style={{
                    height: 38,
                    padding: '0 20px',
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                  }}
                >
                  <Sparkles size={14} className={aiGenerating ? 'animate-spin' : ''} />
                  <span>{aiGenerating ? 'Generating with DeepSeek V4...' : 'Generate Code Blueprint'}</span>
                </button>
              </div>
            </form>

            {/* Generated Result Preview Card */}
            {aiResult && (
              <div
                style={{
                  marginTop: 14,
                  borderRadius: 'var(--r16)',
                  background: 'var(--bg-surface)',
                  border: '1.5px solid var(--glass-border)',
                  boxShadow: 'var(--shadow-floating-panel)',
                  padding: 22,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  transition: 'all var(--t-fast)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span className="badge badge-indigo">{aiResult.language}</span>
                      <span className="badge badge-teal">{aiResult.difficulty}</span>
                      <span className="badge badge-cyan">{aiResult.exerciseType || 'Algorithm'}</span>
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.01em' }}>
                      {aiResult.title}
                    </h3>
                    {aiResult.description && (
                      <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: 'var(--t2)', lineHeight: 1.55 }}>
                        {aiResult.description}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '6px 14px',
                        borderRadius: 'var(--r-pill)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--glass-border-sub)',
                        fontSize: '0.74rem',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--t2)',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} color="var(--brand)" /> ~{aiResult.estimatedDurationSeconds || 90}s
                      </span>
                      <span>{aiResult.lineCount || aiResult.code?.split('\n').length || 0} lines</span>
                      <span>{aiResult.characterCount || aiResult.code?.length || 0} chars</span>
                    </div>
                  </div>
                </div>

                {/* Code Block */}
                <div
                  style={{
                    position: 'relative',
                    borderRadius: 'var(--r10)',
                    overflow: 'hidden',
                    border: '1px solid var(--glass-border)',
                    background: 'var(--code-bg, #090E17)',
                    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.25)',
                  }}
                >
                  <pre
                    style={{
                      margin: 0,
                      padding: 18,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.84rem',
                      lineHeight: 1.6,
                      color: 'var(--t1)',
                      overflowX: 'auto',
                      maxHeight: 380,
                    }}
                  >
                    <code>{aiResult.code}</code>
                  </pre>
                </div>

                {/* Result Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 10,
                    paddingTop: 12,
                    borderTop: '1px solid var(--glass-border-sub)',
                  }}
                >
                  <button
                    type="button"
                    onClick={handleSendAiToWorkbench}
                    className="btn btn-secondary btn-sm"
                  >
                    <Code2 size={13} />
                    <span>Open in Workbench Editor</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      onClick={handleSaveAiTemplate}
                      className="btn btn-secondary btn-sm"
                    >
                      <Bookmark size={13} />
                      <span>Save to Library</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePracticeAiDirectly(null)}
                      className="btn btn-primary btn-sm"
                      style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#FFFFFF' }}
                    >
                      <Play size={13} fill="currentColor" strokeWidth={0} />
                      <span>Practice Blueprint Now</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Previously Saved AI Templates Gallery */}
            {aiSavedTemplates.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Sparkles size={15} color="#818cf8" />
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--t1)', margin: 0 }}>
                    Your Saved AI Blueprints ({aiSavedTemplates.length})
                  </h4>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {aiSavedTemplates.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 10,
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <span className="badge badge-indigo" style={{ fontSize: '0.68rem' }}>
                            {t.language}
                          </span>
                          <span className="badge badge-teal" style={{ fontSize: '0.68rem' }}>
                            {t.difficulty}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--t1)' }}>
                          {t.title}
                        </div>
                        {t.description && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--t3)', marginTop: 4, lineHeight: 1.4 }}>
                            {t.description}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--glass-border-sub)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
                          ~{t.estimatedDurationSeconds || 90}s
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePracticeAiDirectly(t)}
                          className="btn btn-primary btn-xs"
                          style={{ height: 26, padding: '0 10px' }}
                        >
                          <Play size={10} fill="currentColor" strokeWidth={0} />
                          <span>Practice</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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
              resetForm();
              setActiveTab('manual');
            }}
            className="btn btn-secondary-glass btn-sm"
          >
            <Plus size={13} />
            <span>New Snippet</span>
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--t3)', fontSize: '0.84rem' }}>
            Loading your blueprints...
          </div>
        ) : snippets.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--t3)', fontSize: '0.84rem' }}>
            No custom blueprints saved yet. Use the workbench above to create or import your first drill.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {snippets.map((snip) => (
              <div
                key={snip.id}
                style={{
                  padding: 18,
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="badge badge-teal" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>
                        {snip.language || 'Code'}
                      </span>
                      {snip.drillMode && snip.drillMode !== 'standard' && (
                        <span className="badge badge-indigo" style={{ fontSize: '0.66rem' }}>
                          {snip.drillMode.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        onClick={() => handleEditSnippet(snip)}
                        className="icon-btn"
                        style={{ width: 26, height: 26, color: 'var(--t2)' }}
                        title="Edit snippet"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSnippet(snip.id, e)}
                        className="icon-btn"
                        style={{ width: 26, height: 26, color: '#EF4444' }}
                        title="Delete snippet"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--t1)', margin: '0 0 6px 0' }}>
                    {snip.title}
                  </h4>

                  <div style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--t3)', margin: '4px 0 10px 0' }}>
                    {snip.difficulty || 'Intermediate'} &bull; {(snip.code || snip.content || '').split('\n').length} lines
                  </div>

                  {/* Tags */}
                  {Array.isArray(snip.tags) && snip.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                      {snip.tags.map((t) => (
                        <span key={t} className="badge badge-gray" style={{ fontSize: '0.66rem', padding: '2px 6px' }}>
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--glass-border-sub)' }}>
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
