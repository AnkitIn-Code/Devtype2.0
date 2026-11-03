import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  ClipboardList,
  ShieldAlert,
  ShieldX,
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  UserX,
  Send,
  UserCheck,
  Trash2,
} from 'lucide-react';
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

  const fetchReports = useCallback(
    () => adminService.getReports({ page, size: 10, status, category }),
    [page, status, category]
  );
  const query = useAdminQuery(fetchReports, refreshKey);

  return (
    <>
      <Panel
        title="Support & Moderation Desk"
        subtitle="Review user support inquiries, automated anti-cheat incident flags, and enforce suspensions or account deactivations."
        action={
          <span className="adm-count">
            {query.data
              ? `${formatNumber(query.data.totalElements)} ${query.data.totalElements === 1 ? 'ticket / report' : 'tickets / reports'}`
              : 'Tickets'}
          </span>
        }
      >
        <div className="adm-toolbar adm-toolbar--split">
          <div className="adm-filter-tabs" aria-label="Filter reports by status">
            {['', ...STATUSES].map((option) => (
              <button
                key={option}
                className={status === option ? 'is-active' : ''}
                aria-pressed={status === option}
                onClick={() => {
                  setParams(option ? { status: option } : {});
                  setPage(0);
                }}
              >
                {option ? readable(option) : 'All tickets'}
              </button>
            ))}
          </div>
          <form
            className="adm-inline-form"
            onSubmit={(event) => {
              event.preventDefault();
              setCategory(categoryInput.trim());
              setPage(0);
            }}
          >
            <input
              aria-label="Ticket category"
              placeholder="Category filter..."
              value={categoryInput}
              onChange={(event) => setCategoryInput(event.target.value)}
              maxLength={100}
            />
            <button className="adm-button" type="submit">
              Filter
            </button>
            {category && (
              <button
                className="adm-text-link"
                type="button"
                onClick={() => {
                  setCategory('');
                  setCategoryInput('');
                  setPage(0);
                }}
              >
                Clear
              </button>
            )}
          </form>
        </div>

        <QueryState query={query} label="moderation reports">
          {query.data?.content?.length ? (
            <div className="adm-table-scroll">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th scope="col">Ticket / Case</th>
                    <th scope="col">Type & Flag</th>
                    <th scope="col">Target Account</th>
                    <th scope="col">Submitted by</th>
                    <th scope="col">Status</th>
                    <th scope="col">Date</th>
                    <th scope="col">
                      <span className="adm-sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.content.map((report) => (
                    <tr
                      key={report.id}
                      style={{
                        background: report.isSystemFlagged ? 'rgba(239, 68, 68, 0.05)' : undefined,
                      }}
                    >
                      <td>
                        <div className="adm-table-title">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong>#{report.id}</strong>
                            <span style={{ fontWeight: 600 }}>{report.title || readable(report.category)}</span>
                          </div>
                          <span className="adm-truncate" title={report.description}>
                            {report.description}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--t2)' }}>
                            {readable(report.category)}
                          </span>
                          {report.isSystemFlagged && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                background: 'rgba(239, 68, 68, 0.2)',
                                color: '#EF4444',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                width: 'fit-content',
                              }}
                            >
                              <ShieldAlert size={11} />
                              ANTI-CHEAT FLAGGED
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {report.reportedUser ? (
                          <span style={{ fontWeight: 600, color: '#EF4444' }}>
                            @{report.reportedUser.username}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--t3)' }}>Platform</span>
                        )}
                      </td>
                      <td>{report.reporter?.username || 'System'}</td>
                      <td>
                        <Badge value={report.status} />
                      </td>
                      <td>{formatDate(report.createdAt)}</td>
                      <td>
                        <button
                          className="adm-button adm-button--small"
                          aria-label={`Review report ${report.id}`}
                          onClick={() => setSelectedId(report.id)}
                        >
                          Review & Respond <ArrowRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={ClipboardList}
              title="No tickets or reports in this view"
              description="New user tickets and automated anti-cheat incidents will appear here."
            />
          )}
          <Pagination
            page={query.data?.number || 0}
            totalPages={query.data?.totalPages}
            totalElements={query.data?.totalElements || 0}
            size={10}
            onPage={setPage}
          />
        </QueryState>
      </Panel>

      {selectedId != null && (
        <ReportDialog
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onSaved={() => {
            setSelectedId(null);
            query.reload();
            onChange();
          }}
        />
      )}
    </>
  );
}

function ReportDialog({ id, onClose, onSaved }) {
  const fetchReport = useCallback(() => adminService.getReport(id), [id]);
  const query = useAdminQuery(fetchReport);
  const [busy, setBusy] = useState(false);

  return (
    <Dialog
      title={`Ticket Review & Moderation #${id}`}
      subtitle="Inspect ticket telemetry, send an official response message to the user, and take disciplinary actions."
      busy={busy}
      onClose={onClose}
      wide
    >
      <QueryState query={query} label="report details">
        {query.data && (
          <ReportDetails
            report={query.data}
            busy={busy}
            setBusy={setBusy}
            onSaved={onSaved}
          />
        )}
      </QueryState>
    </Dialog>
  );
}

