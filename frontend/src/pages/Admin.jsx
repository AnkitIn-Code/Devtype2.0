import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Activity, ChevronRight, Code2, FileClock, LayoutDashboard, LogOut, Menu, RefreshCw, ShieldCheck, Users, ClipboardList, Moon, Sun, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import useAdminQuery from '../components/admin/useAdminQuery';
import { initials } from '../components/admin/adminFormat';
import AdminOverview from '../components/admin/AdminOverview';
import AdminUsers from '../components/admin/AdminUsers';
import AdminReports from '../components/admin/AdminReports';
import AdminAudit from '../components/admin/AdminAudit';
import AdminSystem from '../components/admin/AdminSystem';
import './Admin.css';

const NAVIGATION = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, description: 'A clear view of your community, activity, and platform health.' },
  { to: '/admin/users', label: 'User management', icon: Users, description: 'Understand your community and manage account access responsibly.' },
  { to: '/admin/reports', label: 'Moderation', icon: ClipboardList, description: 'Review reports, document decisions, and protect your community.' },
  { to: '/admin/audit', label: 'Audit log', icon: FileClock, description: 'A traceable history of administrative changes across DevType.' },
  { to: '/admin/system', label: 'System health', icon: Activity, description: 'Monitor application performance and investigate operational issues.' },
];

export default function Admin() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNav, setMobileNav] = useState(false);
  const closeNavButton = useRef(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const overview = useAdminQuery(adminService.getOverview, refreshKey);
  const metrics = useAdminQuery(adminService.getMetricsSummary, refreshKey);
  const current = NAVIGATION.find(item => item.to === location.pathname.replace(/\/$/, '')) || NAVIGATION[0];
  const displayName = user?.displayName || user?.username || 'Administrator';
  const waiting = overview.data ? overview.data.openReports + overview.data.pendingReviewReports : null;
  const refresh = () => setRefreshKey(value => value + 1);
  const loading = overview.loading || metrics.loading;

  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${current.label} · DevType Administration`;
    return () => { document.title = originalTitle; };
  }, [current.label]);
  useEffect(() => {
    if (!mobileNav) return;
    const previousFocus = document.activeElement;
    closeNavButton.current?.focus();
    const close = event => { if (event.key === 'Escape') setMobileNav(false); };
    const wideScreen = window.matchMedia('(min-width: 761px)');
    const closeOnResize = event => { if (event.matches) setMobileNav(false); };
    window.addEventListener('keydown', close);
    wideScreen.addEventListener('change', closeOnResize);
    return () => { window.removeEventListener('keydown', close); wideScreen.removeEventListener('change', closeOnResize); previousFocus?.focus(); };
  }, [mobileNav]);

  return <div className="admin-shell">
    <a className="adm-skip-link" href="#admin-content">Skip to content</a>
    {mobileNav && <button className="adm-nav-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
    <aside id="admin-navigation" className={`adm-sidebar ${mobileNav ? 'is-open' : ''}`}>
      <div className="adm-brand-row"><Link to="/admin" className="adm-brand" onClick={() => setMobileNav(false)}><span className="adm-brand-mark"><Code2 size={23} /></span><span>DevType<small>ADMIN CONSOLE</small></span></Link><button ref={closeNavButton} className="adm-mobile-close adm-icon-button" aria-label="Close navigation" onClick={() => setMobileNav(false)}><X size={20} /></button></div>
      <div className="adm-workspace"><span className="adm-workspace-icon"><ShieldCheck size={17} /></span><div><strong>Platform workspace</strong><span>Administration</span></div></div>
      <p className="adm-nav-label">MANAGE</p>
      <nav aria-label="Administration">{NAVIGATION.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/admin'} className={({ isActive }) => `adm-nav-link ${isActive ? 'is-active' : ''}`} onClick={() => setMobileNav(false)}><Icon size={18} /><span>{label}</span>{to === '/admin/reports' && waiting > 0 && <b>{waiting}</b>}</NavLink>)}</nav>
      <div className="adm-sidebar-bottom"><div className="adm-sidebar-note"><ShieldCheck size={18} /><strong>Accountable by design</strong><p>Access changes and moderation decisions are recorded for review.</p><Link to="/admin/audit" onClick={() => setMobileNav(false)}>Explore the audit log <ChevronRight size={14} /></Link></div><div className="adm-sidebar-profile"><span className="adm-avatar">{initials(displayName)}</span><div><strong title={displayName}>{displayName}</strong><span>Administrator</span></div><button aria-label="Sign out" title="Sign out" className="adm-icon-button" onClick={() => { logout(); navigate('/login', { replace: true }); }}><LogOut size={17} /></button></div></div>
    </aside>
    <div className="adm-main" inert={mobileNav}>
      <header className="adm-topbar"><div className="adm-breadcrumb"><button className="adm-menu-button adm-icon-button" aria-label="Open administration navigation" aria-expanded={mobileNav} aria-controls="admin-navigation" onClick={() => setMobileNav(true)}><Menu size={21} /></button><ShieldCheck size={16} /><span>Administration</span><ChevronRight size={14} /><strong>{current.label}</strong></div><div className="adm-topbar-right"><button className="adm-icon-button" onClick={toggleTheme} aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'} title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}>{isDark ? <Sun size={17} /> : <Moon size={17} />}</button><span className="adm-access-label"><span />Administrator access</span><span className="adm-topbar-avatar" title={`Administrator: ${displayName}`}>{initials(displayName)}</span></div></header>
      <main id="admin-content" className="adm-content" tabIndex={-1}>
        <div className="adm-page-heading"><div><p className="adm-eyebrow">DEVTYPE / OPERATIONS</p><h1>{current.label}</h1><p>{current.description}</p></div><button className="adm-button" disabled={loading} onClick={refresh}><RefreshCw size={16} className={loading ? 'adm-spin' : ''} />{loading ? 'Refreshing…' : 'Refresh data'}</button></div>
        <Routes>
          <Route index element={<AdminOverview overview={overview} metrics={metrics} refreshKey={refreshKey} />} />
          <Route path="users" element={<AdminUsers refreshKey={refreshKey} onChange={refresh} />} />
          <Route path="reports" element={<AdminReports refreshKey={refreshKey} onChange={refresh} />} />
          <Route path="audit" element={<AdminAudit refreshKey={refreshKey} />} />
          <Route path="system" element={<AdminSystem metrics={metrics} />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
        <footer className="adm-footer"><span>DevType Administration</span><span>Restricted workspace <span aria-hidden="true">·</span> {user?.username || displayName}</span></footer>
      </main>
    </div>
  </div>;
}
