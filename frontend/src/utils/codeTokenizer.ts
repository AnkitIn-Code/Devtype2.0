// src/utils/codeTokenizer.ts
import Prism from 'prismjs';
import 'prismjs/components/prism-c.js';
import 'prismjs/components/prism-cpp.js';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-java.js';
import 'prismjs/components/prism-rust.js';
import 'prismjs/components/prism-go.js';
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-sql.js';

export interface CodeCharData {
  char: string;
  tokenType: string;
  globalIndex: number;
  lineIndex: number;
  colIndex: number;
  isWhitespace: boolean;
  isNewline: boolean;
}

export interface CodeLineData {
  lineNumber: number;
  chars: CodeCharData[];
  startIndex: number;
  endIndex: number;
}

export interface TokenizedSnippet {
  lines: CodeLineData[];
  totalChars: number;
  flatChars: CodeCharData[];
  rawCode: string;
}

/**
 * Normalizes language name to Prism language grammar key.
 */
function normalizeLang(lang: string): string {
  const map: Record<string, string> = {
    'c++': 'cpp',
    'cpp': 'cpp',
    'python': 'python',
    'py': 'python',
    'javascript': 'javascript',
    'js': 'javascript',
    'typescript': 'typescript',
    'ts': 'typescript',
    'java': 'java',
    'rust': 'rust',
    'rs': 'rust',
    'go': 'go',
    'golang': 'go',
    'sql': 'sql',
  };
  return map[lang.toLowerCase()] || 'javascript';
}

/**
 * Recursively extracts character tokens from Prism token hierarchy.
 */
function flattenPrismTokens(
  tokens: (string | Prism.Token)[],
  parentType = 'plain'
): { char: string; tokenType: string }[] {
  const result: { char: string; tokenType: string }[] = [];

  for (const token of tokens) {
    if (typeof token === 'string') {
      for (const ch of token) {
        result.push({ char: ch, tokenType: parentType });
      }
    } else if (token && typeof token === 'object') {
      const currentType = token.type || parentType;
      if (Array.isArray(token.content)) {
        result.push(...flattenPrismTokens(token.content, currentType));
      } else if (typeof token.content === 'string') {
        for (const ch of token.content) {
          result.push({ char: ch, tokenType: currentType });
        }
      } else if (token.content) {
        result.push(...flattenPrismTokens([token.content as any], currentType));
      }
    }
  }

  return result;
}

/**
 * Tokenizes a code snippet into structured lines and indexed characters.
 */
export function tokenizeCodeSnippet(code: string = '', language: string = 'javascript'): TokenizedSnippet {
  // Normalize line breaks to \n and trim trailing blank lines for clean layout
  const cleanCode = (code || '').replace(/\r\n/g, '\n').trimEnd();
  const prismLangKey = normalizeLang(language || 'javascript');
  const grammar = Prism.languages[prismLangKey] || Prism.languages.javascript;

  const prismTokens = Prism.tokenize(cleanCode, grammar);
  const rawFlatChars = flattenPrismTokens(prismTokens);

  const flatChars: CodeCharData[] = [];
  const lines: CodeLineData[] = [];

  let currentLineChars: CodeCharData[] = [];
  let currentLineIndex = 0;
  let currentColIndex = 0;
  let lineStartIndex = 0;

  for (let i = 0; i < rawFlatChars.length; i++) {
    const { char, tokenType } = rawFlatChars[i];
    const isNewline = char === '\n';
    const isWhitespace = char === ' ' || char === '\t';

    const charData: CodeCharData = {
      char,
      tokenType,
      globalIndex: i,
      lineIndex: currentLineIndex,
      colIndex: currentColIndex,
      isWhitespace,
      isNewline,
    };

    flatChars.push(charData);
    currentLineChars.push(charData);

    if (isNewline) {
      lines.push({
        lineNumber: currentLineIndex + 1,
        chars: currentLineChars,
        startIndex: lineStartIndex,
        endIndex: i,
      });
      currentLineIndex++;
      currentColIndex = 0;
      currentLineChars = [];
      lineStartIndex = i + 1;
    } else {
      currentColIndex++;
    }
  }

  // Push final line if there are remaining characters
  if (currentLineChars.length > 0 || lines.length === 0) {
    lines.push({
      lineNumber: currentLineIndex + 1,
      chars: currentLineChars,
      startIndex: lineStartIndex,
      endIndex: flatChars.length - 1,
    });
  }

  return {
    lines,
    totalChars: flatChars.length,
    flatChars,
    rawCode: cleanCode,
  };
}
