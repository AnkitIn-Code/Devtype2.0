// src/utils/clozeMasker.js

/**
 * Generates a boolean mask array for characters in a snippet based on Practice Mode.
 *
 * @param {object} tokenizedSnippet
 * @param {'copy' | 'cloze' | 'blind'} mode
 * @returns {boolean[]} Array of booleans where true = character is masked from view
 */
export function generateCharacterMask(tokenizedSnippet, mode = 'copy') {
  if (!tokenizedSnippet || !tokenizedSnippet.flatChars) return [];
  const { lines, flatChars } = tokenizedSnippet;

  if (mode === 'copy') {
    // Tier 1: Nothing is masked
    return new Array(flatChars.length).fill(false);
  }

  if (mode === 'blind') {
    // Tier 3: Everything except comments and signatures is hidden
    return new Array(flatChars.length).fill(true);
  }

  // Tier 2: Scaffold / Cloze mode
  // Keep function headers, comments, and opening brackets visible.
  // Mask inner algorithmic logic lines.
  const mask = new Array(flatChars.length).fill(false);

  lines.forEach((line, lineIdx) => {
    // Don't mask the very first line (function signature / class) or final closing brace line
    if (lineIdx === 0 || lineIdx === lines.length - 1) {
      return;
    }

    const lineRaw = line.chars.map((c) => c.char).join('');
    const trimmed = lineRaw.trim();

    // Preserve comments, decorators, and single braces
    if (
      trimmed.startsWith('//') ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith('*') ||
      trimmed === '{' ||
      trimmed === '}' ||
      trimmed === '};' ||
      trimmed.startsWith('@')
    ) {
      return;
    }

    // Mask non-whitespace characters on inner logic lines
    line.chars.forEach((c) => {
      if (!c.isWhitespace && !c.isNewline) {
        mask[c.globalIndex] = true;
      }
    });
  });

  return mask;
}
