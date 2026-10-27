import { useCallback, useState } from 'react';
import { ArrowRight, FileClock, LockKeyhole } from 'lucide-react';
import { adminService } from '../../services/adminService';
import useAdminQuery from './useAdminQuery';
import { Badge, DetailList, Dialog, EmptyState, Pagination, Panel, QueryState } from './AdminPrimitives';
import { formatDate, initials, readable } from './adminFormat';

export default function AdminAudit({ refreshKey }) {
  const [filters, setFilters] = useState({ actionType: '', targetType: '', page: 0 });
  const [selected, setSelected] = useState(null);
  const fetchLogs = useCallback(() => adminService.getAuditLogs({ ...filters, size: 15 }), [filters]);
  const query = useAdminQuery(fetchLogs, refreshKey);
  const update = (key, value) => setFilters(previous => ({ ...previous, [key]: value, page: 0 }));
  return <>
    <div className="adm-info adm-audit-info"><LockKeyhole size={18} /><div><strong>Administrative accountability</strong><p>Review who changed what, when it happened, and the reason recorded. This view is read-only.</p></div></div>
    <Panel title="Audit log" subtitle="Account access changes, moderation decisions, and administrator provisioning.">
      <div className="adm-toolbar"><select aria-label="Filter audit log by action" value={filters.actionType} onChange={event => update('actionType', event.target.value)}><option value="">All actions</option><option value="USER_STATUS_CHANGE">User status change</option><option value="USER_ROLE_CHANGE">User role change</option><option value="REPORT_STATUS_CHANGE">Report status change</option><option value="ADMIN_BOOTSTRAP">Administrator provisioning</option></select><select aria-label="Filter audit log by target" value={filters.targetType} onChange={event => update('targetType', event.target.value)}><option value="">All targets</option><option value="USER">User accounts</option><option value="REPORT">Reports</option></select>{(filters.actionType || filters.targetType) && <button className="adm-text-link" onClick={() => setFilters({ actionType: '', targetType: '', page: 0 })}>Clear filters</button>}</div>
      <QueryState query={query} label="audit log">
        {query.data?.content?.length ? <div className="adm-table-scroll"><table className="adm-table"><thead><tr><th scope="col">Administrator</th><th scope="col">Action</th><th scope="col">Target</th><th scope="col">Change</th><th scope="col">Recorded</th><th scope="col"><span className="adm-sr-only">Details</span></th></tr></thead><tbody>{query.data.content.map(entry => <tr key={entry.id}>
          <td><div className="adm-person"><span className="adm-avatar adm-avatar--small">{initials(entry.adminUser?.displayName || entry.adminUser?.username)}</span><div><strong>{entry.adminUser?.displayName || entry.adminUser?.username || 'System'}</strong><span>@{entry.adminUser?.username || 'system'}</span></div></div></td><td>{readable(entry.actionType)}</td><td>{readable(entry.targetType)} #{entry.targetId}</td><td><div className="adm-state-change"><span>{readable(entry.previousState)}</span><ArrowRight size={13} /><Badge value={entry.newState} /></div></td><td>{formatDate(entry.createdAt, true)}</td><td><button className="adm-button adm-button--small" aria-label={`View audit event ${entry.id}`} onClick={() => setSelected(entry)}>Details</button></td>
        </tr>)}</tbody></table></div> : <EmptyState icon={FileClock} title="No matching audit events" description="Recorded changes will appear here. Adjust the filters to explore other events." />}
        <Pagination page={query.data?.number || 0} totalPages={query.data?.totalPages} totalElements={query.data?.totalElements || 0} size={15} onPage={page => setFilters(previous => ({ ...previous, page }))} />
      </QueryState>
    </Panel>
    {selected && <Dialog title={`Audit event #${selected.id}`} subtitle={readable(selected.actionType)} onClose={() => setSelected(null)}><div className="adm-dialog-body"><DetailList items={[
      ['Administrator', selected.adminUser?.username || 'System'], ['Target', `${readable(selected.targetType)} #${selected.targetId}`], ['Previous state', readable(selected.previousState)], ['New state', readable(selected.newState)], ['Recorded', formatDate(selected.createdAt, true)], ['Source IP (recorded)', selected.ipAddress || 'Not recorded'],
    ]} /><div className="adm-report-content"><h3>Reason recorded</h3><p>{selected.reason || 'No reason was recorded for this event.'}</p></div></div></Dialog>}
  </>;
}