function ReportDetails({ report, busy, setBusy, onSaved }) {
  const { showSuccess, showError } = useNotification();
  const [status, setStatus] = useState(report.status);
  const [note, setNote] = useState(report.resolutionNote || '');
  const [adminResponse, setAdminResponse] = useState(report.adminResponse || '');
  const [error, setError] = useState('');

  // Punitive actions state
  const [suspensionDays, setSuspensionDays] = useState(7);
  const [suspensionReason, setSuspensionReason] = useState('Anti-cheat violation: illegal keystroke automation or code pasting detected.');
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [punitiveBusy, setPunitiveBusy] = useState(false);

  const targetAccount = report.reportedUser || (report.isSystemFlagged ? report.reporter : null);

  const submitReview = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await adminService.reviewReport(report.id, {
        status,
        resolutionNote: note.trim() || 'Reviewed by administrator',
        adminResponse: adminResponse.trim(),
      });

      await adminService.recordAuditLog({
        actionType: 'REPORT_STATUS_CHANGE',
        targetType: 'REPORT',
        targetId: report.id,
        previousState: report.status,
        newState: status,
        reason: `Admin responded to ticket #${report.id}. Status: ${status}. Response: ${adminResponse.trim() || 'None'}`,
      });

      showSuccess(`Ticket #${report.id} updated. Official response sent to user.`);
      onSaved();
    } catch (failure) {
      setError(failure.message || 'The review could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete ticket #${report.id}? This action cannot be undone.`)) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      await adminService.deleteReport(report.id);
      showSuccess(`Ticket #${report.id} deleted successfully.`);
      onSaved();
    } catch (failure) {
      setError(failure.message || 'Could not delete ticket.');
    } finally {
      setBusy(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!targetAccount) return;
    setPunitiveBusy(true);
    try {
      await adminService.updateUserStatus(targetAccount.id, {
        status: 'SUSPENDED',
        suspensionDays: parseInt(suspensionDays, 10),
        reason: suspensionReason.trim() || 'Disciplinary suspension for fair play violations.',
      });

      showSuccess(`User @${targetAccount.username} has been suspended for ${suspensionDays} days. Login attempts will display the active countdown.`);
      setShowSuspendModal(false);
      onSaved();
    } catch (err) {
      showError(err.message || 'Failed to suspend user account.');
    } finally {
      setPunitiveBusy(false);
    }
  };

  const handleDeactivateUser = async () => {
    if (!targetAccount) return;
    setPunitiveBusy(true);
    try {
      await adminService.updateUserStatus(targetAccount.id, {
        status: 'DEACTIVATED',
        reason: 'Account deactivated by administrator following critical fair play violations. Queued for 30-day retention and deletion.',
      });

      showSuccess(`User @${targetAccount.username} deactivated and moved to deletion queue (30-day retention).`);
      setShowDeactivateModal(false);
      onSaved();
    } catch (err) {
      showError(err.message || 'Failed to deactivate user account.');
    } finally {
      setPunitiveBusy(false);
    }
  };

  return (
    <div className="adm-dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Heading Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge value={report.status} />
          <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--t1)' }}>
            {report.title || readable(report.category)}
          </span>
        </div>
        {report.isSystemFlagged && (
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#EF4444',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ShieldAlert size={14} />
            AUTOMATED ANTI-CHEAT DETECTION
          </span>
        )}
      </div>

      {/* Detail Attributes */}
      <DetailList
        items={[
          ['Category', readable(report.category)],
          ['Priority', report.priority || 'NORMAL'],
          ['Submitted by', report.reporter ? `${report.reporter.username} (${report.reporter.email || 'No email'})` : 'System Daemon'],
          ['Reported account', targetAccount ? `@${targetAccount.username} (ID: ${targetAccount.id})` : 'Platform General'],
          ['Submitted At', formatDate(report.createdAt, true)],
          ['Last reviewed by', report.reviewedByUser?.username || 'Not reviewed yet'],
          ['Last reviewed date', report.reviewedAt ? formatDate(report.reviewedAt, true) : 'Pending'],
        ]}
      />

      {/* Description / Telemetry box */}
      <div
        className="adm-report-content"
        style={{
          padding: '16px',
          borderRadius: '10px',
          background: 'var(--bg-card-sub, rgba(255,255,255,0.03))',
          border: '1px solid var(--glass-border-sub, rgba(255,255,255,0.08))',
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--t1)' }}>
          Ticket Description & Telemetry
        </h3>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--t2)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
          {report.description}
        </p>
      </div>

      {/* Punitive Action Bar (For Anti-Cheat or Reported Users) */}
      {targetAccount && (
        <div
          style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444', fontWeight: 600, fontSize: '0.92rem' }}>
                <AlertTriangle size={16} />
                <span>Administrative Actions on @{targetAccount.username}</span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--t3)' }}>
                Enforce temporary suspension with daily countdown timer or permanently deactivate account to deletion pipeline.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="adm-button"
                onClick={() => setShowSuspendModal(true)}
                style={{
                  background: 'rgba(245, 158, 11, 0.2)',
                  borderColor: '#F59E0B',
                  color: '#F59E0B',
                }}
              >
                <Clock size={14} /> Suspend Account
              </button>
              <button
                type="button"
                className="adm-button"
                onClick={() => setShowDeactivateModal(true)}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  borderColor: '#EF4444',
                  color: '#EF4444',
                }}
              >
                <UserX size={14} /> Deactivate Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal / In-dialog form */}
      {showSuspendModal && (
        <div
          style={{
            padding: '16px',
            borderRadius: '10px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid #F59E0B',
          }}
        >
          <h4 style={{ margin: '0 0 8px 0', color: '#F59E0B' }}>
            Suspend User @{targetAccount?.username}
          </h4>
          <p style={{ fontSize: '0.84rem', color: 'var(--t2)', margin: '0 0 12px 0' }}>
            The user will be blocked on login and shown an error message with the exact suspension days remaining.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--t3)', marginBottom: '4px' }}>
                Suspension Days
              </label>
              <select
                className="support-select"
                value={suspensionDays}
                onChange={(e) => setSuspensionDays(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px' }}
              >
                <option value={1}>1 Day</option>
                <option value={3}>3 Days</option>
                <option value={7}>7 Days (1 Week)</option>
                <option value={14}>14 Days (2 Weeks)</option>
                <option value={30}>30 Days (1 Month)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--t3)', marginBottom: '4px' }}>
                Reason (Displayed to user upon login attempt)
              </label>
              <input
                type="text"
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="Reason for suspension..."
                style={{ width: '100%', padding: '8px', borderRadius: '6px' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              className="adm-button"
              onClick={() => setShowSuspendModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="adm-button adm-button--primary"
              disabled={punitiveBusy}
              onClick={handleSuspendUser}
              style={{ background: '#F59E0B', borderColor: '#F59E0B' }}
            >
              {punitiveBusy ? 'Applying...' : `Confirm ${suspensionDays}-Day Suspension`}
            </button>
          </div>
        </div>
      )}

      {/* Deactivate Modal / In-dialog form */}
      {showDeactivateModal && (
        <div
          style={{
            padding: '16px',
            borderRadius: '10px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid #EF4444',
          }}
        >
          <h4 style={{ margin: '0 0 8px 0', color: '#EF4444' }}>
            Deactivate User @{targetAccount?.username}
          </h4>
          <p style={{ fontSize: '0.84rem', color: 'var(--t2)', margin: '0 0 12px 0' }}>
            Account will be locked immediately and queued in the 30-day retention database for permanent data erasure.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              className="adm-button"
              onClick={() => setShowDeactivateModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="adm-button adm-button--primary"
              disabled={punitiveBusy}
              onClick={handleDeactivateUser}
              style={{ background: '#EF4444', borderColor: '#EF4444' }}
            >
              {punitiveBusy ? 'Deactivating...' : 'Confirm Account Deactivation'}
            </button>
          </div>
        </div>
      )}

      {/* Main Review & User Response Form */}
      <form className="adm-access-form" onSubmit={submitReview}>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', color: 'var(--t1)' }}>
          Record Admin Decision & Message User
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '0.84rem', color: 'var(--t3)' }}>
          Your message will appear directly on the user’s Support Desk page for this ticket.
        </p>

        <fieldset disabled={busy} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
              Ticket Status
            </label>
            <select
              className="support-select"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px' }}
            >
              {STATUSES.map((option) => (
                <option key={option} value={option}>
                  {readable(option)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
              Message to User (Visible on their Support Desk)
            </label>
            <textarea
              value={adminResponse}
              onChange={(event) => setAdminResponse(event.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Explain the resolution, steps taken, or reply to the user’s questions..."
              style={{ width: '100%', padding: '10px', borderRadius: '8px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
              Internal Moderation Note (Recorded in Admin Audit Log)
            </label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Internal summary for admin team..."
              style={{ width: '100%', padding: '8px', borderRadius: '8px' }}
            />
          </div>
        </fieldset>

        {error && (
          <p className="adm-inline-error" role="alert" style={{ marginTop: '12px' }}>
            {error}
          </p>
        )}

        <div className="adm-form-actions" style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="adm-button"
            disabled={busy}
            onClick={handleDeleteReport}
            style={{
              color: '#EF4444',
              borderColor: 'rgba(239, 68, 68, 0.4)',
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Trash2 size={14} />
            Delete Ticket
          </button>
          <button
            className="adm-button adm-button--primary"
            disabled={busy}
            type="submit"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Send size={14} />
            {busy ? 'Saving & Sending…' : 'Save & Send Response'}
          </button>
        </div>
      </form>
    </div>
  );
}
