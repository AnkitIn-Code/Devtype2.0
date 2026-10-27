export const formatNumber = (value, digits = 0) => value == null || !Number.isFinite(Number(value))
  ? '—' : Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });

export const formatDate = (value, withTime = false) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  }).format(new Date(value));
};

export const readable = (value) => value
  ? String(value).replace(/^ROLE_/, '').toLowerCase().replaceAll('_', ' ').replace(/^./, letter => letter.toUpperCase()) : 'Unknown';

export const initials = (value) => (value || 'DT').trim().split(/\s+/).map(word => word[0]).join('').slice(0, 2).toUpperCase();

export const formatBytes = (value) => value == null ? '—' : `${formatNumber(value / 1048576, 1)} MB`;
