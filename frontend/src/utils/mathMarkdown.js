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
      `<div class="vscode-line flex hover:bg-white/[0.04] transition-colors"><span class="vscode-line-num select-none">${lineIdx + 1}</span><span class="vscode-line-text">${lineContent || '&nbsp;'}</span></div>`
    )).join('');

    const encoded = encodeURIComponent(rawCode);

    return `
<div class="vscode-code-card my-6 rounded-xl overflow-hidden border border-outline-variant/20 shadow-xl bg-[#1e1e1e] transition-all">
  <div class="vscode-header flex items-center justify-between px-3.5 py-2 bg-[#252526] border-b border-[#333333] select-none text-xs font-mono">
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-1.5">
        <span class="w-2.5 h-2.5 rounded-full bg-[#ff5f56] inline-block opacity-85"></span>
        <span class="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] inline-block opacity-85"></span>
        <span class="w-2.5 h-2.5 rounded-full bg-[#27c93f] inline-block opacity-85"></span>
      </div>
      <div class="vscode-tab flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#1e1e1e] border-t-2 border-t-[#007acc] text-[#cccccc] text-[11px] font-semibold">
        <span class="material-symbols-outlined text-[13px] text-primary">${meta.icon}</span>
        <span>${meta.fileName}</span>
      </div>
    </div>
    <div class="flex items-center gap-2.5">
      <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#333333] text-[#858585] font-semibold">${meta.badge}</span>
      <button class="vscode-copy-btn flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#2d2d2d] hover:bg-[#383838] text-[#9cdcfe] hover:text-white text-[11px] font-mono transition cursor-pointer" data-code="${encoded}" title="Copy code snippet">
        <span class="material-symbols-outlined text-[13px]">content_copy</span>
        <span class="copy-text">Copy</span>
      </button>
    </div>
  </div>
  <div class="vscode-editor p-3.5 sm:p-4 overflow-x-auto text-xs font-mono leading-relaxed">
    <pre class="vscode-code-body m-0 p-0 font-mono text-[12.5px] leading-relaxed"><code>${linesHtml}</code></pre>
  </div>
</div>`;
  });

  return parsedHtml;
}
