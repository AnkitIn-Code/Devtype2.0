import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, CheckCircle2, ClipboardList, FileCode2, ShieldCheck, Users } from 'lucide-react';
import { adminService } from '../../services/adminService';
import useAdminQuery from './useAdminQuery';
import { Badge, EmptyState, Metric, Panel, QueryState } from './AdminPrimitives';
import { formatDate, formatNumber, initials, readable } from './adminFormat';

export default function AdminOverview({ overview, metrics, refreshKey }) {
  const fetchAudit = useCallback(() => adminService.getAuditLogs({ size: 5 }), []);
  const audit = useAdminQuery(fetchAudit, refreshKey);
  const data = overview.data;
  const health = metrics.data;
  const awaiting = data ? data.openReports + data.pendingReviewReports : null;
  const accounts = [
    { label: 'Active', value: data?.activeUsers, color: 'green' },
    { label: 'Suspended', value: data?.suspendedUsers, color: 'amber' },
    { label: 'Deactivated', value: data?.deactivatedUsers, color: 'gray' },
  ];
  return <>
    <div className="adm-section-intro"><span><span className="adm-status-dot" />Platform snapshot</span><span>Account and activity totals · all time</span></div>
    <div className="adm-metric-grid">
      <Metric label="Registered accounts" value={formatNumber(data?.totalUsers)} description={data ? `${formatNumber(data.newUsersLast7Days)} joined in the last 7 days` : 'Waiting for platform data'} icon={Users} />
      <Metric label="Practice sessions" value={formatNumber(data?.totalPracticeSessions)} description={data ? `${formatNumber(data.totalPracticeDurationSeconds / 3600, 1)} hours of total practice` : 'Waiting for activity data'} icon={FileCode2} tone="violet" />
      <Metric label="Awaiting review" value={formatNumber(awaiting)} description={data ? `${formatNumber(data.openReports)} open · ${formatNumber(data.pendingReviewReports)} under review` : 'Waiting for moderation data'} icon={ClipboardList} tone="amber" />
      <Metric label="Service status" value={health ? (health.system?.status === 'UP' ? 'Operational' : readable(health.system?.status)) : 'Unavailable'} description={health ? `Uptime ${health.system?.uptimeFormatted || 'unavailable'}` : 'Health has not been confirmed'} icon={Activity} tone={health?.system?.status === 'UP' ? 'green' : 'gray'} />
    </div>

    <div className="adm-overview-grid">
      <Panel title="Community overview" subtitle="Account status and recent registrations" action={<Link className="adm-text-link" to="/admin/users">Manage users <ArrowRight size={15} /></Link>}>
        <QueryState query={overview} label="platform overview">
          <div className="adm-community">
            <div className="adm-community-total"><strong>{formatNumber(data?.totalUsers)}</strong><span>total accounts</span><Badge value="USER">{formatNumber(data?.standardUsers)} standard</Badge></div>
            <div className="adm-stacked-bar" role="img" aria-label={accounts.map(item => `${item.label}: ${item.value ?? 'unavailable'}`).join(', ')}>
              {accounts.map(item => <span key={item.label} className={`adm-segment-${item.color}`} style={{ width: `${data?.totalUsers ? item.value / data.totalUsers * 100 : 0}%` }} />)}
            </div>
            <div className="adm-account-legend">{accounts.map(item => <div key={item.label}><span><i className={`adm-segment-${item.color}`} />{item.label}</span><strong>{formatNumber(item.value)}</strong></div>)}</div>
            <div className="adm-community-stats"><div><span>Joined in 7 days</span><strong>{formatNumber(data?.newUsersLast7Days)}</strong></div><div><span>Joined in 30 days</span><strong>{formatNumber(data?.newUsersLast30Days)}</strong></div><div><span>Demo accounts</span><strong>{formatNumber(data?.demoUsers)}</strong></div></div>
          </div>
        </QueryState>
      </Panel>
      <Panel title="Operations at a glance" subtitle="Where your attention is needed">
        <QueryState query={overview} label="operational summary">
          <div className="adm-operations">
            <Link to="/admin/reports?status=OPEN" className="adm-operation"><span className="adm-operation-icon adm-tone-amber"><ClipboardList size={18} /></span><div><strong>Open reports</strong><span>Ready for initial review</span></div><b>{formatNumber(data?.openReports)}</b><ArrowRight size={16} /></Link>
            <Link to="/admin/reports?status=UNDER_REVIEW" className="adm-operation"><span className="adm-operation-icon adm-tone-blue"><ShieldCheck size={18} /></span><div><strong>In review</strong><span>Cases awaiting a decision</span></div><b>{formatNumber(data?.pendingReviewReports)}</b><ArrowRight size={16} /></Link>
            <Link to="/admin/users?status=SUSPENDED" className="adm-operation"><span className="adm-operation-icon adm-tone-gray"><Users size={18} /></span><div><strong>Suspended accounts</strong><span>Review access restrictions</span></div><b>{formatNumber(data?.suspendedUsers)}</b><ArrowRight size={16} /></Link>
            {awaiting === 0 && <p className="adm-positive-note"><CheckCircle2 size={16} />Your moderation queue is clear.</p>}
          </div>
        </QueryState>
      </Panel>
    </div>

    <div className="adm-overview-grid">
      <Panel title="Recent administrative activity" subtitle="Changes recorded in the audit log" action={<Link className="adm-text-link" to="/admin/audit">View audit log <ArrowRight size={15} /></Link>}>
        <QueryState query={audit} label="recent activity">
          {audit.data?.content?.length ? <div className="adm-activity-list">{audit.data.content.map(entry => <div className="adm-activity" key={entry.id}>
            <span className="adm-avatar adm-avatar--small">{initials(entry.adminUser?.displayName || entry.adminUser?.username)}</span><div><strong>{readable(entry.actionType)}</strong><p>{entry.adminUser?.displayName || entry.adminUser?.username || 'System'} <span>· {readable(entry.targetType)} #{entry.targetId}</span></p></div><time dateTime={entry.createdAt}>{formatDate(entry.createdAt, true)}</time>
          </div>)}</div> : <EmptyState title="No administrative changes yet" description="Role changes, account updates, and moderation decisions will appear here." />}
        </QueryState>
      </Panel>
      <Panel title="Service health" subtitle="Latest server observation" action={<Link className="adm-text-link" to="/admin/system">Details <ArrowRight size={15} /></Link>}>
        <QueryState query={metrics} label="service health"><div className="adm-health-summary">
          <div><span>Application</span><Badge value={health?.system?.status} /></div>
          <div><span>Database</span><Badge value={health?.system?.databaseStatus} /></div>
          <div><span>Mean response time</span><strong>{formatNumber(health?.http?.meanLatencyMs, 1)} ms</strong></div>
          <div><span>HTTP error rate</span><strong>{formatNumber(health?.http?.errorRatePercent, 2)}%</strong></div>
          <p>Request metrics are cumulative since the application started.</p>
        </div></QueryState>
      </Panel>
    </div>
  </>;
}
