// src/utils/clozeMasker.js

/**
 * Checks if a line is a function/method signature, class definition, comment, or structural delimiter
 * that should stay visible in Blind Mode.
 *
 * @param {string} trimmed Trimmed raw text of the line
 * @param {number} lineIdx Index of the line in the snippet
 * @param {number} totalLines Total number of lines
 * @returns {boolean}
 */
function isSignatureCommentOrStructure(trimmed, lineIdx, totalLines) {
  // First and last lines of a snippet are always preserved
  if (lineIdx === 0 || lineIdx === totalLines - 1) {
    return true;
  }

  // Comments (single line, multiline, docstrings)
  if (
    trimmed.startsWith('//') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('*')
  ) {
    return true;
  }

  // Structural braces, access specifiers, and annotations
  if (
    trimmed === '{' ||
    trimmed === '}' ||
    trimmed === '};' ||
    trimmed === 'public:' ||
    trimmed === 'private:' ||
    trimmed === 'protected:' ||
    trimmed.startsWith('@')
  ) {
    return true;
  }

  // Module imports, preprocessor directives, and package statements
  if (
    trimmed.startsWith('#include') ||
    trimmed.startsWith('import ') ||
    trimmed.startsWith('from ') ||
    trimmed.startsWith('package ') ||
    trimmed.startsWith('using namespace')
  ) {
    return true;
  }

  // Class, Struct, Interface, Type declarations
  if (
    trimmed.startsWith('class ') ||
    trimmed.startsWith('struct ') ||
    trimmed.startsWith('interface ') ||
    trimmed.startsWith('type ') ||
    trimmed.startsWith('typedef ')
  ) {
    return true;
  }

  // Function / Method declarations: has '(' and (ends with '{' or '):' or has declaration keywords)
  const isFuncDeclaration =
    trimmed.includes('(') &&
    (trimmed.endsWith('{') ||
      trimmed.endsWith('):') ||
      trimmed.endsWith(') {') ||
      /^(public|private|protected|static|async|def|fn|func|function|void|int|bool|string|double|float|char|auto|const|template)/.test(
        trimmed
      ));

  return isFuncDeclaration;
}

/**
 * Extracts candidate code words from a subset of lines.
 * Excludes comments, preprocessor/import lines, and standalone structural tokens.
 *
 * @param {Array<any>} linesSubset Array of line objects
 * @returns {Array<{ word: string, globalIndices: number[], lineIndex: number }>}
 */
function extractEligibleWords(linesSubset) {
  const eligibleWords = [];

  linesSubset.forEach((line) => {
    const lineRaw = line.chars.map((c) => c.char).join('');
    const trimmed = lineRaw.trim();

    // Skip pure comment, import, or single-brace lines
    if (
      trimmed.startsWith('//') ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('import ') ||
      trimmed.startsWith('package ') ||
      trimmed.startsWith('using namespace') ||
      trimmed === '{' ||
      trimmed === '}' ||
      trimmed === '};' ||
      trimmed === 'public:' ||
      trimmed === 'private:'
    ) {
      return;
    }

    // Match code words: identifiers, keywords, types (alphanumeric + underscore)
    const regex = /[a-zA-Z_][a-zA-Z0-9_]*/g;
    let match;

    while ((match = regex.exec(lineRaw)) !== null) {
      const startIndex = match.index;
      const wordStr = match[0];
      const endIndex = startIndex + wordStr.length;

      const wordChars = line.chars.slice(startIndex, endIndex);

      // Verify that this word is not within a trailing line comment
      const isComment = wordChars.some((c) => c.tokenType === 'comment');
      if (isComment) continue;

      // Filter words of length >= 2
      if (wordStr.length >= 2) {
        eligibleWords.push({
          word: wordStr,
          globalIndices: wordChars.map((c) => c.globalIndex),
          lineIndex: line.lineNumber - 1,
        });
      }
    }
  });

  return eligibleWords;
}

