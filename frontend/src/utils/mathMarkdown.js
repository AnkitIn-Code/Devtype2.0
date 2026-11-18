// src/utils/mathMarkdown.js
import katex from 'katex';
import { marked } from 'marked';
import Prism from 'prismjs';
import 'prismjs/components/prism-c.js';
import 'prismjs/components/prism-cpp.js';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-java.js';
import 'prismjs/components/prism-rust.js';
import 'prismjs/components/prism-go.js';
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-sql.js';
import 'prismjs/components/prism-bash.js';
import 'prismjs/components/prism-json.js';
import { normalizeLang } from './codeTokenizer';

function detectLang(lang, code) {
  if (lang) {
    const l = lang.toLowerCase();
    if (l === 'cpp' || l === 'c++') return 'cpp';
    if (l === 'java') return 'java';
    if (l === 'python' || l === 'py') return 'python';
    if (l === 'javascript' || l === 'js') return 'javascript';
    if (l === 'typescript' || l === 'ts') return 'typescript';
    if (l === 'sql') return 'sql';
    if (l === 'bash' || l === 'sh') return 'bash';
    if (l === 'json') return 'json';
    return l;
  }
  if (code.includes('#include') || code.includes('std::')) return 'cpp';
  if (code.includes('public class') || code.includes('System.out')) return 'java';
  if (code.includes('def ') || code.includes('import numpy')) return 'python';
  return 'java';
}

function getEditorMeta(lang) {
  switch (lang) {
    case 'java':
      return { fileName: 'Solution.java', badge: 'JAVA 21', icon: 'coffee' };
    case 'cpp':
      return { fileName: 'solution.cpp', badge: 'C++ 20', icon: 'terminal' };
    case 'python':
      return { fileName: 'solution.py', badge: 'PYTHON 3.12', icon: 'terminal' };
    case 'sql':
      return { fileName: 'query.sql', badge: 'SQL', icon: 'database' };
    case 'bash':
      return { fileName: 'script.sh', badge: 'BASH', icon: 'terminal' };
    case 'json':
      return { fileName: 'config.json', badge: 'JSON', icon: 'data_object' };
    default:
      return { fileName: `snippet.${lang || 'txt'}`, badge: (lang || 'CODE').toUpperCase(), icon: 'code' };
  }
}

/**
 * Parses raw algorithmic theory markdown containing LaTeX math formulas ($...$ and $$...$$),
 * headings, code fences, ASCII diagrams, and Mermaid diagrams into beautifully formatted, accessible HTML.
 */
