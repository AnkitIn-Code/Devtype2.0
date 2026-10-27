import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, ClipboardList } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import useAdminQuery from './useAdminQuery';
import { Badge, DetailList, Dialog, EmptyState, Pagination, Panel, QueryState } from './AdminPrimitives';
import { formatDate, formatNumber, readable } from './adminFormat';

const STATUSES = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'];

export default function AdminReports({ refreshKey, onChange }) {
  const [params, setParams] = useSearchParams();
  const status = STATUSES.includes(params.get('status')) ? params.get('status') : '';
  const [page, setPage] = useState(0);
  const [categoryInput, setCategoryInput] = useState('');
  const [category, setCategory] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const fetchReports = useCallback(() => adminService.getReports({ page, size: 10, status, category }), [page, status, category]);
  const query = useAdminQuery(fetchReports, refreshKey);
  return <>
    <Panel title="Moderation queue" subtitle="Review reported behavior and keep a record of every decision." action={<span className="adm-count">{query.data ? `${formatNumber(query.data.totalElements)} ${query.data.totalElements === 1 ? 'report' : 'reports'}` : 'Reports'}</span>}>
      <div className="adm-toolbar adm-toolbar--split">
        <div className="adm-filter-tabs" aria-label="Filter reports by status">{['', ...STATUSES].map(option => <button key={option} className={status === option ? 'is-active' : ''} aria-pressed={status === option} onClick={() => { setParams(option ? { status: option } : {}); setPage(0); }}>{option ? readable(option) : 'All reports'}</button>)}</div>
        <form className="adm-inline-form" onSubmit={event => { event.preventDefault(); setCategory(categoryInput.trim()); setPage(0); }}><input aria-label="Report category" placeholder="Category (exact match)" value={categoryInput} onChange={event => setCategoryInput(event.target.value)} maxLength={100} /><button className="adm-button" type="submit">Filter</button>{category && <button className="adm-text-link" type="button" onClick={() => { setCategory(''); setCategoryInput(''); setPage(0); }}>Clear</button>}</form>
      </div>
      <QueryState query={query} label="moderation reports">
        {query.data?.content?.length ? <div className="adm-table-scroll"><table className="adm-table"><thead><tr><th scope="col">Report</th><th scope="col">Reported account</th><th scope="col">Submitted by</th><th scope="col">Status</th><th scope="col">Submitted</th><th scope="col"><span className="adm-sr-only">Actions</span></th></tr></thead><tbody>{query.data.content.map(report => <tr key={report.id}>
          <td><div className="adm-table-title"><strong>#{report.id} · {readable(report.category)}</strong><span className="adm-truncate" title={report.description}>{report.description}</span></div></td><td>{report.reportedUser?.username || 'Platform report'}</td><td>{report.reporter?.username || 'Unavailable'}</td><td><Badge value={report.status} /></td><td>{formatDate(report.createdAt)}</td><td><button className="adm-button adm-button--small" aria-label={`Review report ${report.id}`} onClick={() => setSelectedId(report.id)}>Review <ArrowRight size={14} /></button></td>
        </tr>)}</tbody></table></div> : <EmptyState icon={ClipboardList} title="No reports in this view" description="New reports will appear here. Try another status or category to see earlier cases." />}
        <Pagination page={query.data?.number || 0} totalPages={query.data?.totalPages} totalElements={query.data?.totalElements || 0} size={10} onPage={setPage} />
      </QueryState>
    </Panel>
    {selectedId != null && <ReportDialog id={selectedId} onClose={() => setSelectedId(null)} onSaved={() => { setSelectedId(null); query.reload(); onChange(); }} />}
  </>;
}

function ReportDialog({ id, onClose, onSaved }) {
  const fetchReport = useCallback(() => adminService.getReport(id), [id]);
  const query = useAdminQuery(fetchReport);
  const [busy, setBusy] = useState(false);
  return <Dialog title={`Review report #${id}`} subtitle="Read the report before recording a decision." busy={busy} onClose={onClose} wide>
    <QueryState query={query} label="report details">{query.data && <ReportDetails report={query.data} busy={busy} setBusy={setBusy} onSaved={onSaved} />}</QueryState>
  </Dialog>;
}

function ReportDetails({ report, busy, setBusy, onSaved }) {
  const { showSuccess } = useNotification();
  const [status, setStatus] = useState(report.status);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const valid = status !== report.status && note.trim().length >= 3;
  const submit = async event => {
    event.preventDefault();
    if (!valid || busy) return;
    setBusy(true); setError('');
    try { await adminService.reviewReport(report.id, { status, resolutionNote: note.trim() }); showSuccess(`Report #${report.id} updated to ${readable(status).toLowerCase()}.`); onSaved(); }
    catch (failure) { setError(failure.message || 'The decision could not be saved.'); }
    finally { setBusy(false); }
  };
  return <div className="adm-dialog-body">
    <div className="adm-report-heading"><Badge value={report.status} /><span>{readable(report.category)}</span></div>
    <DetailList items={[
      ['Reported account', report.reportedUser?.username || 'Platform report'], ['Submitted by', report.reporter?.username || 'Unavailable'],
      ['Submitted', formatDate(report.createdAt, true)], ['Last reviewed by', report.reviewedByUser?.username || 'Not reviewed'],
      ['Last reviewed', formatDate(report.reviewedAt, true)],
    ]} />
    <div className="adm-report-content"><h3>Report description</h3><p>{report.description}</p></div>
    {report.resolutionNote && <div className="adm-report-content"><h3>Previous review note</h3><p>{report.resolutionNote}</p></div>}
    <form className="adm-access-form" onSubmit={submit}><h3>Record your decision</h3><p>Changing a report’s status does not change the reported user’s account access.</p>
      <fieldset disabled={busy}><label>New status<select value={status} onChange={event => setStatus(event.target.value)}>{STATUSES.map(option => <option key={option} value={option}>{readable(option)}</option>)}</select></label><label>Review note<textarea value={note} onChange={event => setNote(event.target.value)} required minLength={3} maxLength={1000} rows={4} placeholder="Summarize your review and explain this decision…" /></label><span className="adm-field-hint">3–1,000 characters. Your decision is recorded in the audit log.</span></fieldset>
      {error && <p className="adm-inline-error" role="alert">{error}</p>}
      <div className="adm-form-actions"><button className="adm-button adm-button--primary" disabled={!valid || busy}>{busy ? 'Saving decision…' : 'Save decision'}</button></div>
    </form>
  </div>;
}
