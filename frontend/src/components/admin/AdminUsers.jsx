import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, Search, ShieldCheck, Users } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import useAdminQuery from './useAdminQuery';
import { Badge, DetailList, Dialog, EmptyState, Pagination, Panel, QueryState } from './AdminPrimitives';
import { formatDate, formatNumber, initials, readable } from './adminFormat';

export default function AdminUsers({ refreshKey, onChange }) {
  const [params, setParams] = useSearchParams();
  const status = ['ACTIVE', 'SUSPENDED', 'DEACTIVATED'].includes(params.get('status')) ? params.get('status') : '';
  const [filters, setFilters] = useState({ search: '', role: '', accountType: '', page: 0 });
  const [searchInput, setSearchInput] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => {
    const timer = setTimeout(() => setFilters(previous => previous.search === searchInput.trim() ? previous : { ...previous, search: searchInput.trim(), page: 0 }), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);
  const fetchUsers = useCallback(() => adminService.getUsers({ ...filters, status, size: 10 }), [filters, status]);
  const query = useAdminQuery(fetchUsers, refreshKey);
  const updateFilter = (key, value) => setFilters(previous => ({ ...previous, [key]: value, page: 0 }));
  const reset = () => { setSearchInput(''); setFilters({ search: '', role: '', accountType: '', page: 0 }); setParams({}); };
  const hasFilters = searchInput || filters.role || filters.accountType || status;
  return <>
    <Panel title="User directory" subtitle="Search accounts, inspect activity, and manage platform access." action={<span className="adm-count">{query.data ? `${formatNumber(query.data.totalElements)} ${query.data.totalElements === 1 ? 'account' : 'accounts'}` : 'Accounts'}</span>}>
      <div className="adm-toolbar">
        <label className="adm-search"><Search size={17} /><input aria-label="Search users" placeholder="Search name, username, or email…" value={searchInput} onChange={event => setSearchInput(event.target.value)} /></label>
        <select aria-label="Filter users by status" value={status} onChange={event => { setParams(event.target.value ? { status: event.target.value } : {}); updateFilter('page', 0); }}><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="DEACTIVATED">Deactivated</option></select>
        <select aria-label="Filter users by role" value={filters.role} onChange={event => updateFilter('role', event.target.value)}><option value="">All roles</option><option value="USER">User</option><option value="ADMIN">Administrator</option></select>
        <select aria-label="Filter users by account type" value={filters.accountType} onChange={event => updateFilter('accountType', event.target.value)}><option value="">All account types</option><option value="STANDARD">Standard</option><option value="DEMO">Demo</option></select>
        {hasFilters && <button className="adm-text-link" onClick={reset}>Clear filters</button>}
      </div>
      <QueryState query={query} label="users">
        {query.data?.content?.length ? <div className="adm-table-scroll"><table className="adm-table"><thead><tr><th scope="col">User</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Account type</th><th scope="col">Joined</th><th scope="col">Last sign in</th><th scope="col"><span className="adm-sr-only">Actions</span></th></tr></thead><tbody>
          {query.data.content.map(account => <tr key={account.id}><td><div className="adm-person"><span className="adm-avatar">{initials(account.displayName || account.username)}</span><div><strong>{account.displayName || account.username}</strong><span>{account.email}</span></div></div></td><td><Badge value={account.role} /></td><td><Badge value={account.status} /></td><td>{readable(account.accountType)}</td><td>{formatDate(account.createdAt)}</td><td>{account.lastLoginAt ? formatDate(account.lastLoginAt) : 'Never'}</td><td><button className="adm-button adm-button--small" onClick={() => setSelectedId(account.id)} aria-label={`Manage ${account.username}`}>Manage <ArrowRight size={14} /></button></td></tr>)}
        </tbody></table></div> : <EmptyState icon={Users} title={hasFilters ? 'No matching accounts' : 'No accounts yet'} description={hasFilters ? 'Try a different search or clear the filters.' : 'Registered users will appear in this directory.'} />}
        <Pagination page={query.data?.number || 0} totalPages={query.data?.totalPages} totalElements={query.data?.totalElements || 0} size={10} onPage={page => setFilters(previous => ({ ...previous, page }))} />
      </QueryState>
    </Panel>
    <p className="adm-footnote"><ShieldCheck size={15} />Access changes require a reason and are recorded in the audit log.</p>
    {selectedId != null && <UserDialog id={selectedId} onClose={() => setSelectedId(null)} onSaved={() => { setSelectedId(null); query.reload(); onChange(); }} />}
  </>;
}

function UserDialog({ id, onClose, onSaved }) {
  const { user } = useAuth();
  const { showSuccess } = useNotification();
  const fetchUser = useCallback(() => adminService.getUserDetail(id), [id]);
  const query = useAdminQuery(fetchUser);
  const [busy, setBusy] = useState(false);
  return <Dialog title="Account details" subtitle={`User #${id}`} onClose={onClose} busy={busy} wide>
    <QueryState query={query} label="account details">{query.data && <UserDetails account={query.data} isSelf={String(user.id) === String(id)} busy={busy} setBusy={setBusy} onSaved={() => { showSuccess('Account access updated. The change has been recorded.'); onSaved(); }} />}</QueryState>
  </Dialog>;
}

function UserDetails({ account, isSelf, busy, setBusy, onSaved }) {
  const [type, setType] = useState('status');
  const [value, setValue] = useState(account.status);
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const currentValue = type === 'status' ? account.status : account.role;
  const grantingAdmin = type === 'role' && value === 'ADMIN' && currentValue !== 'ADMIN';
  const valid = !isSelf && value !== currentValue && reason.trim().length >= 3 && (!grantingAdmin || confirmed);
  const submit = async event => {
    event.preventDefault();
    if (!valid || busy) return;
    setBusy(true); setError('');
    try {
      if (type === 'status') await adminService.updateUserStatus(account.id, { status: value, reason: reason.trim() });
      else await adminService.updateUserRole(account.id, { role: value, reason: reason.trim() });
      onSaved();
    } catch (failure) { setError(failure.message || 'The change could not be saved.'); }
    finally { setBusy(false); }
  };
  return <div className="adm-dialog-body">
    <div className="adm-profile-heading"><span className="adm-avatar adm-avatar--large">{initials(account.displayName || account.username)}</span><div><h3>{account.displayName || account.username}</h3><p>@{account.username} · {account.email}</p></div><Badge value={account.status} /></div>
    <DetailList items={[
      ['Platform role', readable(account.role)], ['Account type', readable(account.accountType)], ['Joined', formatDate(account.createdAt)], ['Last sign in', account.lastLoginAt ? formatDate(account.lastLoginAt, true) : 'Never'],
      ['Completed sessions', formatNumber(account.totalCompletedSessions)], ['Practice time', `${formatNumber(account.totalPracticeDurationSeconds / 60)} min`], ['Average speed', `${formatNumber(account.avgNetWpm, 1)} WPM`], ['Average accuracy', `${formatNumber(account.avgAccuracy, 1)}%`],
      ['Challenges completed', formatNumber(account.totalChallengesCompleted)], ['Achievements unlocked', formatNumber(account.totalAchievementsUnlocked)], ['Reports filed', formatNumber(account.reportsFiledCount)], ['Reports against account', formatNumber(account.reportsAgainstCount)],
    ]} />
    <form className="adm-access-form" onSubmit={submit}>
      <h3><ShieldCheck size={18} />Manage access</h3><p>Changes take effect on the user’s next API request.</p>
      {isSelf ? <div className="adm-info">You’re viewing your own account. Ask another administrator to change your access.</div> : <>
        <fieldset disabled={busy}>
          <div className="adm-form-grid"><label>Change<select value={type} onChange={event => { setType(event.target.value); setValue(event.target.value === 'status' ? account.status : account.role); setConfirmed(false); setError(''); }}><option value="status">Account status</option><option value="role">Platform role</option></select></label>
          <label>New {type}<select value={value} onChange={event => { setValue(event.target.value); setConfirmed(false); }}>
            {(type === 'status' ? ['ACTIVE', 'SUSPENDED', 'DEACTIVATED'] : ['USER', 'ADMIN']).map(option => <option key={option} value={option}>{readable(option)}</option>)}
          </select></label></div>
          {currentValue !== value && <div className="adm-change-preview"><Badge value={currentValue} /><ArrowRight size={16} /><Badge value={value} /></div>}
          <label>Reason for change<textarea value={reason} onChange={event => setReason(event.target.value)} minLength={3} maxLength={500} required rows={3} placeholder="Explain why this account’s access needs to change…" /></label><span className="adm-field-hint">3–500 characters. This reason will be visible in the audit log.</span>
          {grantingAdmin && <label className="adm-checkbox"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} required /><span>I confirm this user should be able to manage users, reports, and platform access.</span></label>}
        </fieldset>
        {error && <p className="adm-inline-error" role="alert">{error}</p>}
        <div className="adm-form-actions"><button className="adm-button adm-button--primary" type="submit" disabled={!valid || busy}>{busy ? 'Saving change…' : 'Confirm access change'}</button></div>
      </>}
    </form>
  </div>;
}
