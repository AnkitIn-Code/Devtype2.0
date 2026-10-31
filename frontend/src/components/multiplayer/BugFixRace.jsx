import { useState, useEffect, useRef } from 'react';
import {
  Bug, Clock, Sparkles, AlertTriangle, ArrowRight,
  LogOut, Send, Search, ChevronRight, Award, Lightbulb
} from 'lucide-react';
import { multiplayerService } from '../../services/multiplayerService';
import { snippetService } from '../../services/snippetService';
import { getAllPredefinedTemplates, getPredefinedSnippet } from '../../data/predefinedBlueprints';

export default function BugFixRace({
  templates,
  onExit,
}) {
  const [step, setStep] = useState('select-template'); // 'select-template' | 'injecting' | 'fixing' | 'verifying' | 'result'
  const [allTemplates, setAllTemplates] = useState(() => {
    const predefined = getAllPredefinedTemplates();
    return (templates && templates.length > 0) ? templates : predefined;
  });
  const [selectedTemplate, setSelectedTemplate] = useState(() => {
    const list = (templates && templates.length > 0) ? templates : getAllPredefinedTemplates();
    return list.length > 0 ? list[0] : null;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLang, setSelectedLang] = useState('All');

  // AI Bug State
  const [originalCode, setOriginalCode] = useState('');
  const [buggedCode, setBuggedCode] = useState('');
  const [editedCode, setEditedCode] = useState('');
  const [bugsDescription, setBugsDescription] = useState('');
  const [hints, setHints] = useState([]);
  const [attemptsRemaining, setAttemptsRemaining] = useState(2);
  const [aiFeedback, setAiFeedback] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  // Load both catalog templates and custom studio snippets
  useEffect(() => {
    let alive = true;
    async function loadAll() {
      const publicTyping = (templates && templates.length > 0)
        ? templates.filter((t) => !t.bugFix)
        : getAllPredefinedTemplates();
      let customSnippets = [];
      try {
        customSnippets = await snippetService.getCustomSnippets();
      } catch (e) {
        console.warn('Custom snippets fetch failed:', e);
      }

      const merged = [
        ...publicTyping.map((t) => ({
          ...t,
          source: 'Catalog',
        })),
        ...customSnippets.map((s) => ({
          id: s.id || s.slug,
          title: s.title || 'Custom Snippet',
          language: s.language || 'JavaScript',
          difficulty: s.difficulty || 'Intermediate',
          content: s.code || s.content || '',
          source: 'Custom Studio',
        })),
      ];

      if (alive && merged.length > 0) {
        setAllTemplates(merged);
        setSelectedTemplate((prev) => prev || merged[0]);
      }
    }
    loadAll();
    return () => { alive = false; };
  }, [templates]);

  // Timer runner during fixing
  useEffect(() => {
    if (step === 'fixing') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  // Step 2: Inject AI Bugs
  const handleProceedToBugInjection = async () => {
    if (!selectedTemplate) return;
    setStep('injecting');
    setElapsedSeconds(0);
    setAttemptsRemaining(2);
    setAiFeedback('');
    setIsSuccess(false);

    let codeToBug = selectedTemplate.content || selectedTemplate.code || '';
    if (!codeToBug) {
      const snip = getPredefinedSnippet(selectedTemplate.slug || selectedTemplate.id || selectedTemplate.title, selectedTemplate.language);
      if (snip && (snip.content || snip.code)) {
        codeToBug = snip.content || snip.code;
      }
    }
    setOriginalCode(codeToBug);

    try {
      const res = await multiplayerService.generateBugs({
        templateId: typeof selectedTemplate.id === 'number' ? selectedTemplate.id : null,
        title: selectedTemplate.title,
        language: selectedTemplate.language,
        code: codeToBug,
      });

      setBuggedCode(res.buggedCode || codeToBug);
      setEditedCode(res.buggedCode || codeToBug);
      setBugsDescription(res.bugsDescription || 'Subtle syntax and logic bugs injected.');
      setHints(res.hints || []);
      setStep('fixing');
    } catch (err) {
      console.warn('AI bug generation failed, using local injected bug:', err);
      // Fallback
      let fallbackBugged;
      if (codeToBug.includes('==')) fallbackBugged = codeToBug.replace('==', '!=');
      else if (codeToBug.includes('<')) fallbackBugged = codeToBug.replace('<', '>');
      else fallbackBugged = `${codeToBug}\n    # syntax defect`;
      setBuggedCode(fallbackBugged);
      setEditedCode(fallbackBugged);
      setBugsDescription('Condition and syntax altered.');
      setHints(['Check comparison operator.']);
      setStep('fixing');
    }
  };

  // Step 4: Submit Fix for AI Analysis
  const handleSubmitFix = async () => {
    setStep('verifying');
    try {
      const res = await multiplayerService.verifyBugFix({
        language: selectedTemplate?.language || 'javascript',
        originalCode,
        buggedCode,
        submittedCode: editedCode,
      });

      if (res.correct) {
        setIsSuccess(true);
        setAiFeedback(res.feedback || 'Outstanding! All bugs have been resolved and logic is verified.');
        setStep('result');
      } else {
        const remaining = attemptsRemaining - 1;
        setAttemptsRemaining(remaining);
        setAiFeedback(res.feedback || 'The submitted code still contains logic or syntax issues.');

        if (remaining <= 0) {
          setIsSuccess(false);
          setStep('result');
        } else {
          setStep('fixing');
        }
      }
    } catch (err) {
      console.warn('Verification failed:', err);
      // Resilient check
      const normalizedOriginal = originalCode.replace(/\s+/g, ' ').trim();
      const normalizedEdited = editedCode.replace(/\s+/g, ' ').trim();
      const isOk = normalizedEdited === normalizedOriginal;
      if (isOk) {
        setIsSuccess(true);
        setAiFeedback('Bugs resolved successfully!');
        setStep('result');
      } else {
        const remaining = attemptsRemaining - 1;
        setAttemptsRemaining(remaining);
        setAiFeedback('Code does not resolve the injected bugs yet.');
        if (remaining <= 0) {
          setIsSuccess(false);
          setStep('result');
        } else {
          setStep('fixing');
        }
      }
    }
  };

  const fmtTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const filteredTemplates = allTemplates.filter((t) => {
    const matchesSearch =
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.language?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLang =
      selectedLang === 'All' || t.language?.toLowerCase() === selectedLang.toLowerCase();
    return matchesSearch && matchesLang;
  });

  const uniqueLanguages = ['All', ...new Set(allTemplates.map((t) => t.language).filter(Boolean))];

  return (
    <div className="bugfix-page-root">
      {/* STEP 1: Template Selection View */}
      {step === 'select-template' && (
        <div className="bugfix-workspace">
          <div className="bugfix-header-bar">
            <div>
              <div className="bugfix-badge">
                <Bug size={14} /> AI Solo Challenge
              </div>
              <h1 className="bugfix-title">Bug Fix Race</h1>
              <p className="bugfix-desc">
                Select any code template from the Templates Catalog or your Custom Studio. DeepSeek V4 Pro
                will reason and inject realistic bugs into the code for you to identify and fix.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onExit}
            >
              <LogOut size={14} /> Exit to Lobby
            </button>
          </div>

          {/* Filters & Search */}
          <div className="bugfix-toolbar">
            <div className="search-wrap" style={{ flex: 1, maxWidth: 380 }}>
              <Search size={14} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search templates or custom snippets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="bugfix-lang-filter-bar">
              {uniqueLanguages.slice(0, 7).map((l) => (
                <button
                  key={l}
                  type="button"
                  className={`btn btn-xs ${selectedLang === l ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setSelectedLang(l)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Template Selection Grid */}
          <div className="bugfix-template-grid">
            {filteredTemplates.map((tpl) => {
              const isSelected = selectedTemplate?.id === tpl.id;
              return (
                <div
                  key={tpl.id}
                  className={`bugfix-template-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedTemplate(tpl)}
                >
                  <div className="bugfix-card-top">
                    <span className="bugfix-source-tag">
                      {tpl.source === 'Custom Studio' ? '🛠 Studio' : '📚 Catalog'}
                    </span>
                    <span className="bugfix-lang-tag">{tpl.language}</span>
                  </div>
                  <h3 className="bugfix-card-name">{tpl.title}</h3>
                  <div className="bugfix-card-footer">
                    <span className="bugfix-diff-pill">{tpl.difficulty}</span>
                    <span className="bugfix-lines">
                      {(tpl.content || '').split('\n').length} lines
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bugfix-action-bar">
            <button
              type="button"
              className="btn btn-primary btn-lg"
              disabled={!selectedTemplate}
              onClick={handleProceedToBugInjection}
            >
              <Sparkles size={16} />
              <span>Next: Inject AI Bugs ({selectedTemplate?.title || 'None Selected'})</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: AI Bug Injection Loading Screen */}
      {step === 'injecting' && (
        <div className="bugfix-loading-screen">
          <div className="bugfix-pulse-box">
            <div className="pulse-ring ring-1" />
            <div className="pulse-ring ring-2" />
            <div className="pulse-core">
              <Bug size={32} color="#0284C7" />
            </div>
          </div>
          <h2 className="loading-title">Bugs are getting added to the code...</h2>
          <p className="loading-subtitle">
            Fireworks AI DeepSeek V4 Pro is reasoning and inserting realistic syntax defects and logic bugs into <strong>{selectedTemplate?.title}</strong>.
          </p>
          <div className="loading-hints-box">
            <Sparkles size={14} style={{ color: '#F59E0B' }} />
            <span>You will NOT have to re-type the whole code. Simply spot and patch the bugged parts!</span>
          </div>
        </div>
      )}

      {/* STEP 3: In-Place Bug Fix Editor */}
      {step === 'fixing' && (
        <div className="bugfix-editor-screen">
          {/* Top Bar */}
          <div className="bugfix-race-bar">
            <div className="race-bar-left">
              <span className="bugfix-pill">🐛 Bug Fix in Progress</span>
              <h2 className="race-bar-title">{selectedTemplate?.title}</h2>
              <span className="race-bar-lang">{selectedTemplate?.language}</span>
            </div>

            <div className="race-bar-right">
              <div className="attempts-pill">
                <span className="attempts-num">{attemptsRemaining}</span>
                <span>attempt{attemptsRemaining > 1 ? 's' : ''} remaining</span>
              </div>
              <div className="timer-pill">
                <Clock size={15} />
                <span>{fmtTime(elapsedSeconds)}</span>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm text-red-400"
                onClick={onExit}
              >
                <LogOut size={14} /> Leave Match
              </button>
            </div>
          </div>

          {/* Feedback banner if 1 attempt remaining */}
          {aiFeedback && attemptsRemaining === 1 && (
            <div className="bugfix-warning-banner">
              <AlertTriangle size={16} />
              <div>
                <strong>1 Attempt Remaining!</strong> {aiFeedback}
              </div>
            </div>
          )}

          {/* Main Workspace: Left Editor | Right AI Summary & Actions */}
          <div className="bugfix-editor-grid">
            {/* LEFT: In-Place Code Editor */}
            <div className="bugfix-code-pane">
              <div className="code-pane-hd">
                <span>Code Editor (Edit bugged lines directly)</span>
                <span className="code-pane-tip">You do not need to re-type unchanged lines!</span>
              </div>
              <textarea
                className="bugfix-textarea"
                value={editedCode}
                onChange={(e) => setEditedCode(e.target.value)}
                spellCheck={false}
                autoFocus
                placeholder="Correct the code here..."
              />
            </div>

            {/* RIGHT: AI Bug Briefing & Submit */}
            <div className="bugfix-side-pane">
              <div className="side-pane-card">
                <div className="side-card-hd">
                  <Bug size={16} color="#0284C7" />
                  <span>AI Bug Intelligence</span>
                </div>
                <div className="side-card-bd">
                  <div className="ai-bug-desc-box">
                    <span className="desc-label">Injected Defect Overview:</span>
                    <p className="desc-text">{bugsDescription}</p>
                  </div>

                  {hints.length > 0 && (
                    <div className="hints-box">
                      <div className="hints-hd">
                        <Lightbulb size={14} color="#F59E0B" />
                        <span>AI Diagnostic Hints:</span>
                      </div>
                      <ul className="hints-list">
                        {hints.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button Card */}
              <div className="side-pane-card submit-card">
                <p className="submit-info">
                  Once you have corrected the missing or bugged parts, submit your fix. DeepSeek AI will evaluate your code logic.
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-lg w-full"
                  onClick={handleSubmitFix}
                >
                  <Send size={15} />
                  <span>Submit Code Fix</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Verifying */}
      {step === 'verifying' && (
        <div className="bugfix-loading-screen">
          <div className="bugfix-pulse-box">
            <div className="pulse-ring ring-1" />
            <div className="pulse-core">
              <Sparkles size={32} color="#10B981" />
            </div>
          </div>
          <h2 className="loading-title">AI is analyzing your code fix...</h2>
          <p className="loading-subtitle">
            Evaluating logic correctness, syntax validity, and verifying bug resolution without requiring identical character matches.
          </p>
        </div>
      )}

      {/* STEP 5: Final Result Screen */}
      {step === 'result' && (
        <div className="bugfix-result-screen">
          <div className={`bugfix-result-card ${isSuccess ? 'success' : 'failed'}`}>
            <div className="result-icon-badge">
              {isSuccess ? <Award size={36} color="#10B981" /> : <AlertTriangle size={36} color="#EF4444" />}
            </div>
            <h2 className="result-title">
              {isSuccess ? 'Bug Fix Challenge Solved!' : 'Challenge Ended'}
            </h2>
            <p className="result-time">Time Taken: {fmtTime(elapsedSeconds)}</p>

            <div className="result-feedback-box">
              <span className="feedback-label">AI Evaluator Feedback:</span>
              <p className="feedback-text">{aiFeedback}</p>
            </div>

            <div className="result-actions">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={onExit}
              >
                <span>Back to Multiplayer Arena</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
