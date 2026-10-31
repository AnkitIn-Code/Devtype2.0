// src/pages/Practice.jsx
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { AlertTriangle, RotateCcw, Compass, Loader2 } from 'lucide-react';
import { tokenizeCodeSnippet } from '../utils/codeTokenizer';
import { generateCharacterMask } from '../utils/clozeMasker';
import { calculateTypingMetrics } from '../utils/typingMetrics';
import { playKeyClickSound } from '../utils/typingSound';
import { templateService, normalizeTemplate } from '../services/templateService';
import { practiceService } from '../services/practiceService';
import { srsService } from '../services/srsService';
import { deriveQualityScore } from '../utils/srsEngine';
import { useAuth } from '../context/AuthContext';
import { saveUserSession } from '../utils/reportStore';
import { dataCache } from '../services/dataCache';

import CodePracticeEditor from '../components/practice/CodePracticeEditor';
import VirtualKeyboard from '../components/practice/VirtualKeyboard';
import PracticeTelemetryCard from '../components/practice/PracticeTelemetryCard';
import SnippetBlueprintCard from '../components/practice/SnippetBlueprintCard';
import PracticeResultsModal from '../components/practice/PracticeResultsModal';
import ConfirmDialog from '../components/practice/ConfirmDialog';

export default function Practice() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const snippetParam = searchParams.get('snippet') || searchParams.get('drill') || searchParams.get('id') || searchParams.get('slug');
  const langParam = searchParams.get('lang') || searchParams.get('language');
  const srsCardIdParam = searchParams.get('srsCardId') || location.state?.srsCardId || location.state?.snippet?.srsCardId;
  const isLanguageLocked = searchParams.get('lockLang') === 'true' || Boolean(location.state?.snippet?.isLanguageLocked);

  // ── Active Snippet Selection (Initialized from location state or loaded from API) ──
  const [selectedSnippet, setSelectedSnippet] = useState(() => {
    if (location.state?.snippet) {
      return normalizeTemplate(location.state.snippet);
    }
    return null;
  });

  const [isLoadingSnippet, setIsLoadingSnippet] = useState(() => {
    if (location.state?.snippet?.code || location.state?.snippet?.content) {
      return false;
    }
    return true;
  });

  const [snippetError, setSnippetError] = useState(null);

  // ── Server Session Tracking State ──
  const activeSessionIdRef = useRef(null);
  const activeSessionPromiseRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const [serverMetrics, setServerMetrics] = useState(null);

  // Settings & Toggles
  const [mode, setMode] = useState('Free'); // 'Free' | 'Strict' | 'Timed'
  const modeParam = searchParams.get('mode') || location.state?.mode || 'copy';
  const normalizedInitialMode = modeParam === 'standard' ? 'copy' : modeParam;
  const [practiceMode, setPracticeMode] = useState(normalizedInitialMode); // 'copy' | 'cloze' | 'blind'
  const [hintIndex, setHintIndex] = useState(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastPressedCode, setLastPressedCode] = useState(null);
  const [strictErrorPulse, setStrictErrorPulse] = useState(false);

  // 60-Second Speed Benchmark Constant
  const TIMED_DURATION_MS = 60000;

  // ── Session State (Declared before callbacks) ──
  const [cursorIndex, setCursorIndex] = useState(0);
  const [typedHistory, setTypedHistory] = useState([]); // Array<{ typedChar: string; isCorrect: boolean }>
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [sessionState, setSessionState] = useState('idle'); // 'idle' | 'active' | 'paused' | 'completed'
  const [isFocused, setIsFocused] = useState(true);

  // Tokenize the snippet (safely handles null/empty snippet during loading)
  const tokenizedSnippet = useMemo(() => {
    return tokenizeCodeSnippet(selectedSnippet?.code || '', selectedSnippet?.language || 'javascript');
  }, [selectedSnippet]);

  // Dynamic Cloze/Blind Character Mask
  const maskMap = useMemo(() => {
    if (!tokenizedSnippet || !tokenizedSnippet.flatChars) return [];
    return generateCharacterMask(tokenizedSnippet, practiceMode);
  }, [tokenizedSnippet, practiceMode]);

  // Request character hint in Cloze or Blind recall mode
  const handleRequestHint = useCallback(() => {
    if (practiceMode === 'copy') return;
    setHintIndex(cursorIndex);
    setHintsUsed((prev) => prev + 1);
  }, [practiceMode, cursorIndex]);

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
  const onTimedCompleteRef = useRef(null);

  // Dynamic remaining seconds for Timed mode countdown
  const remainingSeconds = mode === 'Timed'
    ? Math.max(0, Math.ceil((TIMED_DURATION_MS - elapsedMs) / 1000))
    : null;

  // ── Unique Telemetry & Flow State ──
  const [streak, setStreak] = useState(0);
  const [peakWpm, setPeakWpm] = useState(0);
  const [syntaxErrors, setSyntaxErrors] = useState({
    brackets: 0,
    punctuation: 0,
    identifiers: 0,
    whitespace: 0,
  });
  const [keyErrorMap, setKeyErrorMap] = useState({});
  const [errorLocations, setErrorLocations] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Live Timer Interval with Timed Mode Expiration Guard
  useEffect(() => {
    if (sessionState === 'active') {
      startTimeRef.current = Date.now();
      timerIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const currentSpan = Date.now() - startTimeRef.current;
          const totalElapsed = accumulatedMsRef.current + currentSpan;

          // Enforce 60-second limit in Timed mode
          if (mode === 'Timed' && totalElapsed >= TIMED_DURATION_MS) {
            setElapsedMs(TIMED_DURATION_MS);
            setSessionState('completed');
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
            setTimeout(() => {
              onTimedCompleteRef.current?.();
            }, 0);
            return;
          }

          setElapsedMs(totalElapsed);
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
  }, [sessionState, mode]);

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
    if (activeSessionIdRef.current) {
      practiceService.abandonSession(activeSessionIdRef.current);
    }
    activeSessionIdRef.current = null;
    activeSessionPromiseRef.current = null;
    isSubmittingRef.current = false;
    setServerMetrics(null);

    setCursorIndex(0);
    setTypedHistory([]);
    setTotalKeystrokes(0);
    setTotalErrors(0);
    setElapsedMs(0);
    setStreak(0);
    setPeakWpm(0);
    setSyntaxErrors({ brackets: 0, punctuation: 0, identifiers: 0, whitespace: 0 });
    setKeyErrorMap({});
    setErrorLocations([]);
    setIsTyping(false);
    setStrictErrorPulse(false);
    startTimeRef.current = null;
    accumulatedMsRef.current = 0;
    setSessionState('idle');
    setResultsModalOpen(false);
  }, []);

  // ── Fetch template or custom offline snippet ──
  const fetchSnippet = useCallback(
    async (targetId, preferredLang = null) => {
      setIsLoadingSnippet(true);
      setSnippetError(null);
      try {
        const langToUse = preferredLang || langParam;

        // Custom template check if explicitly marked
        if (targetId && String(targetId).startsWith('custom-')) {
          const raw = localStorage.getItem('devtype_custom_templates');
          if (raw) {
            const list = JSON.parse(raw);
            const found = list.find((s) => s.id === targetId || s.slug === targetId);
            if (found) {
              setSelectedSnippet(normalizeTemplate(found));
              resetSession();
              return;
            }
          }
        }

        // Fetch from template service with language awareness
        const template = await templateService.getTemplateById(targetId, langToUse);
        if (template && template.code) {
          setSelectedSnippet(template);
          resetSession();
          return;
        }

        // Resilient fallback to predefined default
        const defaultBlueprint = await templateService.getTemplateById('binary-search', langToUse || 'C++');
        if (defaultBlueprint) {
          setSelectedSnippet(defaultBlueprint);
          resetSession();
          return;
        }

        setSnippetError('The requested practice template could not be found.');
      } catch (err) {
        console.error('Failed to load practice content:', err);
        const fallback = await templateService.getTemplateById(targetId || 'binary-search', langParam || 'C++');
        if (fallback) {
          setSelectedSnippet(fallback);
          resetSession();
        } else {
          setSnippetError(err.message || 'Unable to load practice content.');
        }
      } finally {
        setIsLoadingSnippet(false);
      }
    },
    [langParam, resetSession]
  );

  useEffect(() => {
    // If snippet already loaded with valid code matching target language, do not refetch
    if (selectedSnippet && selectedSnippet.code) {
      if (langParam) {
        const currentLang = String(selectedSnippet.language || '').toLowerCase();
        const requestedLang = String(langParam).toLowerCase();
        const isCppMatch = (requestedLang === 'cpp' || requestedLang === 'c++') && (currentLang === 'c++' || currentLang === 'cpp');
        if (isCppMatch || currentLang === requestedLang) {
          return;
        }
      } else if (!snippetParam || snippetParam === selectedSnippet.slug || snippetParam === String(selectedSnippet.id)) {
        return;
      }
    }

    const timer = setTimeout(() => {
      fetchSnippet(snippetParam, langParam);
    }, 0);

    return () => clearTimeout(timer);
  }, [snippetParam, langParam, selectedSnippet, fetchSnippet]);

  // ── Clean Integration Boundary for Saving Results (Lightweight summary only) ──
  const saveSessionResults = useCallback(
    (finalMetrics) => {
      if (!selectedSnippet) return;
      const sessionResult = {
        id: `sess_${Date.now()}`,
        userId: user?.id,
        snippetId: selectedSnippet.id || selectedSnippet.slug,
        title: selectedSnippet.title,
        snippetTitle: selectedSnippet.title,
        language: selectedSnippet.language,
        difficulty: selectedSnippet.difficulty,
        wpm: finalMetrics.netWpm,
        netWpm: finalMetrics.netWpm,
        grossWpm: finalMetrics.grossWpm,
        accuracy: finalMetrics.accuracy,
        accuracyPercent: finalMetrics.accuracy,
        errors: finalMetrics.errorCount,
        durationSeconds: finalMetrics.elapsedSeconds,
        durationMs: Math.round(finalMetrics.elapsedSeconds * 1000),
        date: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        isSrsReview: Boolean(srsCardIdParam),
      };

      saveUserSession(sessionResult, user?.id);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('devtype_session_completed', { detail: sessionResult }));
      }
    },
    [selectedSnippet, user]
  );

  // ── Initialize server practice session on typing begin ──
  const startServerSession = useCallback(() => {
    if (!selectedSnippet || activeSessionIdRef.current || activeSessionPromiseRef.current) {
      return;
    }
    const tId = selectedSnippet.numericId || selectedSnippet.id;
    const isNumericId = tId != null && !isNaN(Number(tId));

    const startPayload = {
      templateId: isNumericId ? Number(tId) : null,
      templateSlug: selectedSnippet.slug || String(tId),
      customTitle: selectedSnippet.title,
      customLanguage: selectedSnippet.language,
      customDifficulty: selectedSnippet.difficulty,
      customContent: selectedSnippet.code || selectedSnippet.content,
    };

    activeSessionPromiseRef.current = practiceService
      .startSession(startPayload)
      .then((res) => {
        if (res?.id) {
          activeSessionIdRef.current = res.id;
        }
        return res;
      })
      .catch((err) => {
        console.warn('Could not start server-side practice session:', err);
        return null;
      });
  }, [selectedSnippet]);

  // ── Submit session completion to server ──
  const submitSessionCompletion = useCallback(
    async (finalMetrics) => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      // 1. Save to local storage for instant availability
      saveSessionResults(finalMetrics);

      // 2. Submit to server if session was started (or auto-initialize now)
      try {
        let sess = null;
        if (activeSessionPromiseRef.current) {
          sess = await activeSessionPromiseRef.current;
        }
        let sessionId = sess?.id || activeSessionIdRef.current;
        let serverResult = null;

        // Auto-initialize if session was not started or promise rejected
        if (!sessionId && selectedSnippet) {
          try {
            const tId = selectedSnippet.numericId || selectedSnippet.id;
            const isNumericId = tId != null && !isNaN(Number(tId));
            const initRes = await practiceService.startSession({
              templateId: isNumericId ? Number(tId) : null,
              templateSlug: selectedSnippet.slug || String(tId),
              customTitle: selectedSnippet.title,
              customLanguage: selectedSnippet.language,
              customDifficulty: selectedSnippet.difficulty,
              customContent: selectedSnippet.code || selectedSnippet.content,
            });
            if (initRes?.id) {
              sessionId = initRes.id;
            }
          } catch (initErr) {
            console.warn('Could not auto-start session at completion:', initErr);
          }
        }

        if (sessionId) {
          serverResult = await practiceService.completeSession(sessionId, {
            totalKeystrokes: finalMetrics.totalKeystrokes,
            correctCharacters: finalMetrics.correctChars,
            incorrectCharacters: finalMetrics.uncorrectedErrors,
            errorCount: finalMetrics.errorCount,
            elapsedMs: Math.round(finalMetrics.elapsedSeconds * 1000),
          });
        }

        // Spaced Repetition (SRS) Performance Matrix Analysis (Templates only, never Custom Studio)
        const isCustomSnippet = Boolean(
          selectedSnippet?.isCustom ||
          String(selectedSnippet?.id || '').startsWith('custom-') ||
          selectedSnippet?.category === 'Custom Drills' ||
          selectedSnippet?.category === 'Custom Studio' ||
          location.state?.snippet?.isCustom
        );

        if (!isCustomSnippet) {
          try {
            const cardSnippetId = selectedSnippet?.slug || selectedSnippet?.id || srsCardIdParam;
            if (cardSnippetId) {
              const qualityScore = deriveQualityScore({
                netWpm: finalMetrics.netWpm,
                accuracy: finalMetrics.accuracy,
                errorCount: finalMetrics.errorCount || 0,
                hintsUsed,
                practiceMode,
              });

              const reviewResult = await srsService.submitReview({
                snippetId: String(cardSnippetId),
                title: selectedSnippet?.title || String(cardSnippetId),
                language: selectedSnippet?.language || 'C++',
                qualityScore,
                netWpm: finalMetrics.netWpm,
                accuracy: finalMetrics.accuracy,
                errorCount: finalMetrics.errorCount || 0,
                category: selectedSnippet?.category || 'Template Blueprint',
              });

              if (reviewResult) {
                setServerMetrics((prev) => ({
                  ...(prev || finalMetrics),
                  xpEarned: (prev?.xpEarned || 0) + (reviewResult.xpAward?.xpEarned || 30),
                  srsReviewed: true,
                  srsRepetition: reviewResult.repetition,
                  srsIntervalDays: reviewResult.intervalDays,
                  srsMastered: reviewResult.isMastered,
                }));
              }
            }
          } catch (srsErr) {
            console.warn('Could not record SRS recall review:', srsErr);
          }
        }

        if (serverResult) {
          setServerMetrics({
            ...finalMetrics,
            grossWpm: Number(serverResult.grossWpm),
            netWpm: Number(serverResult.netWpm),
            accuracy: Math.round(Number(serverResult.accuracyPercent)),
            errorCount: serverResult.errorCount,
            elapsedSeconds: Math.round((serverResult.durationMs / 100) / 10) / 10,
            isServerVerified: true,
            xpEarned: serverResult.xpEarned,
            totalXp: serverResult.totalXp,
            currentLevel: serverResult.currentLevel,
            nextLevelXp: serverResult.nextLevelXp,
            levelProgressPercent: serverResult.levelProgressPercent,
            newlyUnlockedAchievements: serverResult.newlyUnlockedAchievements || [],
            keyErrorMap,
            errorLocations,
            code: selectedSnippet.code || selectedSnippet.content,
            syntaxErrors,
          });

          // Mirror server-verified ID and date into user storage
          const verifiedSession = {
            id: String(serverResult.id),
            serverSessionId: serverResult.id,
            userId: user?.id,
            snippetId: selectedSnippet.id || selectedSnippet.slug,
            title: selectedSnippet.title,
            snippetTitle: selectedSnippet.title,
            language: selectedSnippet.language,
            difficulty: selectedSnippet.difficulty,
            wpm: Math.round(Number(serverResult.netWpm)),
            netWpm: Math.round(Number(serverResult.netWpm)),
            grossWpm: Math.round(Number(serverResult.grossWpm)),
            accuracy: Math.round(Number(serverResult.accuracyPercent)),
            accuracyPercent: Math.round(Number(serverResult.accuracyPercent)),
            errors: serverResult.errorCount,
            durationSeconds: Math.round((serverResult.durationMs || 0) / 1000),
            durationMs: serverResult.durationMs,
            date: serverResult.completedAt || new Date().toISOString(),
            completedAt: serverResult.completedAt || new Date().toISOString(),
          };
          saveUserSession(verifiedSession, user?.id);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('devtype_session_completed', { detail: verifiedSession }));
          }
        }

        // Eagerly prefetch fresh dashboard, streaks, and sessions in the background
        if (user?.id) {
          dataCache.prefetchAll(user.id);
        }

        activeSessionIdRef.current = null;
        activeSessionPromiseRef.current = null;
      } catch (err) {
        console.warn('Could not complete practice session on backend:', err);
      } finally {
        isSubmittingRef.current = false;
        setResultsModalOpen(true);
      }
    },
    [saveSessionResults, selectedSnippet, keyErrorMap, errorLocations, syntaxErrors]
  );

  // ── Handle Auto-Expiration for Timed Mode (60s benchmark) ──
  const handleTimedExpiration = useCallback(() => {
    const finalSpan = TIMED_DURATION_MS;
    const finalMetrics = calculateTypingMetrics({
      totalKeystrokes,
      correctChars,
      totalErrors,
      uncorrectedErrors,
      elapsedMs: finalSpan,
      totalSnippetChars: tokenizedSnippet.totalChars,
      currentCursorIndex: cursorIndex,
    });
    submitSessionCompletion(finalMetrics);
  }, [
    totalKeystrokes,
    correctChars,
    totalErrors,
    uncorrectedErrors,
    tokenizedSnippet.totalChars,
    cursorIndex,
    submitSessionCompletion,
  ]);

  useEffect(() => {
    onTimedCompleteRef.current = handleTimedExpiration;
  }, [handleTimedExpiration]);

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
        startServerSession();
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

        const charData = flatChars[cursorIndex];
        setKeyErrorMap((prev) => {
          const existing = prev[expectedChar] || { char: expectedChar, count: 0, typedMap: {} };
          const nextTypedMap = { ...existing.typedMap, [key]: (existing.typedMap[key] || 0) + 1 };
          return {
            ...prev,
            [expectedChar]: {
              char: expectedChar,
              count: existing.count + 1,
              typedMap: nextTypedMap,
            },
          };
        });

        setErrorLocations((prev) => [
          ...prev,
          {
            index: cursorIndex,
            expected: expectedChar,
            typed: key,
            line: (charData?.lineIndex ?? 0) + 1,
            col: (charData?.colIndex ?? 0) + 1,
          },
        ]);
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
        setStrictErrorPulse(true);
        setTimeout(() => setStrictErrorPulse(false), 280);
        return;
      }

      setTotalKeystrokes((prev) => prev + 1);

      if (!isCorrect) {
        setTotalErrors((prev) => prev + 1);
      }

      // Record in typed history and advance through leading indentation if newline
      let finalIndex = cursorIndex + 1;
      let indentSpaces = 0;
      const autoIndentItems = [];

      if (key === '\n' && isCorrect && finalIndex < flatChars.length) {
        const nextLineNum = flatChars[finalIndex].lineIndex;
        while (
          finalIndex < flatChars.length &&
          flatChars[finalIndex].lineIndex === nextLineNum &&
          (flatChars[finalIndex].char === ' ' || flatChars[finalIndex].char === '\t')
        ) {
          if (finalIndex + 1 < flatChars.length && flatChars[finalIndex + 1].isNewline && flatChars[finalIndex + 1].lineIndex === nextLineNum) {
            autoIndentItems.push({ idx: finalIndex, item: { typedChar: flatChars[finalIndex].char, isCorrect: true, isAutoIndent: true } });
            finalIndex++;
            indentSpaces++;
            break;
          }
          autoIndentItems.push({ idx: finalIndex, item: { typedChar: flatChars[finalIndex].char, isCorrect: true, isAutoIndent: true } });
          finalIndex++;
          indentSpaces++;
        }
      }

      setTypedHistory((prev) => {
        const next = [...prev];
        next[cursorIndex] = { typedChar: key, isCorrect };
        for (const item of autoIndentItems) {
          next[item.idx] = item.item;
        }
        return next;
      });

      if (indentSpaces > 0) {
        setTotalKeystrokes((prev) => prev + indentSpaces);
        setCorrectChars((prev) => prev + indentSpaces);
      }

      setCursorIndex(finalIndex);
      if (hintIndex !== null) setHintIndex(null);

      // Check for completion
      if (finalIndex >= flatChars.length) {
        setSessionState('completed');
        const finalSpan = startTimeRef.current
          ? accumulatedMsRef.current + (Date.now() - startTimeRef.current)
          : elapsedMs;
        setElapsedMs(finalSpan);

        const finalMetrics = calculateTypingMetrics({
          totalKeystrokes: totalKeystrokes + 1 + indentSpaces,
          correctChars: (isCorrect ? correctChars + 1 : correctChars) + indentSpaces,
          totalErrors: !isCorrect ? totalErrors + 1 : totalErrors,
          uncorrectedErrors: !isCorrect ? uncorrectedErrors + 1 : uncorrectedErrors,
          elapsedMs: finalSpan,
          totalSnippetChars: flatChars.length,
          currentCursorIndex: finalIndex,
        });

        submitSessionCompletion(finalMetrics);
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
      startServerSession,
      submitSessionCompletion,
    ]
  );

  // ── Keystroke Handler: Backspace ──
  const handleBackspace = useCallback(() => {
    if (sessionState === 'completed' || sessionState === 'paused' || cursorIndex <= 0) return;

    const flatChars = tokenizedSnippet?.flatChars || [];
    let newCursor = cursorIndex;
    let countRemoved = 0;

    // If preceding character was auto-indented, roll back auto-indented spaces AND the newline
    if (typedHistory[newCursor - 1]?.isAutoIndent) {
      while (newCursor > 0 && typedHistory[newCursor - 1]?.isAutoIndent) {
        newCursor--;
        countRemoved++;
      }
      // Also undo the newline that triggered the auto-indent
      if (newCursor > 0 && flatChars[newCursor - 1]?.isNewline) {
        newCursor--;
        countRemoved++;
      }
      // And any trailing spaces that were auto-filled on that line
      while (newCursor > 0 && typedHistory[newCursor - 1]?.isAutoIndent) {
        newCursor--;
        countRemoved++;
      }

      setTypedHistory((prev) => prev.slice(0, newCursor));
      setCursorIndex(newCursor);
      setCorrectChars((prev) => Math.max(0, prev - countRemoved));
      setTotalKeystrokes((prev) => Math.max(0, prev - countRemoved));
    } else {
      setCursorIndex((prev) => Math.max(0, prev - 1));
      setTypedHistory((prev) => {
        const next = [...prev];
        next.pop();
        return next;
      });
    }
  }, [sessionState, cursorIndex, typedHistory, tokenizedSnippet?.flatChars]);

  // ── Keystroke Handler: Enter (Newline & Auto-Indent to Starting Letter) ──
  const handleEnter = useCallback(() => {
    if (sessionState === 'completed' || sessionState === 'paused') return;

    const flatChars = tokenizedSnippet?.flatChars || [];
    if (!flatChars || cursorIndex >= flatChars.length) return;

    // Check if current char is \n OR if all characters from cursorIndex to the next \n are whitespace
    let newlineIdx = cursorIndex;
    let onlySpacesTillNewline = true;
    while (newlineIdx < flatChars.length && !flatChars[newlineIdx].isNewline) {
      if (flatChars[newlineIdx].char !== ' ' && flatChars[newlineIdx].char !== '\t') {
        onlySpacesTillNewline = false;
        break;
      }
      newlineIdx++;
    }

    // If user hit Enter in the middle of code (untyped non-whitespace characters remain on this line),
    // delegate to standard handleKeyPress
    if (!onlySpacesTillNewline || newlineIdx >= flatChars.length || !flatChars[newlineIdx].isNewline) {
      handleKeyPress('\n');
      return;
    }

    // Start timer on first valid keystroke
    if (sessionState === 'idle') {
      setSessionState('active');
      startTimeRef.current = Date.now();
      startServerSession();
    }

    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 900);

    const historyUpdates = [];
    let countAdded = 0;

    // 1. Fill trailing spaces (if any)
    for (let i = cursorIndex; i < newlineIdx; i++) {
      historyUpdates.push({ idx: i, item: { typedChar: flatChars[i].char, isCorrect: true, isAutoIndent: true } });
      countAdded++;
    }

    // 2. Fill newline
    historyUpdates.push({ idx: newlineIdx, item: { typedChar: '\n', isCorrect: true } });
    countAdded++;

    // 3. Auto-indent next line: advance past all leading spaces/tabs to starting letter of code
    const nextLineStartIdx = newlineIdx + 1;
    let targetIdx = nextLineStartIdx;

    if (nextLineStartIdx < flatChars.length) {
      const nextLineNum = flatChars[nextLineStartIdx].lineIndex;
      while (
        targetIdx < flatChars.length &&
        flatChars[targetIdx].lineIndex === nextLineNum &&
        (flatChars[targetIdx].char === ' ' || flatChars[targetIdx].char === '\t')
      ) {
        // If the entire next line is just whitespace up to another newline, stop before that newline
        if (targetIdx + 1 < flatChars.length && flatChars[targetIdx + 1].isNewline && flatChars[targetIdx + 1].lineIndex === nextLineNum) {
          historyUpdates.push({ idx: targetIdx, item: { typedChar: flatChars[targetIdx].char, isCorrect: true, isAutoIndent: true } });
          targetIdx++;
          countAdded++;
          break;
        }
        historyUpdates.push({ idx: targetIdx, item: { typedChar: flatChars[targetIdx].char, isCorrect: true, isAutoIndent: true } });
        targetIdx++;
        countAdded++;
      }
    }

    setStreak((prev) => prev + 1);
    setTotalKeystrokes((prev) => prev + countAdded);
    setCorrectChars((prev) => prev + countAdded);

    setTypedHistory((prev) => {
      const next = [...prev];
      for (const update of historyUpdates) {
        next[update.idx] = update.item;
      }
      return next;
    });

    setCursorIndex(targetIdx);
    if (hintIndex !== null) setHintIndex(null);

    // Track peak WPM
    const currentSpan = startTimeRef.current
      ? accumulatedMsRef.current + (Date.now() - startTimeRef.current)
      : elapsedMs;
    const minutes = currentSpan / 60000;
    if (minutes > 0.05) {
      const liveWpm = Math.round(Math.max(0, ((correctChars + countAdded) / 5) / minutes));
      setPeakWpm((prev) => Math.max(prev, liveWpm));
    }

    // Check for completion
    if (targetIdx >= flatChars.length) {
      setSessionState('completed');
      const finalSpan = startTimeRef.current
        ? accumulatedMsRef.current + (Date.now() - startTimeRef.current)
        : elapsedMs;
      setElapsedMs(finalSpan);

      const finalMetrics = calculateTypingMetrics({
        totalKeystrokes: totalKeystrokes + countAdded,
        correctChars: correctChars + countAdded,
        totalErrors,
        uncorrectedErrors,
        elapsedMs: finalSpan,
        totalSnippetChars: flatChars.length,
        currentCursorIndex: targetIdx,
      });

      submitSessionCompletion(finalMetrics);
    }
  }, [
    sessionState,
    tokenizedSnippet?.flatChars,
    cursorIndex,
    totalKeystrokes,
    correctChars,
    totalErrors,
    uncorrectedErrors,
    elapsedMs,
    hintIndex,
    handleKeyPress,
    startServerSession,
    submitSessionCompletion,
  ]);

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
        startServerSession();
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
        const finalSpan = startTimeRef.current
          ? accumulatedMsRef.current + (Date.now() - startTimeRef.current)
          : elapsedMs;
        setElapsedMs(finalSpan);

        const finalMetrics = calculateTypingMetrics({
          totalKeystrokes: totalKeystrokes + strokes,
          correctChars: correctChars + strokes,
          totalErrors,
          uncorrectedErrors,
          elapsedMs: finalSpan,
          totalSnippetChars: flatChars.length,
          currentCursorIndex: nextIdx,
        });

        submitSessionCompletion(finalMetrics);
      }
    } else {
      handleKeyPress('\t');
    }
  }, [
    sessionState,
    tokenizedSnippet.flatChars,
    cursorIndex,
    totalKeystrokes,
    correctChars,
    totalErrors,
    uncorrectedErrors,
    elapsedMs,
    handleKeyPress,
    startServerSession,
    submitSessionCompletion,
  ]);

  // ── Session Unmount Abandonment Guard ──
  useEffect(() => {
    return () => {
      if (activeSessionIdRef.current) {
        practiceService.abandonSession(activeSessionIdRef.current);
      }
    };
  }, []);

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

  // ── Next Snippet in Catalog ──
  const handleNextSnippet = useCallback(
    async (action = 'next_template', customLang = null) => {
      setResultsModalOpen(false);
      try {
        const currentLang = customLang || selectedSnippet?.language || 'C++';

        // Action A: Practice the SAME algorithm in the next programming language
        if (action === 'next_language') {
          const supported = ['C++', 'Python', 'Java', 'JavaScript', 'TypeScript', 'C', 'Rust', 'Go'];
          const curIdx = supported.findIndex((l) => l.toLowerCase() === currentLang.toLowerCase());
          const nextLang = supported[(curIdx + 1) % supported.length];
          const rawSlug = selectedSnippet?.slug || selectedSnippet?.id || 'binary-search';
          const baseSlug = rawSlug.replace(/-(cpp|c|python|java|javascript|typescript|go|rust)$/i, '');
          const localized = await templateService.getTemplateById(baseSlug, nextLang);
          if (localized && localized.code) {
            setSelectedSnippet(localized);
            navigate(`/practice?snippet=${localized.slug || baseSlug}&lang=${encodeURIComponent(nextLang)}&lockLang=true`, {
              replace: true,
              state: { snippet: localized },
            });
            resetSession();
            return;
          }
        }

        // Action B: Advance to the NEXT algorithmic problem in the SAME language
        const result = await templateService.getTemplates({ page: 0, size: 50, sort: 'createdAt,desc', language: currentLang });
        const items = (result?.items || []).filter(
          (item) => !currentLang || item.language?.toLowerCase() === currentLang.toLowerCase()
        );

        if (items.length > 0) {
          const currentIndex = items.findIndex(
            (s) => s.id === selectedSnippet?.id || s.slug === selectedSnippet?.slug
          );
          const nextMeta =
            currentIndex >= 0 && currentIndex < items.length - 1
              ? items[currentIndex + 1]
              : items[0];

          const nextFull = await templateService.getTemplateById(nextMeta.slug || nextMeta.id, currentLang);
          const resolved = nextFull || nextMeta;
          setSelectedSnippet(resolved);
          navigate(`/practice?snippet=${resolved.slug || resolved.id}&lang=${encodeURIComponent(currentLang)}&lockLang=true`, {
            replace: true,
            state: { snippet: resolved },
          });
          resetSession();
        } else {
          navigate('/templates');
        }
      } catch (err) {
        console.warn('Failed to cycle to next snippet:', err);
        navigate('/templates');
      }
    },
    [selectedSnippet, navigate, resetSession]
  );

  // ── Language Switcher from Blueprint Card ──
  const handleLanguageChange = useCallback(
    (newLang) => {
      localStorage.setItem('devtype_preferred_lang', newLang);
      const rawSlug = selectedSnippet?.slug || selectedSnippet?.id || 'binary-search';
      const baseSlug = rawSlug.replace(/-(cpp|c|python|java|javascript|typescript|go|rust)$/i, '');
      navigate(`/practice?snippet=${baseSlug}&lang=${encodeURIComponent(newLang)}&lockLang=true`, { replace: true });
      fetchSnippet(baseSlug, newLang);
    },
    [selectedSnippet, navigate, fetchSnippet]
  );

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

  // Loading state when initial snippet is being fetched from backend
  if (isLoadingSnippet && !selectedSnippet) {
    return (
      <div
        className="practice-workspace-root"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: '40px 20px',
        }}
      >
        <div className="tpl-empty-card" style={{ maxWidth: 460, textAlign: 'center', margin: '0 auto' }}>
          <div
            className="tpl-empty-icon-wrap"
            style={{
              animation: 'spin 1.2s linear infinite',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Loader2 size={32} />
          </div>
          <h3 className="tpl-empty-title">Loading Practice Template...</h3>
          <p className="tpl-empty-desc">
            Fetching verified source blueprint specifications from the DevType catalog.
          </p>
        </div>
      </div>
    );
  }

  // Error state when snippet cannot be loaded, is unpublished, or backend is unreachable
  if (snippetError && !selectedSnippet) {
    return (
      <div
        className="practice-workspace-root"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: '40px 20px',
        }}
      >
        <div
          className="tpl-empty-card"
          style={{
            maxWidth: 480,
            textAlign: 'center',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            margin: '0 auto',
          }}
        >
          <div
            className="tpl-empty-icon-wrap"
            style={{ color: 'var(--red)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <AlertTriangle size={32} />
          </div>
          <h3 className="tpl-empty-title">Practice Template Unavailable</h3>
          <p className="tpl-empty-desc">{snippetError}</p>
          <div className="tpl-empty-actions" style={{ justifyContent: 'center', gap: 12, marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => fetchSnippet(snippetParam)}
              id="btn-retry-practice-template"
            >
              <RotateCcw size={14} />
              <span>Retry Request</span>
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/templates')}
              id="btn-return-to-catalog"
            >
              <Compass size={14} />
              <span>Browse Catalog</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedSnippet) {
    return null;
  }

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
            strictErrorPulse={strictErrorPulse}
            maskMap={maskMap}
            hintIndex={hintIndex}
            onRequestHint={handleRequestHint}
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
            practiceMode={practiceMode}
            onRequestHint={handleRequestHint}
            hintsUsed={hintsUsed}
            onSelectMode={setMode}
            onBrowseTemplates={() => navigate('/templates')}
            onSelectLanguage={handleLanguageChange}
            isLanguageLocked={isLanguageLocked}
            remainingSeconds={remainingSeconds}
          />

          <PracticeTelemetryCard
            metrics={metrics}
            streak={streak}
            peakWpm={peakWpm}
            syntaxErrors={syntaxErrors}
            isTyping={isTyping}
            soundEnabled={soundEnabled}
            mode={mode}
            remainingSeconds={remainingSeconds}
            onToggleSound={() => setSoundEnabled((prev) => !prev)}
            onReset={handleRestart}
            onBackToDashboard={handleQuit}
          />
        </div>
      </div>

      {/* ── Polished Results Modal ── */}
      <PracticeResultsModal
        isOpen={resultsModalOpen}
        metrics={serverMetrics || metrics}
        snippet={selectedSnippet}
        keyErrorMap={keyErrorMap}
        errorLocations={errorLocations}
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