export function formatTheoryMarkdown(rawText) {
  if (!rawText) return '';

  const codeBlocks = [];
  const inlineCodes = [];
  const mermaidBlocks = [];

  // 1. Mask Mermaid diagrams ```mermaid ... ``` BEFORE general code fences or math
  let text = rawText.replace(/```\s*mermaid\s*([\s\S]*?)```/g, (_, mermaidCode) => {
    mermaidBlocks.push(mermaidCode.trim());
    return `\n\n@@@MERMAID_DIAGRAM_${mermaidBlocks.length - 1}@@@\n\n`;
  });

  // 2. Mask fenced code blocks ```(lang)? ... ```
  text = text.replace(/```([a-zA-Z0-9_#+-]*)\s*([\s\S]*?)```/g, (_, lang, code) => {
    const rawClean = code.replace(/^\n+|\n+$/g, '');
    codeBlocks.push({ lang: (lang || '').trim(), code: rawClean });
    return `\n\n@@@FENCED_CODE_${codeBlocks.length - 1}@@@\n\n`;
  });

  // 3. Mask inline code ` ... `
  text = text.replace(/`[^`\n]+?`/g, (match) => {
    inlineCodes.push(match);
    return `@@@INLINE_CODE_${inlineCodes.length - 1}@@@`;
  });

  // 4. Process display math $$ ... $$
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try {
      const rendered = katex.renderToString(math.trim(), {
        displayMode: true,
        throwOnError: false,
      });
      return `\n\n<div class="math-display-card my-5 py-4 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 overflow-x-auto text-center shadow-inner text-primary-fixed-dim">${rendered}</div>\n\n`;
    } catch {
      return `\n\n<pre class="math-fallback font-mono p-3 bg-surface-container-lowest text-primary">${math}</pre>\n\n`;
    }
  });

  // 5. Process inline math $ ... $
  text = text.replace(/(?<!\\)\$([^\$\n]+?)\$/g, (_, math) => {
    try {
      const rendered = katex.renderToString(math.trim(), {
        displayMode: false,
        throwOnError: false,
      });
      return `<span class="math-inline-card text-primary font-mono text-[13px] px-1 py-0.5 rounded bg-surface-container-high/40 inline-block align-middle mx-0.5">${rendered}</span>`;
    } catch {
      return `<code>${math}</code>`;
    }
  });

  // 6. Unmask inline code
  text = text.replace(/@@@INLINE_CODE_(\d+)@@@/g, (_, idx) => inlineCodes[Number(idx)]);

  // 7. Parse markdown with marked (fenced code blocks and mermaid diagrams are safely masked)
  let parsedHtml = marked.parse(text, {
    gfm: true,
    breaks: true,
  });

  // 8. Wrap tables in a responsive horizontal scroll container
  parsedHtml = parsedHtml.replace(/<table>([\s\S]*?)<\/table>/g, '<div class="table-container overflow-x-auto my-4 max-w-full"><table>$1</table></div>');

  // 9. Unmask Mermaid diagram blocks into styled visual cards with data attributes
  parsedHtml = parsedHtml.replace(/(?:<p>)?\s*@@@MERMAID_DIAGRAM_(\d+)@@@\s*(?:<\/p>)?/g, (_, idx) => {
    const rawCode = mermaidBlocks[Number(idx)] || '';
    const encoded = encodeURIComponent(rawCode);
    return `
<div class="mermaid-diagram-card max-w-3xl mx-auto my-6 rounded-xl bg-surface-container-lowest/95 border border-outline-variant/20 shadow-lg overflow-hidden transition-all duration-200">
  <div class="flex items-center justify-between px-3.5 py-2 bg-surface-container/60 border-b border-outline-variant/15 text-xs font-mono">
    <div class="flex items-center gap-2">
      <span class="material-symbols-outlined text-primary text-[15px]">account_tree</span>
      <span class="font-bold text-on-surface tracking-wider uppercase text-[10px]">Architecture Diagram</span>
    </div>
    <div class="flex items-center gap-2">
      <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 tracking-wider font-semibold uppercase">Interactive SVG</span>
    </div>
  </div>
  <div class="p-3 sm:p-4 overflow-x-auto flex justify-center items-center min-h-[90px] bg-gradient-to-b from-transparent to-surface-container-lowest/40">
    <div class="devtype-mermaid-target w-full flex justify-center text-center font-mono" data-mermaid-code="${encoded}">
      <div class="flex items-center justify-center gap-2 text-on-surface-variant font-mono text-xs py-4">
        <span class="material-symbols-outlined text-primary text-[15px] animate-spin">progress_activity</span>
        <span>Rendering visual diagram...</span>
      </div>
    </div>
  </div>
</div>`;
  });

  // 10. Unmask fenced code blocks into authentic VS Code editor theme cards
  parsedHtml = parsedHtml.replace(/(?:<p>)?\s*@@@FENCED_CODE_(\d+)@@@\s*(?:<\/p>)?/g, (_, idx) => {
    const item = codeBlocks[Number(idx)];
    if (!item) return '';

    const rawCode = item.code;
    const detected = detectLang(item.lang, rawCode);
    const normLang = normalizeLang(detected);
    const meta = getEditorMeta(detected);
    const grammar = Prism.languages[normLang] || Prism.languages.java || Prism.languages.javascript;

    let highlighted = '';
    try {
      highlighted = Prism.highlight(rawCode, grammar, normLang);
    } catch {
      highlighted = rawCode.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    const lines = highlighted.split('\n');
    const linesHtml = lines.map((lineContent, lineIdx) => (
      `<div class="vscode-line" style="display: flex; align-items: center; min-height: 1.55rem; line-height: 1.55rem; padding: 0 4px; border-radius: 2px;"><span class="vscode-line-num" style="text-align: right; padding-right: 1.25rem; color: #6e7681; user-select: none; font-size: 11.5px; min-width: 2.75rem; flex-shrink: 0; font-family: inherit;">${lineIdx + 1}</span><span class="vscode-line-text" style="flex: 1; white-space: pre; font-size: 12.5px; color: #d4d4d4; font-family: inherit;">${lineContent || '&nbsp;'}</span></div>`
    )).join('');

    const encoded = encodeURIComponent(rawCode);

    const copySvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    const termSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`;

    return `
<div class="vscode-code-card" style="margin: 20px 0; border-radius: 12px; overflow: hidden; background: #1e1e1e !important; border: 1px solid rgba(255, 255, 255, 0.12) !important; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45); font-family: 'JetBrains Mono', Consolas, monospace;">
  <div class="vscode-header" style="display: flex !important; align-items: center !important; justify-content: space-between !important; padding: 8px 14px; background: #252526 !important; border-bottom: 1px solid #333333 !important; user-select: none; box-sizing: border-box; min-height: 38px;">
    <div class="vscode-header-left" style="display: flex !important; align-items: center !important; gap: 12px;">
      <div class="vscode-traffic-lights" style="display: flex !important; align-items: center !important; gap: 6px;">
        <span style="width: 10px; height: 10px; border-radius: 50%; background: #ff5f56; display: inline-block; opacity: 0.85;"></span>
        <span style="width: 10px; height: 10px; border-radius: 50%; background: #ffbd2e; display: inline-block; opacity: 0.85;"></span>
        <span style="width: 10px; height: 10px; border-radius: 50%; background: #27c93f; display: inline-block; opacity: 0.85;"></span>
      </div>
      <div class="vscode-tab" style="display: flex !important; align-items: center !important; gap: 6px; padding: 4px 10px; border-radius: 4px; background: #1e1e1e !important; border-top: 2px solid #007acc; color: #cccccc !important; font-size: 11.5px; font-weight: 600;">
        ${termSvg}
        <span>${meta.fileName}</span>
      </div>
    </div>
    <div class="vscode-header-right" style="display: flex !important; align-items: center !important; gap: 8px; margin-left: auto; flex-shrink: 0;">
      <span class="vscode-lang-badge" style="font-size: 10px !important; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 8px; border-radius: 4px; background: #333333 !important; color: #a0a0a0 !important; font-weight: 700; line-height: 1; display: inline-flex !important; align-items: center !important; white-space: nowrap;">${meta.badge}</span>
      <button type="button" class="vscode-copy-btn" data-code="${encoded}" title="Copy code snippet" style="display: inline-flex !important; align-items: center !important; gap: 5px; padding: 3px 10px; border-radius: 5px; background: #2d2d2d !important; border: 1px solid #404040 !important; color: #9cdcfe !important; font-family: 'JetBrains Mono', monospace; font-size: 11px; cursor: pointer; line-height: 1.4; white-space: nowrap;">
        ${copySvg}
        <span class="copy-text">Copy</span>
      </button>
    </div>
  </div>
  <div class="vscode-editor" style="padding: 14px 16px; overflow-x: auto; background: #1e1e1e !important; background-color: #1e1e1e !important;">
    <pre class="vscode-code-body" style="margin: 0 !important; padding: 0 !important; background: transparent !important; background-color: transparent !important; border: none !important; box-shadow: none !important; border-radius: 0 !important; font-family: 'JetBrains Mono', monospace; font-size: 12.5px; line-height: 1.65; overflow: visible !important;"><code style="background: transparent !important; background-color: transparent !important; border: none !important; padding: 0 !important; font-family: inherit;">${linesHtml}</code></pre>
  </div>
</div>`;
  });

  return parsedHtml;
}
