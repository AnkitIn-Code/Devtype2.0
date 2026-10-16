// src/utils/typingMetrics.test.js
import { calculateTypingMetrics, formatElapsedTime, getPerformanceTier } from './typingMetrics.ts';

function runTests() {
  console.log('Running typingMetrics tests...');
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

  // Test 1: Zero elapsed time and zero keystrokes (Guard against division by zero)
  const initialMetrics = calculateTypingMetrics({
    totalKeystrokes: 0,
    correctChars: 0,
    totalErrors: 0,
    uncorrectedErrors: 0,
    elapsedMs: 0,
    totalSnippetChars: 100,
    currentCursorIndex: 0,
  });

  assert(initialMetrics.grossWpm === 0, 'Initial gross WPM is 0');
  assert(initialMetrics.netWpm === 0, 'Initial net WPM is 0');
  assert(initialMetrics.accuracy === 100, 'Initial accuracy is 100%');
  assert(initialMetrics.formattedTime === '0:00', 'Initial formatted time is 0:00');
  assert(initialMetrics.progressPercent === 0, 'Initial progress is 0%');
  assert(initialMetrics.isComplete === false, 'Initial isComplete is false');

  // Test 2: Normal typing (60 seconds, 300 keystrokes, 5 errors, all corrected)
  // gross = (300 / 5) / 1 min = 60 WPM
  // net = (295 / 5) / 1 min = 59 WPM
  // accuracy = (295 / 300) * 100 = 98%
  const activeMetrics = calculateTypingMetrics({
    totalKeystrokes: 300,
    correctChars: 295,
    totalErrors: 5,
    uncorrectedErrors: 0,
    elapsedMs: 60000,
    totalSnippetChars: 300,
    currentCursorIndex: 295,
  });

  assert(activeMetrics.grossWpm === 60, `Gross WPM is 60 (got ${activeMetrics.grossWpm})`);
  assert(activeMetrics.netWpm === 59, `Net WPM is 59 (got ${activeMetrics.netWpm})`);
  assert(activeMetrics.accuracy === 98, `Accuracy is 98% (got ${activeMetrics.accuracy}%)`);
  assert(activeMetrics.formattedTime === '1:00', `Formatted time is 1:00 (got ${activeMetrics.formattedTime})`);
  assert(activeMetrics.progressPercent === 98, `Progress is 98% (got ${activeMetrics.progressPercent}%)`);
  assert(activeMetrics.isComplete === false, 'Not complete yet');

  // Test 3: Completion check
  const completeMetrics = calculateTypingMetrics({
    totalKeystrokes: 100,
    correctChars: 100,
    totalErrors: 0,
    uncorrectedErrors: 0,
    elapsedMs: 30000,
    totalSnippetChars: 100,
    currentCursorIndex: 100,
  });

  assert(completeMetrics.isComplete === true, 'Completion flag is true');
  assert(completeMetrics.progressPercent === 100, 'Progress is 100%');
  assert(completeMetrics.grossWpm === 40, `Gross WPM is 40 (got ${completeMetrics.grossWpm})`);
  assert(completeMetrics.netWpm === 40, `Net WPM is 40 (got ${completeMetrics.netWpm})`);

  // Test 4: Time formatting
  assert(formatElapsedTime(0) === '0:00', '0 ms formats as 0:00');
  assert(formatElapsedTime(5000) === '0:05', '5000 ms formats as 0:05');
  assert(formatElapsedTime(65000) === '1:05', '65000 ms formats as 1:05');
  assert(formatElapsedTime(125000) === '2:05', '125000 ms formats as 2:05');

  // Test 5: Performance tiers
  assert(getPerformanceTier(95, 98).badge.includes('Supreme'), 'High score gives Supreme tier');
  assert(getPerformanceTier(70, 95).badge.includes('Advanced'), 'Medium-high score gives Advanced tier');
  assert(getPerformanceTier(30, 85).badge.includes('Developing'), 'Low score gives Developing tier');

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests();
