export const formatNumber = (value, digits = 0) => value == null || !Number.isFinite(Number(value))
  ? '—' : Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });

export const formatDate = (value, withTime = false) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  }).format(new Date(value));
};

export const readable = (value) => {
  if (!value) return 'Unknown';
  const str = String(value);
  if (str === 'TEMPLATE_CREATE') return 'Template Created';
  if (str === 'TEMPLATE_UPDATE') return 'Template Updated';
  if (str === 'TEMPLATE_DELETE') return 'Template Deleted';
  if (str === 'REPORT_STATUS_CHANGE') return 'Ticket / Report Response';
  if (str === 'USER_STATUS_CHANGE') return 'User Status Change';
  if (str === 'USER_ROLE_CHANGE') return 'User Role Change';
  if (str === 'ADMIN_BOOTSTRAP') return 'Admin Provisioning';
  if (str === 'TEMPLATE') return 'Template';
  if (str === 'REPORT') return 'Ticket / Report';
  if (str === 'USER') return 'User Account';
  return str.replace(/^ROLE_/, '').toLowerCase().replaceAll('_', ' ').replace(/^./, letter => letter.toUpperCase());
};

export const initials = (value) => (value || 'DT').trim().split(/\s+/).map(word => word[0]).join('').slice(0, 2).toUpperCase();

export const formatBytes = (value) => value == null ? '—' : `${formatNumber(value / 1048576, 1)} MB`;
