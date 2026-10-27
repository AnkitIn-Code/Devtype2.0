import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Bell, Play, Menu } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import NotificationPopover from './notifications/NotificationPopover';
import UniversalSearch from './common/UniversalSearch';

export default function TopBar({ onOpenMenu, menuOpen }) {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [notifOpen]);

  return (
    <header className="topbar">
      <button className="icon-btn workspace-menu-button" aria-label="Open navigation" aria-controls="workspace-navigation" aria-expanded={menuOpen} onClick={onOpenMenu}><Menu size={20} /></button>
      {/* Universal Search & Command Palette (⌘K) */}
      <UniversalSearch />

      <div className="topbar-spacer" />

      <div className="topbar-right">
        {/* Dynamic iOS/macOS Theme Toggle Button */}
        <button
          className={`icon-btn btn-theme-toggle ${isDark ? 'is-dark' : 'is-light'}`}
          id="btn-theme"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {isDark ? (
            <Sun size={16} strokeWidth={2.2} className="theme-icon-sun" />
          ) : (
            <Moon size={16} strokeWidth={2} className="theme-icon-moon" />
          )}
        </button>

        {/* Notification Bell Anchor & Popover Dropdown */}
        <div className="notif-anchor-wrap" ref={notifRef}>
          <button
            className={`icon-btn ${notifOpen ? 'active' : ''}`}
            id="btn-notif"
            onClick={() => setNotifOpen((prev) => !prev)}
            title="Notifications"
            aria-label={`Notifications (${unreadCount} unread)`}
            aria-expanded={notifOpen}
          >
            <Bell size={16} strokeWidth={2} />
            {unreadCount > 0 && <span className="notif-pip" />}
          </button>

          {notifOpen && (
            <NotificationPopover onClose={() => setNotifOpen(false)} />
          )}
        </div>

        {/* Dark pill button — navigates to practice workspace */}
        <button
          className="btn-start-practice"
          id="btn-start-practice"
          aria-label="Start practice"
          onClick={() => navigate('/practice')}
        >
          <Play size={12} fill="currentColor" strokeWidth={0} />
          <span>Start Practice</span>
        </button>
      </div>
    </header>
  );
}
