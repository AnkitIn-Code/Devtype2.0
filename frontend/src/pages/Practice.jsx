// src/pages/Practice.jsx
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { SNIPPETS } from '../data/snippets';
import { tokenizeCodeSnippet } from '../utils/codeTokenizer';
import { calculateTypingMetrics } from '../utils/typingMetrics';
import { playKeyClickSound } from '../utils/typingSound';
import { getTemplateById, getAllTemplates } from '../utils/templateStore';

import CodePracticeEditor from '../components/practice/CodePracticeEditor';
import VirtualKeyboard from '../components/practice/VirtualKeyboard';
import PracticeTelemetryCard from '../components/practice/PracticeTelemetryCard';
import SnippetBlueprintCard from '../components/practice/SnippetBlueprintCard';
import PracticeResultsModal from '../components/practice/PracticeResultsModal';
import ConfirmDialog from '../components/practice/ConfirmDialog';

export default function Practice() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // ── Active Snippet Selection (Initialized from location state or URL params) ──
  const [selectedSnippet, setSelectedSnippet] = useState(() => {
    if (location.state?.snippet) {
      return location.state.snippet;
    }
    const snippetParam = searchParams.get('snippet');
    if (snippetParam) {
      const found = getTemplateById(snippetParam);
      if (found) return found;
    }
    const langParam = searchParams.get('lang');
    if (langParam) {
      const all = getAllTemplates();
      const matching = all.find(
        (s) => s.language.toLowerCase() === langParam.toLowerCase()
      );
      if (matching) return matching;
    }
    return SNIPPETS[0];
  });

  // Settings & Toggles
  const [mode, setMode] = useState('Free');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastPressedCode, setLastPressedCode] = useState(null);

  // Tokenize the snippet
  const tokenizedSnippet = useMemo(() => {
    return tokenizeCodeSnippet(selectedSnippet.code, selectedSnippet.language);
  }, [selectedSnippet]);

  // ── Session State ──
  const [cursorIndex, setCursorIndex] = useState(0);
  const [typedHistory, setTypedHistory] = useState([]); // Array<{ typedChar: string; isCorrect: boolean }>
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [sessionState, setSessionState] = useState('idle'); // 'idle' | 'active' | 'paused' | 'completed'
  const [isFocused, setIsFocused] = useState(true);

  // ── Modals State ──
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    actionType: null, // 'restart' | 'quit' | 'changeSnippet'
    payload: null,
  });

  // ── Timer & Metrics ──
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef(null);
  const accumulatedMsRef = useRef(0);
  const timerIntervalRef = useRef(null);

  // ── Unique Telemetry & Flow State ──
  const [streak, setStreak] = useState(0);
  const [peakWpm, setPeakWpm] = useState(0);
  const [syntaxErrors, setSyntaxErrors] = useState({
    brackets: 0,
    punctuation: 0,
    identifiers: 0,
    whitespace: 0,
  });
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Live Timer Interval
  useEffect(() => {
    if (sessionState === 'active') {
      startTimeRef.current = Date.now();
      timerIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const currentSpan = Date.now() - startTimeRef.current;
          setElapsedMs(accumulatedMsRef.current + currentSpan);
        }
      }, 100);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (startTimeRef.current && sessionState === 'paused') {
        accumulatedMsRef.current += Date.now() - startTimeRef.current;
        startTimeRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [sessionState]);

  // Count correct characters and uncorrected errors
  const { correctChars, uncorrectedErrors } = useMemo(() => {
    let correct = 0;
    let uncorrected = 0;
    for (const item of typedHistory) {
      if (item) {
        if (item.isCorrect) correct++;
        else uncorrected++;
      }
    }
    return { correctChars: correct, uncorrectedErrors: uncorrected };
  }, [typedHistory]);

  // Live Calculated Metrics
  const metrics = useMemo(() => {
    return calculateTypingMetrics({
      totalKeystrokes,
      correctChars,
      totalErrors,
      uncorrectedErrors,
      elapsedMs,
      totalSnippetChars: tokenizedSnippet.totalChars,
      currentCursorIndex: cursorIndex,
    });
  }, [
    totalKeystrokes,
    correctChars,
    totalErrors,
    uncorrectedErrors,
    elapsedMs,
    tokenizedSnippet.totalChars,
    cursorIndex,
  ]);

  // ── Session Reset ──
  const resetSession = useCallback(() => {
    setCursorIndex(0);
    setTypedHistory([]);
    setTotalKeystrokes(0);
    setTotalErrors(0);
    setElapsedMs(0);
    setStreak(0);
    setPeakWpm(0);
    setSyntaxErrors({ brackets: 0, punctuation: 0, identifiers: 0, whitespace: 0 });
    setIsTyping(false);
    startTimeRef.current = null;
    accumulatedMsRef.current = 0;
    setSessionState('idle');
    setResultsModalOpen(false);
  }, []);

  // ── Clean Integration Boundary for Saving Results ──
  const saveSessionResults = useCallback(
    (finalMetrics) => {
      const sessionResult = {
        id: `sess_${Date.now()}`,
        snippetId: selectedSnippet.id,
        title: selectedSnippet.title,
        language: selectedSnippet.language,
        difficulty: selectedSnippet.difficulty,
        wpm: finalMetrics.netWpm,
        grossWpm: finalMetrics.grossWpm,
        accuracy: finalMetrics.accuracy,
        errors: finalMetrics.errorCount,
        durationSeconds: finalMetrics.elapsedSeconds,
        date: new Date().toISOString(),
      };

      try {
        const existing = JSON.parse(localStorage.getItem('devtype_sessions') || '[]');
        existing.unshift(sessionResult);
        localStorage.setItem('devtype_sessions', JSON.stringify(existing.slice(0, 50)));
      } catch (err) {
        console.warn('Could not save session to localStorage:', err);
      }
    },
    [selectedSnippet]
  );

  // ── Physical Key Press Visual & Audio Feedback ──
  const handlePhysicalKey = useCallback(
    (code) => {
      setLastPressedCode(code);
      setTimeout(() => setLastPressedCode(null), 120);
      if (soundEnabled) {
        playKeyClickSound();
      }
    },
    [soundEnabled]
  );

  // ── Keystroke Handler: Character Typed ──
  const handleKeyPress = useCallback(
    (key) => {
      if (sessionState === 'completed' || sessionState === 'paused') return;

      const flatChars = tokenizedSnippet.flatChars;
      if (cursorIndex >= flatChars.length) return;

      // Start timer on first valid keystroke
      if (sessionState === 'idle') {
        setSessionState('active');
        startTimeRef.current = Date.now();
      }

      setIsTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 900);

      const expectedChar = flatChars[cursorIndex].char;
      const isCorrect = key === expectedChar;

      // Track streak and categorized syntax errors
      if (isCorrect) {
        setStreak((prev) => prev + 1);
      } else {
        setStreak(0);
        const classify = (ch) => {
          if ('{}()[]<>'.includes(ch)) return 'brackets';
          if (';:,."\'=+-*/%&|^!~?@#$\\`'.includes(ch)) return 'punctuation';
          if (' \t\n\r'.includes(ch)) return 'whitespace';
          return 'identifiers';
        };
        const cat = classify(expectedChar);
        setSyntaxErrors((prev) => ({ ...prev, [cat]: prev[cat] + 1 }));
      }

      // Track peak WPM inside event handler
      const currentSpan = startTimeRef.current
        ? accumulatedMsRef.current + (Date.now() - startTimeRef.current)
        : elapsedMs;
      const minutes = currentSpan / 60000;
      if (minutes > 0.05) {
        const liveWpm = Math.round(Math.max(0, ((correctChars + (isCorrect ? 1 : 0)) / 5) / minutes));
        setPeakWpm((prev) => Math.max(prev, liveWpm));
      }

      // In Strict mode, mistakes must be corrected before advancing
      if (mode === 'Strict' && !isCorrect) {
        setTotalKeystrokes((prev) => prev + 1);
        setTotalErrors((prev) => prev + 1);
        return;
      }

      setTotalKeystrokes((prev) => prev + 1);

      if (!isCorrect) {
        setTotalErrors((prev) => prev + 1);
      }

      // Record in typed history
      setTypedHistory((prev) => {
        const next = [...prev];
        next[cursorIndex] = { typedChar: key, isCorrect };
        return next;
      });

      const nextIndex = cursorIndex + 1;
      setCursorIndex(nextIndex);

      // Check for completion
      if (nextIndex >= flatChars.length) {
        setSessionState('completed');
        const finalSpan = startTimeRef.current
          ? accumulatedMsRef.current + (Date.now() - startTimeRef.current)
          : elapsedMs;
        setElapsedMs(finalSpan);

        const finalMetrics = calculateTypingMetrics({
          totalKeystrokes: totalKeystrokes + 1,
          correctChars: isCorrect ? correctChars + 1 : correctChars,
          totalErrors: !isCorrect ? totalErrors + 1 : totalErrors,
          uncorrectedErrors: !isCorrect ? uncorrectedErrors + 1 : uncorrectedErrors,
          elapsedMs: finalSpan,
          totalSnippetChars: flatChars.length,
          currentCursorIndex: nextIndex,
        });

        saveSessionResults(finalMetrics);
        setResultsModalOpen(true);
      }
    },
    [
      sessionState,
      tokenizedSnippet.flatChars,
      cursorIndex,
      mode,
      totalKeystrokes,
      correctChars,
      totalErrors,
      uncorrectedErrors,
      elapsedMs,
      saveSessionResults,
    ]
  );

  // ── Keystroke Handler: Backspace ──
  const handleBackspace = useCallback(() => {
    if (sessionState === 'completed' || sessionState === 'paused' || cursorIndex <= 0) return;

    setCursorIndex((prev) => Math.max(0, prev - 1));
    setTypedHistory((prev) => {
      const next = [...prev];
      next.pop();
      return next;
    });
  }, [sessionState, cursorIndex]);

  // ── Keystroke Handler: Enter (Newline) ──
  const handleEnter = useCallback(() => {
    handleKeyPress('\n');
  }, [handleKeyPress]);

  // ── Keystroke Handler: Tab (Indentation Helper) ──
  const handleTab = useCallback(() => {
    if (sessionState === 'completed' || sessionState === 'paused') return;

    const flatChars = tokenizedSnippet.flatChars;
    if (cursorIndex >= flatChars.length) return;

    // Advance through indentation spaces
    let nextIdx = cursorIndex;
    let strokes = 0;
    const historyAdditions = [];

    while (
      nextIdx < flatChars.length &&
      flatChars[nextIdx].char === ' ' &&
      strokes < 4
    ) {
      historyAdditions.push({ typedChar: ' ', isCorrect: true });
      nextIdx++;
      strokes++;
    }

    if (strokes > 0) {
      if (sessionState === 'idle') {
        setSessionState('active');
        startTimeRef.current = Date.now();
      }

      setTotalKeystrokes((prev) => prev + strokes);
      setTypedHistory((prev) => {
        const next = [...prev];
        for (let i = 0; i < strokes; i++) {
          next[cursorIndex + i] = historyAdditions[i];
        }
        return next;
      });
      setCursorIndex(nextIdx);

      if (nextIdx >= flatChars.length) {
        setSessionState('completed');
        setResultsModalOpen(true);
      }
    } else {
      handleKeyPress('\t');
    }
  }, [sessionState, tokenizedSnippet.flatChars, cursorIndex, handleKeyPress]);

  // ── Global Pause/Resume Toggle via Esc ──
  const handlePauseResume = useCallback(() => {
    if (sessionState === 'active') {
      setSessionState('paused');
    } else if (sessionState === 'paused') {
      setSessionState('active');
    }
  }, [sessionState]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape' && (sessionState === 'active' || sessionState === 'paused')) {
        e.preventDefault();
        handlePauseResume();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [sessionState, handlePauseResume]);

  // ── Next Snippet in SNIPPETS List ──
  const handleNextSnippet = () => {
    setResultsModalOpen(false);
    const all = getAllTemplates();
    const currentIndex = all.findIndex((s) => s.id === selectedSnippet.id);
    const nextSnippet =
      currentIndex >= 0 && currentIndex < all.length - 1
        ? all[currentIndex + 1]
        : all[0];

    setSelectedSnippet(nextSnippet);
    resetSession();
  };

  // ── Restart / Reset Handling ──
  const handleRestart = () => {
    if (cursorIndex > 5 && sessionState !== 'completed') {
      setConfirmDialog({
        isOpen: true,
        title: 'Reset Snippet?',
        message: 'Your current typing progress will be lost. Are you sure you want to reset?',
        actionType: 'restart',
      });
    } else {
      resetSession();
    }
  };

  // ── Quit Handling ──
  const handleQuit = () => {
    if (cursorIndex > 5 && sessionState !== 'completed') {
      setConfirmDialog({
        isOpen: true,
        title: 'Leave Practice Session?',
        message: 'You have an active typing session in progress. Progress will not be saved if you leave now.',
        actionType: 'quit',
      });
    } else {
      navigate('/dashboard');
    }
  };

  // ── Confirm Modal Resolution ──
  const handleConfirmAction = () => {
    const { actionType, payload } = confirmDialog;
    setConfirmDialog({ isOpen: false, title: '', message: '', actionType: null, payload: null });

    if (actionType === 'restart') {
      resetSession();
    } else if (actionType === 'quit') {
      navigate('/dashboard');
    } else if (actionType === 'changeSnippet' && payload) {
      setSelectedSnippet(payload);
      resetSession();
    }
  };

  const handleCancelAction = () => {
    setConfirmDialog({ isOpen: false, title: '', message: '', actionType: null, payload: null });
  };

  const currentTargetChar = tokenizedSnippet.flatChars[cursorIndex]?.char;

  return (
    <div className="practice-workspace-root">
      <div className="practice-layout-grid">
        {/* ── Left Column: Code Editor (Top) + Interactive Virtual Keyboard with Finger Placement (Bottom) ── */}
        <div className="practice-left-column">
          <CodePracticeEditor
            tokenizedSnippet={tokenizedSnippet}
            cursorIndex={cursorIndex}
            typedHistory={typedHistory}
            sessionState={sessionState}
            onKeyPress={handleKeyPress}
            onBackspace={handleBackspace}
            onTab={handleTab}
            onEnter={handleEnter}
            onFocusChange={setIsFocused}
            isFocused={isFocused}
            onPhysicalKey={handlePhysicalKey}
          />

          <VirtualKeyboard
            targetChar={currentTargetChar}
            lastPressedCode={lastPressedCode}
          />
        </div>

        {/* ── Right Column: Snippet Blueprint Profile (Top) + Telemetry & Quick Controls (Bottom) ── */}
        <div className="practice-right-column">
          <SnippetBlueprintCard
            snippet={selectedSnippet}
            mode={mode}
            onSelectMode={setMode}
            onBrowseTemplates={() => navigate('/templates')}
          />

          <PracticeTelemetryCard
            metrics={metrics}
            streak={streak}
            peakWpm={peakWpm}
            syntaxErrors={syntaxErrors}
            isTyping={isTyping}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled((prev) => !prev)}
            onReset={handleRestart}
            onBackToDashboard={handleQuit}
          />
        </div>
      </div>

      {/* ── Polished Results Modal ── */}
      <PracticeResultsModal
        isOpen={resultsModalOpen}
        metrics={metrics}
        snippet={selectedSnippet}
        onRetry={() => {
          setResultsModalOpen(false);
          resetSession();
        }}
        onNextSnippet={handleNextSnippet}
        onBackToDashboard={() => navigate('/dashboard')}
      />

      {/* ── Confirmation Modal ── */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="Proceed"
        cancelLabel="Keep Typing"
        isDestructive={true}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />
    </div>
  );
}
