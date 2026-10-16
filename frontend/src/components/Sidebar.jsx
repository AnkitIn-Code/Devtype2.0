// src/components/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileCode2, Sparkles, BarChart2,
  Users, Trophy, Star, Settings, Plus
} from 'lucide-react';

/* ── Handcrafted CodeType logo — pure SVG ── */
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
  { icon: LayoutDashboard, label: 'Dashboard',    to: '/dashboard' },
  { icon: FileCode2,       label: 'Templates',    to: '/templates' },
  { icon: Sparkles,        label: 'AI Generator', to: '/ai-generator' },
  { icon: BarChart2,       label: 'Reports',      to: '/reports' },
  { icon: Users,           label: 'Multiplayer',  to: '/multiplayer' },
  { icon: Trophy,          label: 'Leaderboard',  to: '/leaderboard' },
  { icon: Star,            label: 'Achievements', to: '/achievements' },
];

/* Minimal native macOS workspace items */
const WORKSPACE = [
  { name: 'LRU Cache',       lang: 'C++',    ago: '30m ago', to: '/practice?snippet=cpp-lru-cache' },
  { name: 'Binary Search',   lang: 'C++',    ago: '1d ago',  to: '/practice?snippet=cpp-binary-search' },
  { name: 'Two Sum',         lang: 'Python', ago: '2d ago',  to: '/practice?snippet=py-two-sum' },
  { name: 'Debounce Fn',     lang: 'JS',     ago: '3d ago',  to: '/practice?snippet=js-debounce' },
];

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      {/* ── macOS traffic lights ── */}
      <div className="sidebar-traffic-lights">
        <div className="tl tl-close"    title="Close" />
        <div className="tl tl-minimize" title="Minimize" />
        <div className="tl tl-maximize" title="Zoom" />
      </div>

      {/* ── Logo ── */}
      <div className="sidebar-logo-row">
        <LogoMark />
        <span className="logo-wordmark">CodeType</span>
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
        </div>

        {/* ── Workspace ── */}
        <div className="nav-section-label">
          <span>Workspace</span>
          <button
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--t3)', display: 'flex', alignItems: 'center',
              padding: '0 2px',
            }}
            title="Start new practice"
            onClick={() => navigate('/practice')}
          >
            <Plus size={14} strokeWidth={2.2} />
          </button>
        </div>

        <div className="ws-group">
          {WORKSPACE.map(item => (
            <div
              key={item.name}
              className="ws-item"
              onClick={() => navigate(item.to)}
              title={`Open ${item.name}`}
            >
              <FileCode2 size={16} strokeWidth={1.8} className="ws-file-icon" />
              <div className="ws-info">
                <div className="ws-name">{item.name}</div>
                <div className="ws-meta">{item.lang} · {item.ago}</div>
              </div>
            </div>
          ))}
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
          onClick={() => navigate('/profile')}
          style={{ cursor: 'pointer' }}
          title="View your developer profile"
        >
          <div className="user-avatar">SP</div>
          <div className="user-info">
            <div className="user-name">Alex Spoor</div>
            <div className="user-level">Level 24 · 24.8k XP</div>
            <div className="xp-bar">
              <div className="xp-bar-fill" style={{ width: '82%' }} />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
