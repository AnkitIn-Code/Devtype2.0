// src/components/TopBar.jsx
import { useNavigate } from 'react-router-dom';
import { Search, Moon, Bell, Play } from 'lucide-react';

export default function TopBar() {
  const navigate = useNavigate();

  return (
    <header className="topbar">
      {/* Search pill */}
      <div className="search-wrap">
        <Search className="search-icon" size={16} strokeWidth={2} />
        <input
          id="topbar-search"
          className="search-input"
          type="search"
          placeholder="Search templates, challenges, or users..."
          aria-label="Search"
          autoComplete="off"
        />
        <span className="search-kbd">⌘K</span>
      </div>

      <div className="topbar-spacer" />

      <div className="topbar-right">
        <button className="icon-btn" id="btn-theme" title="Toggle appearance">
          <Moon size={16} strokeWidth={2} />
        </button>

        <button className="icon-btn" id="btn-notif" title="Notifications">
          <Bell size={16} strokeWidth={2} />
          <span className="notif-pip" />
        </button>

        {/* Dark pill button — navigates to practice workspace */}
        <button
          className="btn-start-practice"
          id="btn-start-practice"
          onClick={() => navigate('/practice')}
        >
          <Play size={12} fill="currentColor" strokeWidth={0} />
          <span>Start Practice</span>
        </button>
      </div>
    </header>
  );
}
