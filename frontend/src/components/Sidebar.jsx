import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileCode2, Sparkles, BarChart2,
  Users, Trophy, Star, Settings, Plus, LogOut, Brain, Terminal, Shield, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useShortcuts } from '../utils/shortcutsStore';
import PracticeShortcutsModal from './common/PracticeShortcutsModal';

/* ── Handcrafted DevType logo — pure SVG ── */
function LogoMark() {
  return (
    <div className="logo-mark">
      <svg width="18" height="13" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* < */}
        <path d="M4.5 1L1 5.5L4.5 10" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        {/* > */}
        <path d="M11.5 1L15 5.5L11.5 10" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        {/* / */}
        <path d="M9.5 0.5L6.5 10.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',     to: '/dashboard' },
  { icon: Brain,           label: 'SRS Revision',  to: '/revision' },
  { icon: FileCode2,       label: 'Templates',     to: '/templates' },
  { icon: Terminal,        label: 'Custom Studio', to: '/custom-studio' },
  { icon: BarChart2,       label: 'Reports',       to: '/reports' },
  { icon: Users,           label: 'Multiplayer',   to: '/multiplayer' },
  { icon: Trophy,          label: 'Leaderboard',   to: '/leaderboard' },
  { icon: Star,            label: 'Achievements',  to: '/achievements' },
];

export default function Sidebar({ mobileOpen = false, onNavigate, closeButtonRef }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { shortcuts, removeShortcut } = useShortcuts();
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  const displayName = user?.displayName || user?.username || 'Developer';
  const userInitials = (displayName || 'DT')
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = (e) => {
    e.stopPropagation();
    logout();
    navigate('/login', { state: { notice: 'You have been successfully logged out.' } });
  };

  return (
    <>
      <aside id="workspace-navigation" className={`sidebar ${mobileOpen ? 'is-mobile-open' : ''}`} onClick={event => { if (event.target.closest('a')) onNavigate?.(); }}>
        <button ref={closeButtonRef} className="icon-btn workspace-close-button" aria-label="Close navigation" onClick={onNavigate}><X size={20} /></button>

        {/* ── Logo ── */}
        <div className="sidebar-logo-row">
          <LogoMark />
          <span className="logo-wordmark">DevType</span>
        </div>

        <div className="sidebar-scroll">
          {/* ── Navigation ── */}
          <div className="nav-group">
            {NAV.map(({ icon: Icon, label, to }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <Icon size={18} strokeWidth={2} />
                <span>{label}</span>
              </NavLink>
            ))}

            {user?.role === 'ADMIN' && (
              <NavLink
                to="/admin"
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <Shield size={18} strokeWidth={2} />
                <span style={{ fontWeight: 600 }}>Admin Console</span>
              </NavLink>
            )}
          </div>

          {/* ── Workspace ── */}
          <div className="nav-section-label">
            <span>Practice shortcuts</span>
            <button
              type="button"
              className="shortcuts-add-trigger-btn"
              title="Manage practice shortcuts"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsShortcutsModalOpen(true);
              }}
              aria-label="Manage practice shortcuts"
            >
              <Plus size={14} strokeWidth={2.2} />
            </button>
          </div>

          <div className="ws-group">
            {shortcuts.map((item) => {
              const SourceIcon = item.source === 'srs' ? Brain : item.source === 'custom' ? Terminal : FileCode2;
              return (
                <div key={item.id} className="ws-item-wrapper">
                  <NavLink
                    to={item.to}
                    className="ws-item"
                    title={`Open ${item.name} (${item.lang})`}
                    onClick={() => onNavigate?.()}
                  >
                    <SourceIcon size={16} strokeWidth={1.8} className="ws-file-icon" />
                    <div className="ws-info">
                      <div className="ws-name">{item.name}</div>
                      <div className="ws-meta">{item.lang}</div>
                    </div>
                  </NavLink>
                  <button
                    type="button"
                    className="ws-quick-remove"
                    title={`Remove ${item.name} from shortcuts`}
                    aria-label={`Remove ${item.name} from shortcuts`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeShortcut(item.id);
                    }}
                  >
                    <X size={12} strokeWidth={2.4} />
                  </button>
                </div>
              );
            })}

            {shortcuts.length === 0 && (
              <button
                type="button"
                className="ws-empty-prompt"
                onClick={() => setIsShortcutsModalOpen(true)}
              >
                <Plus size={13} />
                <span>Add shortcut...</span>
              </button>
            )}
          </div>

          {/* ── Settings (pushed toward bottom) ── */}
          <div style={{ marginTop: 'auto', paddingTop: 14 }}>
            <NavLink to="/settings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Settings size={18} strokeWidth={2} />
              <span>Settings</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--t3)' }}>›</span>
            </NavLink>
          </div>
        </div>

        {/* ── User footer (Modern Apple Silicon Obsidian & Cobalt) ── */}
        <div className="sidebar-footer">
          <div
            className="user-row"
            onClick={() => { onNavigate?.(); navigate('/profile'); }}
            style={{ cursor: 'pointer' }}
            title="View your developer profile"
          >
            <div className="user-avatar">{userInitials}</div>
            <div className="user-info">
              <div className="user-name">{displayName}</div>
              <div className="user-level">
                Lvl {user?.level || 1} · {(user?.totalXp || 0).toLocaleString()} XP
              </div>
              <div className="xp-bar">
                <div className="xp-bar-fill" style={{ width: `${Math.min(100, Math.max(0, user?.levelProgressPercent || 0))}%` }} />
              </div>
            </div>
            <button
              type="button"
              className="sidebar-logout-icon-btn"
              title="Sign out of account"
              onClick={handleLogout}
              aria-label="Log Out"
            >
              <LogOut size={15} strokeWidth={2} />
            </button>
          </div>
        </div>
      </aside>

      <PracticeShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </>
  );
}