/**
 * Uniformly random sample of distinct elements from an array.
 *
 * @template T
 * @param {T[]} items
 * @param {number} count
 * @param {() => number} randomFn
 * @returns {T[]}
 */
function sampleDistinct(items, count, randomFn) {
  if (items.length <= count) return [...items];

  const pool = [...items];
  const selected = [];

  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(randomFn() * pool.length);
    selected.push(pool[idx]);
    pool.splice(idx, 1);
  }

  return selected;
}

/**
 * Generates a boolean mask array for characters in a snippet based on Practice Mode.
 *
 * Modes:
 * - 'copy': 100% visible (no characters masked).
 * - 'blind': Function name, signature, comments, imports, and structural delimiters stay visible;
 *            inner implementation logic lines are masked.
 * - 'cloze': In every 10 lines of template code, randomly makes 2 words blind.
 *            If lines are less than 10, randomly makes 1 word blind.
 *
 * @param {import('./codeTokenizer').TokenizedSnippet} tokenizedSnippet
 * @param {'copy' | 'cloze' | 'blind'} mode
 * @param {() => number} [randomFn=Math.random] Random number generator for word sampling
 * @returns {boolean[]} Array of booleans where true = character is masked from view
 */
export function generateCharacterMask(tokenizedSnippet, mode = 'copy', randomFn = Math.random) {
  if (!tokenizedSnippet || !tokenizedSnippet.flatChars) return [];
  const { lines, flatChars } = tokenizedSnippet;

  if (mode === 'copy') {
    // Tier 1: Nothing is masked
    return new Array(flatChars.length).fill(false);
  }

  // Tier 3: Blind Mode
  // Function names, method signatures, comments, and structure are visible.
  // Implementation lines inside the functions are masked.
  if (mode === 'blind') {
    const mask = new Array(flatChars.length).fill(false);

    lines.forEach((line, lineIdx) => {
      const lineRaw = line.chars.map((c) => c.char).join('');
      const trimmed = lineRaw.trim();

      // If the line is a signature, comment, structural delimiter, or import, keep it visible
      if (isSignatureCommentOrStructure(trimmed, lineIdx, lines.length)) {
        return;
      }

      // Otherwise, mask all non-whitespace, non-newline implementation characters
      line.chars.forEach((c) => {
        if (!c.isWhitespace && !c.isNewline) {
          mask[c.globalIndex] = true;
        }
      });
    });

    return mask;
  }

  // Tier 2: Cloze Mode
  // Rule: In every 10 lines of template code, randomly make 2 words blind.
  //       If lines are less than 10, make 1 word blind.
  const mask = new Array(flatChars.length).fill(false);

  if (lines.length < 10) {
    // Fewer than 10 lines total: pick 1 word blind across the entire template
    const words = extractEligibleWords(lines);
    const chosen = sampleDistinct(words, 1, randomFn);
    chosen.forEach((w) => {
      w.globalIndices.forEach((gIdx) => {
        mask[gIdx] = true;
      });
    });
  } else {
    // 10 or more lines: chunk into 10-line blocks
    const BLOCK_SIZE = 10;
    const numBlocks = Math.ceil(lines.length / BLOCK_SIZE);

    for (let b = 0; b < numBlocks; b++) {
      const startLine = b * BLOCK_SIZE;
      const endLine = Math.min(lines.length, startLine + BLOCK_SIZE);
      const linesInBlock = lines.slice(startLine, endLine);
      const blockSize = endLine - startLine;

      // If this block has 10 lines: 2 words blind. If the trailing block has < 10 lines: 1 word blind.
      const targetWords = blockSize >= 10 ? 2 : 1;

      const words = extractEligibleWords(linesInBlock);
      const chosen = sampleDistinct(words, targetWords, randomFn);
      chosen.forEach((w) => {
        w.globalIndices.forEach((gIdx) => {
          mask[gIdx] = true;
        });
      });
    }
  }

  return mask;
}
