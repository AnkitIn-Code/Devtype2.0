// src/components/templates/CodeSnippetPreview.jsx
import { useMemo } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-c.js';
import 'prismjs/components/prism-cpp.js';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-java.js';
import 'prismjs/components/prism-rust.js';
import 'prismjs/components/prism-go.js';
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-sql.js';

function normalizeLang(lang) {
  if (!lang) return 'javascript';
  const map = {
    'c++': 'cpp',
    cpp: 'cpp',
    python: 'python',
    py: 'python',
    javascript: 'javascript',
    js: 'javascript',
    typescript: 'typescript',
    ts: 'typescript',
    java: 'java',
    rust: 'rust',
    rs: 'rust',
    go: 'go',
    golang: 'go',
    sql: 'sql',
  };
  return map[lang.toLowerCase()] || 'javascript';
}

export default function CodeSnippetPreview({
  code = '',
  language = 'javascript',
  maxLines = null,
  showLineNumbers = true,
  className = '',
}) {
  const lines = useMemo(() => {
    const cleanCode = code.replace(/\r\n/g, '\n').trimEnd();
    const prismKey = normalizeLang(language);
    const grammar = Prism.languages[prismKey] || Prism.languages.javascript;
    const rawLines = cleanCode.split('\n');
    const displayLines = maxLines ? rawLines.slice(0, maxLines) : rawLines;

    return displayLines.map((lineStr, idx) => {
      const highlightedHtml = Prism.highlight(lineStr || ' ', grammar, prismKey);
      return {
        lineNum: idx + 1,
        html: highlightedHtml,
      };
    });
  }, [code, language, maxLines]);

  return (
    <div className={`code-snippet-preview ${className}`}>
      <div className="csp-lines">
        {lines.map((line) => (
          <div key={line.lineNum} className="csp-line-row">
            {showLineNumbers && (
              <span className="csp-ln" aria-hidden="true">
                {line.lineNum}
              </span>
            )}
            <span
              className="csp-code"
              dangerouslySetInnerHTML={{ __html: line.html }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
