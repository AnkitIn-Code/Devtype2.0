import { Activity, Database, Gauge, HardDrive } from 'lucide-react';
import { Badge, DetailList, Metric, Panel, QueryState } from './AdminPrimitives';
import { formatBytes, formatDate, formatNumber } from './adminFormat';

function Utilization({ label, value, detail }) {
  const percentage = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return <div className="adm-utilization"><div><strong>{label}</strong><span>{formatNumber(value, 1)}%</span></div><div className="adm-progress" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}><span className={percentage > 85 ? 'adm-segment-amber' : 'adm-segment-blue'} style={{ width: `${percentage}%` }} /></div><p>{detail}</p></div>;
}

export default function AdminSystem({ metrics }) {
  const data = metrics.data;
  return <QueryState query={metrics} label="system health">
    {data && <>
      <div className="adm-system-banner"><div><Activity size={21} /><div><strong>Application health</strong><p>Observed {formatDate(data.timestamp, true)} · Uptime {data.system.uptimeFormatted}</p></div></div><Badge value={data.system.status} /></div>
      <div className="adm-metric-grid">
        <Metric label="HTTP requests" value={formatNumber(data.http.totalRequests)} description="Since application start" icon={Activity} />
        <Metric label="Mean response time" value={`${formatNumber(data.http.meanLatencyMs, 1)} ms`} description={`p95: ${data.http.p95LatencyMs == null ? 'Not available' : `${formatNumber(data.http.p95LatencyMs, 1)} ms`}`} icon={Gauge} tone="green" />
        <Metric label="Heap utilization" value={`${formatNumber(data.memory.heapUtilizationPercent, 1)}%`} description={`${formatBytes(data.memory.heapUsedBytes)} used`} icon={HardDrive} tone="violet" />
        <Metric label="Database connections" value={formatNumber(data.database.activeConnections)} description={`${formatNumber(data.database.maxConnections)} maximum · ${formatNumber(data.database.pendingConnections)} pending`} icon={Database} tone="amber" />
      </div>
      <div className="adm-overview-grid adm-overview-grid--equal">
        <Panel title="Request performance" subtitle="Cumulative request counters since application start"><div className="adm-panel-body"><DetailList items={[
          ['Client errors (4xx)', formatNumber(data.http.errorCount4xx)], ['Server errors (5xx)', formatNumber(data.http.errorCount5xx)], ['Error rate', `${formatNumber(data.http.errorRatePercent, 2)}%`], ['Mean throughput', `${formatNumber(data.http.throughputPerMinute, 1)} requests/min`],
          ['p50 latency', data.http.p50LatencyMs == null ? 'Not available' : `${formatNumber(data.http.p50LatencyMs, 1)} ms`], ['p95 latency', data.http.p95LatencyMs == null ? 'Not available' : `${formatNumber(data.http.p95LatencyMs, 1)} ms`], ['p99 latency', data.http.p99LatencyMs == null ? 'Not available' : `${formatNumber(data.http.p99LatencyMs, 1)} ms`], ['Maximum latency', `${formatNumber(data.http.maxLatencyMs, 1)} ms`],
        ]} /></div></Panel>
        <Panel title="Resource utilization" subtitle="Current memory and database pool observations"><div className="adm-panel-body">
          <Utilization label="JVM heap" value={data.memory.heapUtilizationPercent} detail={`${formatBytes(data.memory.heapUsedBytes)} of ${formatBytes(data.memory.heapMaxBytes)}`} />
          <Utilization label="Database connection pool" value={data.database.poolUtilizationPercent} detail={`${formatNumber(data.database.activeConnections)} active · ${formatNumber(data.database.idleConnections)} idle · ${formatNumber(data.database.pendingConnections)} pending`} />
          <div className="adm-health-row"><span>Database health</span><Badge value={data.system.databaseStatus} /></div>
        </div></Panel>
        <Panel title="Authentication activity" subtitle="Sign-in attempts since application start"><div className="adm-panel-body"><DetailList items={[
          ['Successful sign-ins', formatNumber(data.auth.successfulLogins)], ['Failed sign-ins', formatNumber(data.auth.failedLogins)],
        ]} /><p className="adm-footnote">Failed attempts are a signal to investigate; they do not by themselves confirm an attack.</p></div></Panel>
        <Panel title="Runtime details" subtitle="Current application process"><div className="adm-panel-body"><DetailList items={[
          ['Started', formatDate(data.system.startTime, true)], ['Live threads', formatNumber(data.threads.liveThreads)], ['Peak threads', formatNumber(data.threads.peakThreads)], ['Non-heap memory', formatBytes(data.memory.nonHeapUsedBytes)],
        ]} /></div></Panel>
      </div>
      <p className="adm-footnote">Historical charts require a connected time-series store. This view displays the server’s latest snapshot.</p>
    </>}
  </QueryState>;
}
