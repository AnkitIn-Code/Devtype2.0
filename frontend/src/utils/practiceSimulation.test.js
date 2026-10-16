// src/utils/practiceSimulation.test.js
import { tokenizeCodeSnippet } from './codeTokenizer.ts';
import { calculateTypingMetrics } from './typingMetrics.ts';
import { SNIPPETS } from '../data/snippets.ts';

function runSimulationTests() {
  console.log('--- Starting Code Typing Workspace Simulation Tests ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${message}`);
      failed++;
    }
  }

  // Test 1: Verify all snippets tokenize without error
  assert(SNIPPETS.length >= 10, `Found ${SNIPPETS.length} snippets (expected >= 10)`);
  for (const snippet of SNIPPETS) {
    const tokenized = tokenizeCodeSnippet(snippet.code, snippet.language);
    assert(tokenized.totalChars > 0, `Snippet "${snippet.title}" (${snippet.language}) has ${tokenized.totalChars} chars`);
    assert(tokenized.lines.length > 0, `Snippet "${snippet.title}" has ${tokenized.lines.length} lines`);
    assert(tokenized.lines[0].lineNumber === 1, `Line 1 number is 1`);
  }

  // Test 2: Typing Simulation with correct keystrokes
  const testSnippet = SNIPPETS[0]; // C++ LRU Cache
  const tokenized = tokenizeCodeSnippet(testSnippet.code, testSnippet.language);
  const chars = tokenized.flatChars;

  let cursorIndex = 0;
  let typedHistory = [];
  let totalKeystrokes = 0;
  let totalErrors = 0;

  // Type first 50 characters accurately
  for (let i = 0; i < 50; i++) {
    const expected = chars[cursorIndex].char;
    typedHistory.push({ typedChar: expected, isCorrect: true });
    totalKeystrokes++;
    cursorIndex++;
  }

  assert(cursorIndex === 50, 'Cursor advanced to 50');
  assert(typedHistory.length === 50, 'History has 50 entries');
  assert(totalErrors === 0, 'No errors in accurate typing');

  // Type an error at index 50
  const mistakeKey = chars[cursorIndex].char === 'x' ? 'y' : 'x';
  typedHistory.push({ typedChar: mistakeKey, isCorrect: false });
  totalKeystrokes++;
  totalErrors++;
  cursorIndex++;

  assert(cursorIndex === 51, 'Cursor advanced on error to show error state');
  assert(totalErrors === 1, 'Error count recorded as 1');
  assert(typedHistory[50].isCorrect === false, 'Character 50 marked as incorrect');

  // Backspace to fix the error
  cursorIndex--;
  typedHistory.pop();

  assert(cursorIndex === 50, 'Cursor decremented on backspace');
  assert(typedHistory.length === 50, 'History popped on backspace');

  // Retype correctly
  const correctKey = chars[cursorIndex].char;
  typedHistory.push({ typedChar: correctKey, isCorrect: true });
  totalKeystrokes++;
  cursorIndex++;

  assert(cursorIndex === 51, 'Cursor advanced after error correction');

  // Test 3: Metrics during session
  const midMetrics = calculateTypingMetrics({
    totalKeystrokes,
    correctChars: 51,
    totalErrors, // 1 error occurred
    uncorrectedErrors: 0, // was corrected
    elapsedMs: 30000, // 30 seconds
    totalSnippetChars: tokenized.totalChars,
    currentCursorIndex: cursorIndex,
  });

  assert(midMetrics.grossWpm > 0, `Mid-session Gross WPM is ${midMetrics.grossWpm}`);
  assert(midMetrics.netWpm > 0, `Mid-session Net WPM is ${midMetrics.netWpm}`);
  assert(midMetrics.accuracy >= 98, `Mid-session Accuracy is ${midMetrics.accuracy}%`);
  assert(midMetrics.errorCount === 1, 'Total errors made is 1');
  assert(midMetrics.progressPercent === Math.round((51 / tokenized.totalChars) * 100), `Progress is ${midMetrics.progressPercent}%`);

  // Test 4: Complete the snippet
  while (cursorIndex < chars.length) {
    typedHistory.push({ typedChar: chars[cursorIndex].char, isCorrect: true });
    totalKeystrokes++;
    cursorIndex++;
  }

  assert(cursorIndex === chars.length, 'Completed entire snippet');

  const finalMetrics = calculateTypingMetrics({
    totalKeystrokes,
    correctChars: chars.length,
    totalErrors,
    uncorrectedErrors: 0,
    elapsedMs: 65000, // 65 seconds
    totalSnippetChars: tokenized.totalChars,
    currentCursorIndex: cursorIndex,
  });

  assert(finalMetrics.isComplete === true, 'Session isComplete flag is true');
  assert(finalMetrics.progressPercent === 100, 'Final progress is 100%');
  assert(finalMetrics.formattedTime === '1:05', `Formatted time is ${finalMetrics.formattedTime}`);

  console.log(`\nSimulation Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runSimulationTests();
