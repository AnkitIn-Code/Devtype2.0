import { useEffect, useId, useRef } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Inbox, LoaderCircle, X } from 'lucide-react';
import { readable } from './adminFormat';

export function Badge({ value, children }) {
  const tones = { ACTIVE: 'green', UP: 'green', RESOLVED: 'green', ADMIN: 'blue', OPEN: 'amber', UNDER_REVIEW: 'blue', SUSPENDED: 'red', DOWN: 'red', DEGRADED: 'amber', DEACTIVATED: 'gray', DISMISSED: 'gray', DEMO: 'amber' };
  return <span className={`adm-badge adm-badge--${tones[value] || 'gray'}`}><span aria-hidden="true" />{children || readable(value)}</span>;
}

export function Panel({ title, subtitle, action, children, className = '' }) {
  return <section className={`adm-panel ${className}`}>
    {(title || action) && <div className="adm-panel-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>}
    {children}
  </section>;
}

export function EmptyState({ title = 'Nothing here yet', description, icon: Icon = Inbox }) {
  return <div className="adm-empty"><Icon size={25} aria-hidden="true" /><h3>{title}</h3><p>{description}</p></div>;
}

export function QueryState({ query, label = 'data', children }) {
  if (query.loading) return <div className="adm-loading" role="status"><LoaderCircle size={20} className="adm-spin" />Loading {label}…</div>;
  if (query.error) return <div className="adm-query-error" role="alert"><AlertCircle size={21} /><div><strong>Couldn’t load {label}</strong><p>{query.error.message || 'The server could not complete this request.'}</p></div><button className="adm-button" onClick={query.reload}>Try again</button></div>;
  return children;
}

export function Pagination({ page, totalPages, totalElements, size, onPage, busy = false }) {
  return <div className="adm-pagination"><span>{totalElements ? `${formatRange(page, size, totalElements)} of ${totalElements.toLocaleString()} results` : '0 results'}</span><div>
    <button className="adm-icon-button" aria-label="Previous page" disabled={busy || page === 0} onClick={() => onPage(page - 1)}><ChevronLeft size={17} /></button>
    <span>Page {totalPages ? page + 1 : 0} of {totalPages || 0}</span>
    <button className="adm-icon-button" aria-label="Next page" disabled={busy || page + 1 >= totalPages} onClick={() => onPage(page + 1)}><ChevronRight size={17} /></button>
  </div></div>;
}

function formatRange(page, size, total) { return `${page * size + 1}–${Math.min((page + 1) * size, total)}`; }

export function Metric({ label, value, description, icon: Icon, tone = 'blue' }) {
  return <article className="adm-metric"><div className="adm-metric-top"><span>{label}</span><span className={`adm-metric-icon adm-tone-${tone}`}><Icon size={18} /></span></div><strong>{value}</strong><p>{description}</p></article>;
}

export function Dialog({ title, subtitle, children, onClose, busy = false, wide = false }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return <dialog ref={ref} className={`adm-dialog ${wide ? 'adm-dialog--wide' : ''}`} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    onClick={event => { if (event.target === ref.current && !busy) onClose(); }}>
    <div className="adm-dialog-inner"><header className="adm-dialog-header"><div><p className="adm-eyebrow">DEVTYPE ADMINISTRATION</p><h2 id={titleId}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="adm-icon-button" aria-label="Close dialog" disabled={busy} onClick={onClose}><X size={20} /></button></header>{children}</div>
  </dialog>;
}

export function DetailList({ items }) {
  return <dl className="adm-details">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? '—'}</dd></div>)}</dl>;
}
